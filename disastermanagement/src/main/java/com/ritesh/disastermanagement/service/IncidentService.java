package com.ritesh.disastermanagement.service;

import com.ritesh.disastermanagement.dto.*;
import com.ritesh.disastermanagement.entity.*;
import com.ritesh.disastermanagement.exception.ApiException;
import com.ritesh.disastermanagement.repository.IncidentAssignmentRepository;
import com.ritesh.disastermanagement.repository.IncidentRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class IncidentService {
    private static final List<String> SEVERITIES = List.of("CRITICAL", "HIGH", "MEDIUM", "LOW");
    private static final List<String> STATUSES = List.of("PENDING_VERIFICATION", "VERIFIED", "ASSIGNED", "RESPONSE_DISPATCHED", "RESPONDING", "RESPONSE_COMPLETED", "RESOLVED");
    private final IncidentRepository incidents; private final IncidentAssignmentRepository assignments; private final ResponseTeamService teams; private final com.ritesh.disastermanagement.repository.ResponseVehicleRepository vehicles; private final TrackingTokenService trackingTokens; private final DispatchService dispatch;
    public IncidentService(IncidentRepository incidents, IncidentAssignmentRepository assignments, ResponseTeamService teams, com.ritesh.disastermanagement.repository.ResponseVehicleRepository vehicles, TrackingTokenService trackingTokens, DispatchService dispatch) { this.incidents = incidents; this.assignments = assignments; this.teams = teams; this.vehicles = vehicles; this.trackingTokens = trackingTokens; this.dispatch = dispatch; }

    @Transactional public IncidentResponseDTO saveIncident(IncidentRequestDTO r) {
        Incident i = new Incident(); i.setDisasterType(r.getDisasterType()); i.setLocation(r.getLocation()); i.setDescription(r.getDescription());
        i.setSeverity(severity(r.getSeverity() == null ? "MEDIUM" : r.getSeverity())); i.setSource(defaultValue(r.getSource(), "CITIZEN"));
        if (r.getStatus() != null && !"PENDING_VERIFICATION".equals(status(r.getStatus()))) throw new ApiException(HttpStatus.BAD_REQUEST, "New incidents must start in PENDING_VERIFICATION");
        i.setStatus("PENDING_VERIFICATION");
        // Legacy assignedTeam values on old rows are retained. New assignments require persistent team/member IDs.
        validateCoordinates(r.getLatitude(), r.getLongitude());
        i.setContactInfo(r.getContactInfo()); i.setImageUrl(r.getImageUrl()); i.setDeviceId(r.getDeviceId()); i.setLatitude(r.getLatitude()); i.setLongitude(r.getLongitude()); String trackingToken = trackingTokens.createIncidentToken(); i.setTrackingTokenHash(trackingTokens.hash(trackingToken)); IncidentResponseDTO response = dto(incidents.save(i)); response.setTrackingToken(trackingToken); return response;
    }
    @Transactional(readOnly = true) public List<IncidentResponseDTO> getAllIncidents() { return incidents.findAll().stream().sorted(incidentPriorityComparator()).map(this::dto).toList(); }
    @Transactional(readOnly = true) public PriorityQueueResponseDTO priorityQueue() {
        List<IncidentResponseDTO> unresolved = incidents.findAll().stream().filter(i -> !"RESOLVED".equals(i.getStatus())).sorted(incidentPriorityComparator()).map(this::dto).toList();
        List<IncidentResponseDTO> critical = unresolved.stream().filter(i -> "CRITICAL".equals(i.getSeverity())).toList();
        return new PriorityQueueResponseDTO(critical.size(), critical, unresolved);
    }
    @Transactional(readOnly = true) public IncidentResponseDTO getIncidentById(Long id) { return incidents.findById(id).map(this::dto).orElse(null); }
    @Transactional public IncidentResponseDTO updateIncident(Long id, IncidentRequestDTO r) {
        Incident i = incident(id); String previous = i.getStatus(); if (r.getDisasterType() != null) i.setDisasterType(r.getDisasterType()); if (r.getLocation() != null) i.setLocation(r.getLocation()); if (r.getDescription() != null) i.setDescription(r.getDescription());
        if (r.getSeverity() != null) i.setSeverity(severity(r.getSeverity())); if (r.getSource() != null) i.setSource(r.getSource()); if (r.getStatus() != null) transition(i, r.getStatus()); if (isTerminalStatus(i.getStatus())) deactivateAssignments(i); if (r.getContactInfo() != null) i.setContactInfo(r.getContactInfo());
        if (r.getImageUrl() != null) i.setImageUrl(r.getImageUrl()); if (r.getDeviceId() != null) i.setDeviceId(r.getDeviceId());
        Double latitude = r.getLatitude() != null ? r.getLatitude() : i.getLatitude(); Double longitude = r.getLongitude() != null ? r.getLongitude() : i.getLongitude(); validateCoordinates(latitude, longitude); i.setLatitude(latitude); i.setLongitude(longitude); incidents.save(i); if (!previous.equals(i.getStatus()) && "VERIFIED".equals(i.getStatus())) dispatch.createOffersForVerifiedIncident(i.getId()); return dto(i);
    }
    @Transactional public IncidentResponseDTO updateStatus(Long id, String requested) { Incident i = incident(id); String previous = i.getStatus(); transition(i, requested); if (isTerminalStatus(i.getStatus())) deactivateAssignments(i); Incident saved = incidents.save(i); if (!previous.equals(i.getStatus()) && "VERIFIED".equals(i.getStatus())) dispatch.createOffersForVerifiedIncident(i.getId()); return dto(saved); }
    @Transactional public IncidentResponseDTO assign(Long incidentId, AssignmentRequestDTO r) {
        Incident i = incident(incidentId); if ("PENDING_VERIFICATION".equals(i.getStatus())) throw conflict("Incident must be VERIFIED before assignment"); if (isTerminalStatus(i.getStatus())) throw conflict("A completed incident cannot be assigned");
        if (severityRank(i.getSeverity()) > 0 && hasUnresolvedCritical() && (r.getPriorityOverrideReason() == null || r.getPriorityOverrideReason().isBlank())) throw new ApiException(HttpStatus.BAD_REQUEST, "priorityOverrideReason is required while unresolved CRITICAL incidents exist");
        TeamMember member = r.getMemberId() == null ? null : teams.getMember(r.getMemberId());
        if (r.getTeamId() == null && (r.getTeamName() == null || r.getTeamName().isBlank()) && member == null) throw new ApiException(HttpStatus.BAD_REQUEST, "teamId, teamName, or memberId is required");
        ResponseTeam team = r.getTeamId() != null ? teams.getTeam(r.getTeamId()) : (r.getTeamName() != null && !r.getTeamName().isBlank() ? teams.getTeamByName(r.getTeamName()) : member.getTeam());
        if (r.getTeamId() != null && r.getTeamName() != null && !r.getTeamName().isBlank() && !team.getName().equalsIgnoreCase(r.getTeamName().trim())) throw new ApiException(HttpStatus.BAD_REQUEST, "teamId and teamName refer to different response teams");
        if (!team.isAvailable()) throw conflict("Selected response team is unavailable");
        if (member != null) { if (!member.getTeam().getId().equals(team.getId())) throw new ApiException(HttpStatus.BAD_REQUEST, "Selected member does not belong to the selected team"); if (!member.isAvailable()) throw conflict("Selected team member is unavailable"); if (assignments.findByMemberIdAndActiveTrueOrderByAssignedAtDesc(member.getId()).stream().anyMatch(existing -> !existing.getIncident().getId().equals(incidentId) && !isTerminalStatus(existing.getIncident().getStatus()))) throw conflict("Selected team member already has an active incident assignment"); }
        ResponseVehicle vehicle = null;
        if (r.getVehicleId() != null) { vehicle = vehicles.findById(r.getVehicleId()).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Response vehicle " + r.getVehicleId() + " was not found")); if (!vehicle.getTeam().getId().equals(team.getId())) throw new ApiException(HttpStatus.BAD_REQUEST, "Selected vehicle does not belong to the selected team"); if (!vehicle.isActive()) throw conflict("Selected response vehicle is inactive"); if (assignments.findByVehicleIdAndActiveTrueOrderByAssignedAtDesc(vehicle.getId()).stream().anyMatch(existing -> !existing.getIncident().getId().equals(incidentId) && !isTerminalStatus(existing.getIncident().getStatus()))) throw conflict("Selected response vehicle already has an active incident assignment"); }
        assignments.findByIncidentIdAndActiveTrue(incidentId).ifPresent(old -> { old.setActive(false); old.setUnassignedAt(LocalDateTime.now()); assignments.save(old); });
        dispatch.closeOffersForAssignment(incidentId);
        IncidentAssignment a = new IncidentAssignment(); a.setIncident(i); a.setTeam(team); a.setMember(member); a.setVehicle(vehicle); a.setNotes(r.getNotes()); a.setPriorityOverrideReason(r.getPriorityOverrideReason()); assignments.save(a);
        if ("VERIFIED".equals(i.getStatus())) i.setStatus("ASSIGNED"); i.setDispatchState("ACCEPTED"); i.setAssignedTeam(team.getName()); return dto(incidents.save(i));
    }
    @Transactional(readOnly = true) public List<IncidentResponseDTO> getAssignedToTeam(Long id) { teams.getTeam(id); return assignments.findByTeamIdAndActiveTrueOrderByAssignedAtDesc(id).stream().map(a -> dto(a.getIncident())).toList(); }
    @Transactional(readOnly = true) public List<IncidentResponseDTO> getAssignedToMember(Long id) { teams.getMember(id); return assignments.findByMemberIdAndActiveTrueOrderByAssignedAtDesc(id).stream().map(a -> dto(a.getIncident())).toList(); }
    @Transactional(readOnly = true) public List<AssignmentResponseDTO> history(Long id) { incident(id); return assignments.findByIncidentIdOrderByAssignedAtDesc(id).stream().map(this::assignmentDto).toList(); }
    @Transactional public boolean deleteIncident(Long id) { if (!incidents.existsById(id)) return false; assignments.deleteByIncidentId(id); incidents.deleteById(id); return true; }
    public IncidentResponseDTO dto(Incident i) { IncidentResponseDTO d = new IncidentResponseDTO(i.getId(), i.getDisasterType(), i.getLocation(), i.getDescription(), i.getSeverity(), i.getSource(), i.getStatus(), i.getReportedAt(), i.getUpdatedAt(), i.getContactInfo(), i.getAssignedTeam(), i.getImageUrl(), i.getDeviceId()); d.setLatitude(i.getLatitude()); d.setLongitude(i.getLongitude()); d.setDispatchState(i.getDispatchState()); assignments.findByIncidentIdAndActiveTrue(i.getId()).ifPresent(a -> d.setCurrentAssignment(assignmentDto(a))); return d; }
    private AssignmentResponseDTO assignmentDto(IncidentAssignment a) { TeamMember m = a.getMember(); ResponseVehicle v = a.getVehicle(); return new AssignmentResponseDTO(a.getId(), a.getTeam().getId(), a.getTeam().getName(), m == null ? null : m.getId(), m == null ? null : m.getName(), v == null ? null : v.getId(), v == null ? null : v.getVehicleIdentifier(), a.getAssignedAt(), a.getUnassignedAt(), a.getNotes(), a.getPriorityOverrideReason(), a.isActive()); }
    private Incident incident(Long id) { return incidents.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Incident " + id + " was not found")); }
    private void transition(Incident i, String value) {
        String target = status(value), current = i.getStatus();
        if (current.equals(target)) return;
        if (!isValidTransition(current, target)) {
            throw conflict("Invalid status transition from " + current + " to " + target);
        }
        if (target.equals("ASSIGNED") && assignments.findByIncidentIdAndActiveTrue(i.getId()).isEmpty()) {
            throw conflict("Use PUT /incidents/" + i.getId() + "/assignment to assign a team");
        }
        i.setStatus(target);
    }

    private boolean isValidTransition(String current, String target) {
        return switch (current) {
            case "PENDING_VERIFICATION" -> target.equals("VERIFIED");
            case "VERIFIED" -> target.equals("ASSIGNED");
            case "ASSIGNED" -> target.equals("RESPONSE_DISPATCHED") || target.equals("RESPONDING");
            case "RESPONSE_DISPATCHED" -> target.equals("RESPONDING");
            case "RESPONDING" -> target.equals("RESPONSE_COMPLETED");
            case "RESPONSE_COMPLETED" -> target.equals("RESOLVED");
            default -> false;
        };
    }

    private Comparator<Incident> incidentPriorityComparator() {
        return Comparator.comparingInt((Incident i) -> severityRank(i.getSeverity()))
                .thenComparingInt(i -> statusActionRank(i.getStatus()))
            .thenComparing(i -> i.getReportedAt(), Comparator.nullsFirst(Comparator.naturalOrder()));
    }
    private int statusActionRank(String value) {
        return switch (value == null ? "" : value.toUpperCase(Locale.ROOT)) {
            case "PENDING_VERIFICATION" -> 0;
            case "VERIFIED" -> 1;
            case "ASSIGNED" -> 2;
            case "RESPONSE_DISPATCHED" -> 3;
            case "RESPONDING" -> 4;
            case "RESPONSE_COMPLETED" -> 5;
            case "RESOLVED" -> 6;
            default -> 7;
        };
    }
    private String severity(String value) { String v = value.trim().toUpperCase(Locale.ROOT); if (!SEVERITIES.contains(v)) throw new ApiException(HttpStatus.BAD_REQUEST, "severity must be one of " + SEVERITIES); return v; }
    private String status(String value) { String v = value.trim().toUpperCase(Locale.ROOT); if (!STATUSES.contains(v)) throw new ApiException(HttpStatus.BAD_REQUEST, "status must be one of " + STATUSES); return v; }
    private int severityRank(String value) { int rank = SEVERITIES.indexOf(value == null ? "" : value.toUpperCase(Locale.ROOT)); return rank < 0 ? SEVERITIES.size() : rank; }
    private boolean isTerminalStatus(String value) { return "RESPONSE_COMPLETED".equalsIgnoreCase(value) || "RESOLVED".equalsIgnoreCase(value) || "CANCELLED".equalsIgnoreCase(value); }
    private void deactivateAssignments(Incident incident) {
        assignments.findByIncidentIdAndActiveTrue(incident.getId()).ifPresent(assignment -> {
            assignment.setActive(false);
            assignment.setUnassignedAt(LocalDateTime.now());
            if (assignment.getMember() != null) assignment.getMember().setLocationStatus("OFFLINE");
            if (assignment.getVehicle() != null) assignment.getVehicle().setLocationStatus("OFFLINE");
            assignments.save(assignment);
        });
    }
    private boolean hasUnresolvedCritical() { return incidents.findAll().stream().anyMatch(i -> "CRITICAL".equals(i.getSeverity()) && !"RESOLVED".equals(i.getStatus())); }
    private void validateCoordinates(Double latitude, Double longitude) {
        if ((latitude == null) != (longitude == null)) throw new ApiException(HttpStatus.BAD_REQUEST, "latitude and longitude must be supplied together");
        if (latitude != null && longitude != null && (!Double.isFinite(latitude) || !Double.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180)) throw new ApiException(HttpStatus.BAD_REQUEST, "latitude must be between -90 and 90 and longitude between -180 and 180");
    }
    private String defaultValue(String value, String fallback) { return value == null || value.isBlank() ? fallback : value; }
    private ApiException conflict(String message) { return new ApiException(HttpStatus.CONFLICT, message); }
}
