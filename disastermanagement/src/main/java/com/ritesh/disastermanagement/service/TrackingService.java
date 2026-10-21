package com.ritesh.disastermanagement.service;

import com.ritesh.disastermanagement.dto.*;
import com.ritesh.disastermanagement.entity.*;
import com.ritesh.disastermanagement.exception.ApiException;
import com.ritesh.disastermanagement.repository.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeParseException;
import java.util.List;

@Service
public class TrackingService {
    private final IncidentRepository incidents;
    private final IncidentAssignmentRepository assignments;
    private final TeamMemberRepository members;
    private final ResponseVehicleRepository vehicles;
    private final ResponseTeamRepository teams;
    private final IncidentService incidentService;
    private final TrackingTokenService tokens;

    @Value("${app.tracking.online-timeout-seconds:60}") private long onlineTimeoutSeconds;
    @Value("${app.tracking.stale-timeout-seconds:180}") private long staleTimeoutSeconds;
    @Value("${app.tracking.minimum-update-seconds:5}") private long minimumUpdateSeconds;

    public TrackingService(IncidentRepository incidents, IncidentAssignmentRepository assignments,
                           TeamMemberRepository members, ResponseVehicleRepository vehicles,
                           ResponseTeamRepository teams, IncidentService incidentService,
                           TrackingTokenService tokens) {
        this.incidents = incidents;
        this.assignments = assignments;
        this.members = members;
        this.vehicles = vehicles;
        this.teams = teams;
        this.incidentService = incidentService;
        this.tokens = tokens;
    }

    @Transactional
    public LocationUpdateResponseDTO updateResponder(String authorization, LocationUpdateRequestDTO request) {
        validateCoordinates(request);
        TeamMember member = tokens.authenticatedResponder(authorization);
        IncidentAssignment assignment = activeMemberAssignment(member);
        Instant timestamp = parseTimestamp(request.getTimestamp());
        rejectStaleOrTooFrequent(member.getLastLocationAt(), timestamp);
        member.setLastLatitude(request.getLatitude());
        member.setLastLongitude(request.getLongitude());
        member.setLastAccuracy(request.getAccuracy());
        member.setLastLocationAt(timestamp);
        member.setLocationStatus("ONLINE");
        members.save(member);
        return responderResponse(member, assignment);
    }

    @Transactional(readOnly = false)
    public List<IncidentResponseDTO> responderAssignments(String authorization) {
        TeamMember member = tokens.authenticatedResponder(authorization);
        List<IncidentAssignment> direct = assignments.findByMemberIdAndActiveTrueOrderByAssignedAtDesc(member.getId()).stream()
                .filter(this::isTrackableAssignment)
                .toList();
        if (!direct.isEmpty()) {
            return direct.stream().map(assignment -> incidentService.dto(assignment.getIncident())).toList();
        }
        if (member.getTeam() != null) {
            return assignments.findByTeamIdAndActiveTrueOrderByAssignedAtDesc(member.getTeam().getId()).stream()
                    .filter(this::isTrackableAssignment)
                    .map(assignment -> incidentService.dto(assignment.getIncident()))
                    .toList();
        }
        return List.of();
    }

    @Transactional(readOnly = true)
    public ResponderIdentityResponseDTO responderIdentity(String authorization) {
        TeamMember member = tokens.authenticatedResponderIdentity(authorization);
        return new ResponderIdentityResponseDTO(
                member.getId(), member.getName(), member.getRole(),
                member.getTeam().getId(), member.getTeam().getName());
    }

    @Transactional(readOnly = true)
    public LocationUpdateResponseDTO responderLocation(String authorization) {
        TeamMember member = tokens.authenticatedResponder(authorization);
        IncidentAssignment assignment = activeMemberAssignmentOrNull(member);
        return responderResponse(member, assignment);
    }

    @Transactional
    public LocationUpdateResponseDTO stopResponder(String authorization) {
        TeamMember member = tokens.authenticatedResponder(authorization);
        member.setLocationStatus("OFFLINE");
        members.save(member);
        IncidentAssignment assignment = activeMemberAssignmentOrNull(member);
        return responderResponse(member, assignment);
    }

    @Transactional
    public VehicleRegistrationResponseDTO registerVehicle(String authorization) {
        String deviceId = tokens.authenticatedVehicleDevice(authorization, null);
        ResponseVehicle vehicle = vehicles.findByDeviceId(deviceId).orElseGet(() -> {
            ResponseVehicle created = new ResponseVehicle();
            created.setDeviceId(deviceId);
            created.setVehicleIdentifier(tokens.configuredVehicleIdentifier(deviceId));
            created.setTeam(teams.findById(tokens.configuredVehicleTeamId(deviceId))
                    .orElseThrow(() -> notFound("Configured vehicle team was not found")));
            return created;
        });
        vehicle.setActive(true);
        ResponseVehicle saved = vehicles.save(vehicle);
        return new VehicleRegistrationResponseDTO(saved.getId(), saved.getVehicleIdentifier(), saved.getDeviceId(), saved.getTeam().getId(), saved.getTeam().getName(), saved.isActive());
    }

    @Transactional
    public LocationUpdateResponseDTO updateVehicle(String authorization, LocationUpdateRequestDTO request) {
        validateCoordinates(request);
        String deviceId = tokens.authenticatedVehicleDevice(authorization, request.getDeviceId());
        ResponseVehicle vehicle = vehicles.findByDeviceId(deviceId)
                .orElseThrow(() -> notFound("Vehicle is not registered; register it before sending GPS updates"));
        if (!vehicle.isActive()) throw conflict("Vehicle is inactive");
        IncidentAssignment assignment = activeVehicleAssignment(vehicle.getId());
        Instant timestamp = parseTimestamp(request.getTimestamp());
        rejectStaleOrTooFrequent(vehicle.getLastLocationAt(), timestamp);
        vehicle.setLastLatitude(request.getLatitude());
        vehicle.setLastLongitude(request.getLongitude());
        vehicle.setLastAccuracy(request.getAccuracy());
        vehicle.setLastLocationAt(timestamp);
        vehicle.setLocationStatus("ONLINE");
        vehicles.save(vehicle);
        return vehicleResponse(vehicle, assignment);
    }

    @Transactional(readOnly = true)
    public LocationUpdateResponseDTO vehicleLocation(String authorization) {
        String deviceId = tokens.authenticatedVehicleDevice(authorization, null);
        ResponseVehicle vehicle = vehicles.findByDeviceId(deviceId).orElseThrow(() -> notFound("Vehicle is not registered"));
        IncidentAssignment assignment = assignments.findByVehicleIdAndActiveTrueOrderByAssignedAtDesc(vehicle.getId()).stream().findFirst().orElse(null);
        return vehicleResponse(vehicle, assignment);
    }

    @Transactional
    public LocationUpdateResponseDTO stopVehicle(String authorization) {
        String deviceId = tokens.authenticatedVehicleDevice(authorization, null);
        ResponseVehicle vehicle = vehicles.findByDeviceId(deviceId).orElseThrow(() -> notFound("Vehicle is not registered"));
        vehicle.setLocationStatus("OFFLINE");
        vehicles.save(vehicle);
        IncidentAssignment assignment = assignments.findByVehicleIdAndActiveTrueOrderByAssignedAtDesc(vehicle.getId()).stream().findFirst().orElse(null);
        return vehicleResponse(vehicle, assignment);
    }

    @Transactional(readOnly = true)
    public IncidentResponseDTO citizenTracking(Long incidentId, String incidentToken) {
        Incident incident = incidents.findById(incidentId).orElseThrow(() -> notFound("Incident " + incidentId + " was not found"));
        if (!tokens.matches(incidentToken, incident.getTrackingTokenHash())) {
            throw new ApiException(HttpStatus.FORBIDDEN, "A valid incident tracking token is required");
        }
        IncidentResponseDTO response = incidentService.dto(incident);
        assignments.findByIncidentIdAndActiveTrue(incidentId).ifPresent(assignment -> {
            ResponderLocationDTO location = locationFor(assignment, incident);
            if (location != null) {
                response.setResponderLocation(location);
                response.setDistanceMeters(location.distanceMeters());
                response.setEstimatedTravelSeconds(location.estimatedTravelSeconds());
                response.setEstimatedArrivalTime(location.estimatedArrivalTime());
            }
        });
        return response;
    }

    private IncidentAssignment activeMemberAssignment(TeamMember member) {
        var direct = assignments.findByMemberIdAndActiveTrueOrderByAssignedAtDesc(member.getId()).stream()
                .filter(this::isTrackableAssignment)
                .findFirst();
        if (direct.isPresent()) return direct.get();

        if (member.getTeam() != null) {
            var teamAssignment = assignments.findByTeamIdAndActiveTrueOrderByAssignedAtDesc(member.getTeam().getId()).stream()
                    .filter(this::isTrackableAssignment)
                    .filter(a -> a.getMember() == null || a.getMember().getId().equals(member.getId()))
                    .findFirst();
            if (teamAssignment.isPresent()) {
                IncidentAssignment a = teamAssignment.get();
                if (a.getMember() == null) {
                    a.setMember(member);
                    return assignments.save(a);
                }
                return a;
            }
        }
        throw conflict("Responder has no active incident assignment");
    }

    private IncidentAssignment activeMemberAssignmentOrNull(TeamMember member) {
        try {
            return activeMemberAssignment(member);
        } catch (ApiException ignored) {
            return null;
        }
    }

    private IncidentAssignment activeVehicleAssignment(Long vehicleId) {
        return assignments.findByVehicleIdAndActiveTrueOrderByAssignedAtDesc(vehicleId).stream()
                .filter(this::isTrackableAssignment)
                .findFirst()
                .orElseThrow(() -> conflict("Vehicle has no active incident assignment"));
    }

    private boolean isTrackableAssignment(IncidentAssignment assignment) {
        String status = assignment.getIncident().getStatus();
        return assignment.isActive() && status != null
                && !"RESPONSE_COMPLETED".equalsIgnoreCase(status)
                && !"RESOLVED".equalsIgnoreCase(status)
                && !"CANCELLED".equalsIgnoreCase(status);
    }

    private ResponderLocationDTO locationFor(IncidentAssignment assignment, Incident incident) {
        if (assignment.getVehicle() != null && isLocationForAssignment(assignment.getVehicle().getLastLocationAt(), assignment) && assignment.getVehicle().getLastLatitude() != null) {
            ResponseVehicle vehicle = assignment.getVehicle();
            return new ResponderLocationDTO("VEHICLE", vehicle.getVehicleIdentifier(), vehicle.getTeam().getName(), vehicle.getLastLatitude(), vehicle.getLastLongitude(), vehicle.getLastAccuracy(), vehicle.getLastLocationAt(), status(vehicle.getLocationStatus(), vehicle.getLastLocationAt()));
        }
        if (assignment.getMember() != null && isLocationForAssignment(assignment.getMember().getLastLocationAt(), assignment) && assignment.getMember().getLastLatitude() != null) {
            TeamMember member = assignment.getMember();
            return new ResponderLocationDTO("RESPONDER_PHONE", String.valueOf(member.getId()), member.getTeam().getName(), member.getLastLatitude(), member.getLastLongitude(), member.getLastAccuracy(), member.getLastLocationAt(), status(member.getLocationStatus(), member.getLastLocationAt()));
        }
        return null;
    }

    private boolean isLocationForAssignment(Instant locationTimestamp, IncidentAssignment assignment) {
        if (locationTimestamp == null || assignment.getAssignedAt() == null) return false;
        Instant assignmentTimestamp = assignment.getAssignedAt().atZone(ZoneId.systemDefault()).toInstant();
        return !locationTimestamp.isBefore(assignmentTimestamp);
    }

    private LocationUpdateResponseDTO responderResponse(TeamMember member, IncidentAssignment assignment) {
        if (assignment == null || !isTrackableAssignment(assignment)) {
            return new LocationUpdateResponseDTO("RESPONDER_PHONE", String.valueOf(member.getId()), null, member.getTeam().getName(), null, null, null, null, "OFFLINE");
        }
        boolean current = isLocationForAssignment(member.getLastLocationAt(), assignment);
        return new LocationUpdateResponseDTO("RESPONDER_PHONE", String.valueOf(member.getId()), assignment.getIncident().getId(), member.getTeam().getName(), current ? member.getLastLatitude() : null, current ? member.getLastLongitude() : null, current ? member.getLastAccuracy() : null, current ? member.getLastLocationAt() : null, current ? status(member.getLocationStatus(), member.getLastLocationAt()) : "UNAVAILABLE");
    }

    private LocationUpdateResponseDTO vehicleResponse(ResponseVehicle vehicle, IncidentAssignment assignment) {
        boolean current = assignment == null || isLocationForAssignment(vehicle.getLastLocationAt(), assignment);
        return new LocationUpdateResponseDTO("VEHICLE", vehicle.getVehicleIdentifier(), assignment == null ? null : assignment.getIncident().getId(), vehicle.getTeam().getName(), current ? vehicle.getLastLatitude() : null, current ? vehicle.getLastLongitude() : null, current ? vehicle.getLastAccuracy() : null, current ? vehicle.getLastLocationAt() : null, current ? status(vehicle.getLocationStatus(), vehicle.getLastLocationAt()) : "UNAVAILABLE");
    }

    private String status(String storedStatus, Instant timestamp) {
        if ("OFFLINE".equalsIgnoreCase(storedStatus)) return "OFFLINE";
        if (timestamp == null) return "UNAVAILABLE";
        long seconds = Math.max(0, Duration.between(timestamp, Instant.now()).getSeconds());
        if (seconds <= onlineTimeoutSeconds) return "ONLINE";
        if (seconds <= staleTimeoutSeconds) return "STALE";
        return "OFFLINE";
    }

    private void rejectStaleOrTooFrequent(Instant previous, Instant next) {
        if (previous != null && !next.isAfter(previous)) throw conflict("Location timestamp is stale and was not stored");
        if (previous != null && Duration.between(previous, next).getSeconds() < minimumUpdateSeconds) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "Location updates are arriving too frequently");
        }
    }

    private Instant parseTimestamp(String value) {
        try {
            return Instant.parse(value);
        } catch (DateTimeParseException ignored) {
            try {
                return OffsetDateTime.parse(value).toInstant();
            } catch (DateTimeParseException exception) {
                throw new ApiException(HttpStatus.BAD_REQUEST, "timestamp must be a valid ISO-8601 instant");
            }
        }
    }

    private void validateCoordinates(LocationUpdateRequestDTO request) {
        if (request.getLatitude() == null || request.getLongitude() == null
                || !Double.isFinite(request.getLatitude()) || !Double.isFinite(request.getLongitude())
                || request.getLatitude() < -90 || request.getLatitude() > 90
                || request.getLongitude() < -180 || request.getLongitude() > 180) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "latitude must be between -90 and 90 and longitude between -180 and 180");
        }
        if (request.getAccuracy() != null && (!Double.isFinite(request.getAccuracy()) || request.getAccuracy() < 0)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "accuracy must be a non-negative finite number");
        }
    }

    private ApiException conflict(String message) { return new ApiException(HttpStatus.CONFLICT, message); }
    private ApiException notFound(String message) { return new ApiException(HttpStatus.NOT_FOUND, message); }
}
