package com.ritesh.disastermanagement;

import com.ritesh.disastermanagement.dto.*;
import com.ritesh.disastermanagement.exception.ApiException;
import com.ritesh.disastermanagement.service.IncidentService;
import com.ritesh.disastermanagement.service.ResponseTeamService;
import com.ritesh.disastermanagement.service.TrackingService;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestPropertySource(properties = {
        "app.tracking.responder-tokens=1=test-responder-token",
        "app.tracking.vehicle-tokens=vehicle-test=test-vehicle-token",
        "app.tracking.vehicle-team-ids=vehicle-test=1",
        "app.tracking.vehicle-identifiers=vehicle-test=Test Response Vehicle",
        "app.tracking.minimum-update-seconds=0"
})
class TrackingApiIntegrationTests {
    @Autowired private IncidentService incidents;
    @Autowired private ResponseTeamService teams;
    @Autowired private TrackingService tracking;

    private Long teamId;
    private Long memberId;

    @BeforeAll
    void provisionTestResponder() {
        var team = teams.getTeamByName("Station 1 Fire & Rescue Engine");
        teamId = team.getId();
        memberId = teams.createMember(teamId, member("GPS Responder")).id();
        assertEquals(1L, memberId);
    }

    @Test
    void acceptsResponderLocationAndRejectsStaleUnauthorizedAndInactiveUpdates() {
        IncidentResponseDTO incident = assignedToMember();
        Instant timestamp = Instant.now();
        LocationUpdateResponseDTO accepted = tracking.updateResponder("Bearer test-responder-token", request(28.6139, 77.2090, timestamp));

        assertEquals("RESPONDER_PHONE", accepted.sourceType());
        assertEquals(incident.getId(), accepted.incidentId());
        assertEquals("ONLINE", accepted.status());
        assertEquals(28.6139, accepted.latitude());

        ApiException stale = assertThrows(ApiException.class, () -> tracking.updateResponder("Bearer test-responder-token", request(28.6140, 77.2091, timestamp)));
        assertEquals(409, stale.getStatus().value());

        ApiException unauthorized = assertThrows(ApiException.class, () -> tracking.updateResponder("Bearer wrong-token", request(28.6140, 77.2091, Instant.now().plusSeconds(1))));
        assertEquals(401, unauthorized.getStatus().value());

        resolve(incident.getId());
        ApiException inactive = assertThrows(ApiException.class, () -> tracking.updateResponder("Bearer test-responder-token", request(28.6150, 77.2100, Instant.now().plusSeconds(2))));
        assertEquals(409, inactive.getStatus().value());
        LocationUpdateResponseDTO afterCompletion = tracking.responderLocation("Bearer test-responder-token");
        assertNull(afterCompletion.incidentId());
        assertNull(afterCompletion.latitude());
        assertEquals("OFFLINE", afterCompletion.status());
    }

    @Test
    void resolvesResponderIdentityFromConfiguredTokenWithoutAcceptingClientMemberIds() {
        ResponderIdentityResponseDTO identity = tracking.responderIdentity("Bearer test-responder-token");

        assertEquals(memberId, identity.memberId());
        assertEquals("GPS Responder", identity.memberName());
        assertEquals(teamId, identity.teamId());
        assertThrows(ApiException.class, () -> tracking.responderIdentity("Bearer wrong-token"));
    }

    @Test
    void acceptsVehicleLocationOnlyAfterRegistrationAndAssignment() {
        VehicleRegistrationResponseDTO registered = tracking.registerVehicle("Bearer test-vehicle-token");
        assertEquals("vehicle-test", registered.deviceId());

        IncidentResponseDTO incident = incidents.saveIncident(incidentRequest("HIGH"));
        incidents.updateStatus(incident.getId(), "VERIFIED");
        AssignmentRequestDTO assignment = assignment();
        assignment.setVehicleId(registered.id());
        incidents.assign(incident.getId(), assignment);

        LocationUpdateResponseDTO accepted = tracking.updateVehicle("Bearer test-vehicle-token", requestWithDevice(12.9716, 77.5946, Instant.now(), "vehicle-test"));
        assertEquals("VEHICLE", accepted.sourceType());
        assertEquals("Test Response Vehicle", accepted.sourceId());
        assertEquals(incident.getId(), accepted.incidentId());

        ApiException wrongDevice = assertThrows(ApiException.class, () -> tracking.updateVehicle("Bearer test-vehicle-token", requestWithDevice(12.9, 77.5, Instant.now().plusSeconds(1), "other-device")));
        assertEquals(401, wrongDevice.getStatus().value());
        resolve(incident.getId());
    }

    @Test
    void rejectsInvalidCoordinatesAndProtectsCitizenTrackingTokens() {
        IncidentResponseDTO first = incidents.saveIncident(incidentRequest("LOW"));
        LocationUpdateRequestDTO invalid = request(91.0, 77.0, Instant.now());
        ApiException invalidCoordinates = assertThrows(ApiException.class, () -> tracking.updateResponder("Bearer test-responder-token", invalid));
        assertEquals(400, invalidCoordinates.getStatus().value());

        IncidentResponseDTO second = incidents.saveIncident(incidentRequest("LOW"));
        assertNotNull(first.getTrackingToken());
        assertNotNull(second.getTrackingToken());
        IncidentResponseDTO authorized = tracking.citizenTracking(first.getId(), first.getTrackingToken());
        assertEquals(first.getId(), authorized.getId());

        ApiException wrongIncidentToken = assertThrows(ApiException.class, () -> tracking.citizenTracking(second.getId(), first.getTrackingToken()));
        assertEquals(403, wrongIncidentToken.getStatus().value());
    }

    private IncidentResponseDTO assignedToMember() {
        IncidentResponseDTO incident = incidents.saveIncident(incidentRequest("HIGH"));
        incidents.updateStatus(incident.getId(), "VERIFIED");
        AssignmentRequestDTO assignment = assignment();
        assignment.setMemberId(memberId);
        incidents.assign(incident.getId(), assignment);
        return incidents.getIncidentById(incident.getId());
    }

    private void resolve(Long incidentId) {
        incidents.updateStatus(incidentId, "RESPONSE_DISPATCHED");
        incidents.updateStatus(incidentId, "RESPONDING");
        incidents.updateStatus(incidentId, "RESPONSE_COMPLETED");
        incidents.updateStatus(incidentId, "RESOLVED");
    }

    private IncidentRequestDTO incidentRequest(String severity) {
        IncidentRequestDTO request = new IncidentRequestDTO();
        request.setDisasterType("Fire");
        request.setLocation("Test GPS destination");
        request.setSeverity(severity);
        request.setSource("CITIZEN");
        return request;
    }

    private AssignmentRequestDTO assignment() {
        AssignmentRequestDTO request = new AssignmentRequestDTO();
        request.setTeamId(teamId);
        request.setPriorityOverrideReason("Test assignment authorization");
        return request;
    }

    private TeamMemberRequestDTO member(String name) {
        TeamMemberRequestDTO request = new TeamMemberRequestDTO();
        request.setName(name);
        request.setRole("Responder");
        return request;
    }

    private LocationUpdateRequestDTO request(double latitude, double longitude, Instant timestamp) {
        return requestWithDevice(latitude, longitude, timestamp, null);
    }

    private LocationUpdateRequestDTO requestWithDevice(double latitude, double longitude, Instant timestamp, String deviceId) {
        LocationUpdateRequestDTO request = new LocationUpdateRequestDTO();
        request.setLatitude(latitude);
        request.setLongitude(longitude);
        request.setAccuracy(5.0);
        request.setTimestamp(timestamp.toString());
        request.setDeviceId(deviceId);
        return request;
    }
}
