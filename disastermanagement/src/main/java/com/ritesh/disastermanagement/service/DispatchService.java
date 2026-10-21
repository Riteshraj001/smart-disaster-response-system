package com.ritesh.disastermanagement.service;

import com.ritesh.disastermanagement.dto.DispatchOfferResponseDTO;
import com.ritesh.disastermanagement.dto.OfferDecisionRequestDTO;
import com.ritesh.disastermanagement.entity.DispatchOffer;
import com.ritesh.disastermanagement.entity.Incident;
import com.ritesh.disastermanagement.entity.IncidentAssignment;
import com.ritesh.disastermanagement.entity.ResponseTeam;
import com.ritesh.disastermanagement.entity.TeamMember;
import com.ritesh.disastermanagement.exception.ApiException;
import com.ritesh.disastermanagement.repository.DispatchOfferRepository;
import com.ritesh.disastermanagement.repository.IncidentAssignmentRepository;
import com.ritesh.disastermanagement.repository.IncidentRepository;
import com.ritesh.disastermanagement.repository.TeamMemberRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

@Service
public class DispatchService {
    private static final List<String> ACTIVE_OFFER_STATES = List.of("OFFERED");
    private static final List<String> ALL_OFFER_STATES = List.of("OFFERED", "ACCEPTED", "DECLINED", "EXPIRED");

    private final DispatchOfferRepository offers;
    private final IncidentRepository incidents;
    private final IncidentAssignmentRepository assignments;
    private final TeamMemberRepository members;
    private final TrackingTokenService tokens;

    @Value("${app.dispatch.offer-timeout-seconds:120}") private long offerTimeoutSeconds;
    @Value("${app.dispatch.offer-batch-size:1}") private int offerBatchSize;

    public DispatchService(DispatchOfferRepository offers, IncidentRepository incidents,
                           IncidentAssignmentRepository assignments, TeamMemberRepository members,
                           TrackingTokenService tokens) {
        this.offers = offers;
        this.incidents = incidents;
        this.assignments = assignments;
        this.members = members;
        this.tokens = tokens;
    }

    @Transactional
    public void createOffersForVerifiedIncident(Long incidentId) {
        Incident incident = incidents.findByIdForUpdate(incidentId).orElseThrow(() -> notFound("Incident " + incidentId + " was not found"));
        if (!"VERIFIED".equals(incident.getStatus()) || assignments.findByIncidentIdAndActiveTrue(incidentId).isPresent()) return;
        refreshOffers(incident);
    }

    @Transactional(readOnly = false)
    public List<DispatchOfferResponseDTO> responderOffers(String authorization) {
        TeamMember member = tokens.authenticatedResponder(authorization);
        incidents.findByStatus("VERIFIED").forEach(this::refreshOffers);
        List<DispatchOffer> current = offers.findByMemberIdAndStateInOrderByExpiresAtAsc(member.getId(), ACTIVE_OFFER_STATES);
        current.stream().map(DispatchOffer::getIncident).distinct().forEach(this::refreshOffers);
        return offers.findByMemberIdAndStateInOrderByExpiresAtAsc(member.getId(), ACTIVE_OFFER_STATES)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public DispatchOfferResponseDTO accept(String authorization, Long offerId) {
        TeamMember member = tokens.authenticatedResponder(authorization);
        member = members.findByIdForUpdate(member.getId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "Configured responder member was not found"));
        DispatchOffer offer = offers.findByIdForUpdate(offerId).orElseThrow(() -> notFound("Dispatch offer " + offerId + " was not found"));
        requireRecipient(offer, member);
        Incident incident = incidents.findByIdForUpdate(offer.getIncident().getId()).orElseThrow(() -> notFound("Incident was not found"));
        expireOfferIfNeeded(offer);
        if (!"OFFERED".equals(offer.getState())) {
            refreshOffers(incident);
            throw conflict("This dispatch offer is no longer available");
        }
        if (!"VERIFIED".equals(incident.getStatus())) throw conflict("The incident is no longer waiting for responder acceptance");
        if (assignments.findByIncidentIdAndActiveTrue(incident.getId()).isPresent()) throw conflict("Another responder has already accepted this incident");
        if (!member.isAvailable() || !member.getTeam().isAvailable()) throw conflict("The responder or response team is no longer available");
        if (assignments.findByMemberIdAndActiveTrueOrderByAssignedAtDesc(member.getId()).stream().anyMatch(this::isActiveIncidentAssignment)) {
            throw conflict("Responder already has an active incident assignment");
        }

        offer.setState("ACCEPTED");
        offer.setRespondedAt(Instant.now());
        offer.setDecisionReason("Accepted by responder");
        offers.save(offer);

        IncidentAssignment assignment = new IncidentAssignment();
        assignment.setIncident(incident);
        assignment.setTeam(member.getTeam());
        assignment.setMember(member);
        assignment.setNotes("Responder accepted dispatch offer #" + offer.getId());
        assignments.save(assignment);
        incident.setAssignedTeam(member.getTeam().getName());
        incident.setStatus("ASSIGNED");
        incident.setDispatchState("ACCEPTED");
        incidents.save(incident);
        expireOtherOffers(incident.getId(), offer.getId());
        return toDto(offer);
    }

    @Transactional
    public DispatchOfferResponseDTO decline(String authorization, Long offerId, OfferDecisionRequestDTO request) {
        TeamMember member = tokens.authenticatedResponder(authorization);
        DispatchOffer offer = offers.findByIdForUpdate(offerId).orElseThrow(() -> notFound("Dispatch offer " + offerId + " was not found"));
        requireRecipient(offer, member);
        Incident incident = incidents.findByIdForUpdate(offer.getIncident().getId()).orElseThrow(() -> notFound("Incident was not found"));
        expireOfferIfNeeded(offer);
        if (!"OFFERED".equals(offer.getState())) throw conflict("This dispatch offer is no longer available");
        offer.setState("DECLINED");
        offer.setRespondedAt(Instant.now());
        offer.setDecisionReason(request == null || request.getReason() == null || request.getReason().isBlank() ? "Declined by responder" : request.getReason().trim());
        offers.save(offer);
        refreshOffers(incident);
        return toDto(offer);
    }

    @Transactional
    public void closeOffersForAssignment(Long incidentId) {
        offers.findByIncidentIdAndStateIn(incidentId, ACTIVE_OFFER_STATES).forEach(offer -> {
            offer.setState("EXPIRED");
            offer.setRespondedAt(Instant.now());
            offer.setDecisionReason("Closed because the incident was assigned by an authorized dispatcher");
            offers.save(offer);
        });
    }

    private void refreshOffers(Incident incident) {
        if (!"VERIFIED".equals(incident.getStatus()) || assignments.findByIncidentIdAndActiveTrue(incident.getId()).isPresent()) return;
        if (severityRank(incident.getSeverity()) > 0 && hasUnassignedCritical(incident.getId())) {
            incident.setDispatchState("WAITING_FOR_PRIORITY");
            incidents.save(incident);
            return;
        }
        Instant now = Instant.now();
        offers.findByIncidentIdAndStateIn(incident.getId(), ACTIVE_OFFER_STATES).forEach(offer -> {
            if (offer.getExpiresAt() != null && !offer.getExpiresAt().isAfter(now)) {
                offer.setState("EXPIRED");
                offer.setRespondedAt(now);
                offer.setDecisionReason("Offer expired without responder acceptance");
                offers.save(offer);
            }
        });
        if (!offers.findByIncidentIdAndStateIn(incident.getId(), ACTIVE_OFFER_STATES).isEmpty()) {
            incident.setDispatchState("OFFERED");
            incidents.save(incident);
            return;
        }
        Set<Long> alreadyOffered = new HashSet<>();
        offers.findByIncidentIdAndStateIn(incident.getId(), ALL_OFFER_STATES).forEach(offer -> alreadyOffered.add(offer.getMember().getId()));
        List<TeamMember> candidates = members.findByAvailableTrueOrderByNameAsc().stream()
                .filter(member -> member.getTeam() != null && member.getTeam().isAvailable())
                .filter(member -> !alreadyOffered.contains(member.getId()))
                .filter(member -> assignments.findByMemberIdAndActiveTrueOrderByAssignedAtDesc(member.getId()).stream().noneMatch(this::isActiveIncidentAssignment))
                .sorted(Comparator
                        .comparingInt((TeamMember member) -> specializationMatches(incident.getDisasterType(), member.getTeam().getSpecialization()) ? 0 : 1)
                        .thenComparingDouble(member -> distanceFor(incident, member)))
                .toList();
        int limit = Math.max(1, offerBatchSize);
        for (int index = 0; index < Math.min(limit, candidates.size()); index++) {
            TeamMember member = candidates.get(index);
            DispatchOffer offer = new DispatchOffer();
            offer.setIncident(incident);
            offer.setTeam(member.getTeam());
            offer.setMember(member);
            offer.setState("OFFERED");
            offer.setOfferedAt(now);
            offer.setExpiresAt(now.plusSeconds(Math.max(1, offerTimeoutSeconds)));
            offer.setCandidateRank(index + 1);
            offers.save(offer);
        }
        if (candidates.isEmpty()) incident.setDispatchState("CRITICAL".equalsIgnoreCase(incident.getSeverity()) ? "ESCALATED" : "WAITING_FOR_RESPONDER");
        else incident.setDispatchState("OFFERED");
        incidents.save(incident);
    }

    private void expireOtherOffers(Long incidentId, Long acceptedOfferId) {
        offers.findByIncidentIdAndStateIn(incidentId, ACTIVE_OFFER_STATES).stream()
                .filter(offer -> !offer.getId().equals(acceptedOfferId))
                .forEach(offer -> {
                    offer.setState("EXPIRED");
                    offer.setRespondedAt(Instant.now());
                    offer.setDecisionReason("Another responder accepted the incident");
                    offers.save(offer);
                });
    }

    private void expireOfferIfNeeded(DispatchOffer offer) {
        if ("OFFERED".equals(offer.getState()) && offer.getExpiresAt() != null && !offer.getExpiresAt().isAfter(Instant.now())) {
            offer.setState("EXPIRED");
            offer.setRespondedAt(Instant.now());
            offer.setDecisionReason("Offer expired without responder acceptance");
            offers.save(offer);
        }
    }

    private void requireRecipient(DispatchOffer offer, TeamMember member) {
        if (!offer.getMember().getId().equals(member.getId())) throw new ApiException(HttpStatus.FORBIDDEN, "This dispatch offer is not addressed to the authenticated responder");
    }

    private boolean isActiveIncidentAssignment(IncidentAssignment assignment) {
        if (!assignment.isActive() || assignment.getIncident() == null) return false;
        String status = assignment.getIncident().getStatus();
        return !"RESPONSE_COMPLETED".equalsIgnoreCase(status)
                && !"RESOLVED".equalsIgnoreCase(status)
                && !"CANCELLED".equalsIgnoreCase(status);
    }

    private double distanceFor(Incident incident, TeamMember member) {
        Double distance = distanceOrNull(incident, member);
        return distance == null ? Double.MAX_VALUE : distance;
    }

    private Double distanceOrNull(Incident incident, TeamMember member) {
        if (incident.getLatitude() == null || incident.getLongitude() == null || member.getLastLatitude() == null || member.getLastLongitude() == null) return null;
        double earthRadius = 6371000d;
        double lat1 = Math.toRadians(incident.getLatitude());
        double lat2 = Math.toRadians(member.getLastLatitude());
        double dLat = Math.toRadians(member.getLastLatitude() - incident.getLatitude());
        double dLon = Math.toRadians(member.getLastLongitude() - incident.getLongitude());
        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
        return earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    }

    private DispatchOfferResponseDTO toDto(DispatchOffer offer) {
        Incident incident = offer.getIncident();
        ResponseTeam team = offer.getTeam();
        return new DispatchOfferResponseDTO(offer.getId(), incident.getId(), incident.getDisasterType(), incident.getLocation(), incident.getLatitude(), incident.getLongitude(), incident.getSeverity(), incident.getStatus(), incident.getDispatchState(), team.getId(), team.getName(), offer.getMember().getId(), offer.getMember().getName(), offer.getOfferedAt(), offer.getExpiresAt(), offer.getState(), offer.getDistanceMeters(), offer.getEstimatedTravelSeconds(), offer.getCandidateRank());
    }

    private boolean hasUnassignedCritical(Long excludingIncidentId) {
        return incidents.findAll().stream().anyMatch(item -> !item.getId().equals(excludingIncidentId)
                && "CRITICAL".equalsIgnoreCase(item.getSeverity())
                && "VERIFIED".equalsIgnoreCase(item.getStatus())
                && assignments.findByIncidentIdAndActiveTrue(item.getId()).isEmpty());
    }

    private boolean specializationMatches(String disasterType, String specialization) {
        if (disasterType == null || specialization == null) return false;
        String dt = disasterType.toLowerCase(Locale.ROOT);
        String sp = specialization.toLowerCase(Locale.ROOT);
        return sp.contains(dt) || dt.contains(sp)
                || (dt.contains("fire") && sp.contains("fire"))
                || (dt.contains("flood") && (sp.contains("rescue") || sp.contains("water") || sp.contains("flood")))
                || (dt.contains("medical") && (sp.contains("paramedic") || sp.contains("medical") || sp.contains("ambulance")));
    }

    private int severityRank(String severity) {
        return switch (severity == null ? "" : severity.toUpperCase(Locale.ROOT)) {
            case "CRITICAL" -> 0;
            case "HIGH" -> 1;
            case "MEDIUM" -> 2;
            case "LOW" -> 3;
            default -> 4;
        };
    }

    private ApiException conflict(String message) { return new ApiException(HttpStatus.CONFLICT, message); }
    private ApiException notFound(String message) { return new ApiException(HttpStatus.NOT_FOUND, message); }
}
