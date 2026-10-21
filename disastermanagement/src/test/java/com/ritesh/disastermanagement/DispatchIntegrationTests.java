package com.ritesh.disastermanagement;

import com.ritesh.disastermanagement.dto.*;
import com.ritesh.disastermanagement.entity.DispatchOffer;
import com.ritesh.disastermanagement.entity.TeamMember;
import com.ritesh.disastermanagement.exception.ApiException;
import com.ritesh.disastermanagement.repository.DispatchOfferRepository;
import com.ritesh.disastermanagement.repository.TeamMemberRepository;
import com.ritesh.disastermanagement.service.DispatchService;
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
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestPropertySource(properties = {
        "app.tracking.responder-tokens=1=dispatch-token-one;2=dispatch-token-two",
        "app.dispatch.offer-batch-size=2",
        "app.dispatch.offer-timeout-seconds=60",
        "app.tracking.minimum-update-seconds=0"
})
class DispatchIntegrationTests {
    @Autowired private IncidentService incidents;
    @Autowired private ResponseTeamService teams;
    @Autowired private DispatchService dispatch;
    @Autowired private TrackingService tracking;
    @Autowired private TeamMemberRepository members;
    @Autowired private DispatchOfferRepository offers;

    private Long teamId;
    private Long firstMemberId;
    private Long secondMemberId;

    @BeforeAll
    void provisionResponders() {
        var team = teams.getTeamByName("Station 1 Fire & Rescue Engine");
        teamId = team.getId();
        firstMemberId = teams.createMember(teamId, member("Dispatch Alpha")).id();
        secondMemberId = teams.createMember(teamId, member("Dispatch Bravo")).id();
        assertEquals(1L, firstMemberId);
        assertEquals(2L, secondMemberId);
    }

    @Test
    void createsRankedOffersAndAcceptanceUnlocksGpsAndCitizenTracking() {
        setLocation(firstMemberId, 28.6140, 77.2091);
        setLocation(secondMemberId, 28.8000, 77.5000);
        IncidentResponseDTO incident = incidents.saveIncident(incidentRequest(28.6139, 77.2090));
        IncidentResponseDTO verified = incidents.updateStatus(incident.getId(), "VERIFIED");

        assertEquals("OFFERED", verified.getDispatchState());
        DispatchOfferResponseDTO firstOffer = dispatch.responderOffers("Bearer dispatch-token-one").getFirst();
        assertEquals(incident.getId(), firstOffer.incidentId());
        assertNull(firstOffer.distanceMeters(), "Dispatch offers must not expose straight-line distance as road distance");
        assertNull(firstOffer.estimatedTravelSeconds(), "Road ETA is calculated only after a live GPS fix and OSRM response");
        assertEquals(firstMemberId, firstOffer.memberId());

        dispatch.accept("Bearer dispatch-token-one", firstOffer.id());
        IncidentResponseDTO assigned = incidents.getIncidentById(incident.getId());
        assertEquals("ASSIGNED", assigned.getStatus());
        assertEquals("ACCEPTED", assigned.getDispatchState());
        assertEquals(firstMemberId, assigned.getCurrentAssignment().memberId());

        LocationUpdateResponseDTO gps = tracking.updateResponder("Bearer dispatch-token-one", location(28.6142, 77.2093));
        assertEquals(incident.getId(), gps.incidentId());
        IncidentResponseDTO citizenView = tracking.citizenTracking(incident.getId(), incident.getTrackingToken());
        assertEquals("ONLINE", citizenView.getResponderLocation().status());
        assertEquals(28.6142, citizenView.getResponderLocation().latitude());
        assertNull(citizenView.getEstimatedArrivalTime(), "Backend must not fabricate ETA without a road-route response");
        assertNull(citizenView.getDistanceMeters(), "Backend must not expose straight-line distance as road distance");
        assertNull(citizenView.getEstimatedTravelSeconds(), "Backend must not fabricate travel duration");
        resolve(incident.getId());
    }

    @Test
    void declineAndExpiryLeaveIncidentUnassignedAndDoNotCreateFakeLocation() {
        IncidentResponseDTO incident = incidents.saveIncident(incidentRequest(null, null));
        incidents.updateStatus(incident.getId(), "VERIFIED");
        DispatchOfferResponseDTO offer = dispatch.responderOffers("Bearer dispatch-token-one").stream()
                .filter(item -> item.incidentId().equals(incident.getId())).findFirst().orElseThrow();
        DispatchOfferResponseDTO declined = dispatch.decline("Bearer dispatch-token-one", offer.id(), null);
        assertEquals("DECLINED", declined.state());
        assertEquals("VERIFIED", incidents.getIncidentById(incident.getId()).getStatus());

        DispatchOfferResponseDTO next = dispatch.responderOffers("Bearer dispatch-token-two").stream()
                .filter(item -> item.incidentId().equals(incident.getId())).findFirst().orElseThrow();
        DispatchOffer persisted = offers.findById(next.id()).orElseThrow();
        persisted.setExpiresAt(Instant.now().minusSeconds(1));
        offers.save(persisted);
        assertTrue(dispatch.responderOffers("Bearer dispatch-token-two").stream().noneMatch(item -> item.incidentId().equals(incident.getId())));
        assertEquals("EXPIRED", offers.findById(next.id()).orElseThrow().getState());
        IncidentResponseDTO citizenView = tracking.citizenTracking(incident.getId(), incident.getTrackingToken());
        assertNull(citizenView.getResponderLocation());
    }

    @Test
    void competingRespondersCannotClaimTheSameIncident() throws Exception {
        IncidentResponseDTO incident = incidents.saveIncident(incidentRequest(null, null));
        incidents.updateStatus(incident.getId(), "VERIFIED");
        List<DispatchOfferResponseDTO> firstOffers = dispatch.responderOffers("Bearer dispatch-token-one");
        DispatchOfferResponseDTO first = firstOffers.stream().filter(item -> item.incidentId().equals(incident.getId())).findFirst().orElseThrow();
        DispatchOfferResponseDTO second = dispatch.responderOffers("Bearer dispatch-token-two").stream().filter(item -> item.incidentId().equals(incident.getId())).findFirst().orElseThrow();

        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            Future<Boolean> one = executor.submit(() -> accepts("Bearer dispatch-token-one", first.id()));
            Future<Boolean> two = executor.submit(() -> accepts("Bearer dispatch-token-two", second.id()));
            assertEquals(1, List.of(one.get(), two.get()).stream().filter(Boolean.TRUE::equals).count());
        } finally {
            executor.shutdownNow();
        }
        assertEquals(1, incidents.history(incident.getId()).stream().filter(AssignmentResponseDTO::active).count());
        resolve(incident.getId());
    }

    @Test
    void acceptedOfferBindsAssignmentToAuthenticatedMemberNotJustTheirTeam() {
        IncidentResponseDTO incident = incidents.saveIncident(incidentRequest(null, null));
        incidents.updateStatus(incident.getId(), "VERIFIED");

        DispatchOfferResponseDTO offer = dispatch.responderOffers("Bearer dispatch-token-one").stream()
                .filter(item -> item.incidentId().equals(incident.getId())).findFirst().orElseThrow();
        dispatch.accept("Bearer dispatch-token-one", offer.id());

        IncidentResponseDTO assigned = incidents.getIncidentById(incident.getId());
        assertEquals(firstMemberId, assigned.getCurrentAssignment().memberId());
        assertEquals(teamId, assigned.getCurrentAssignment().teamId());
        resolve(incident.getId());
    }

    @Test
    void teamLevelAssignmentAllowsTeamMemberToTrackAndBindsMember() {
        IncidentResponseDTO incident = incidents.saveIncident(incidentRequest(28.6139, 77.2090));
        incidents.updateStatus(incident.getId(), "VERIFIED");

        AssignmentRequestDTO assignReq = new AssignmentRequestDTO();
        assignReq.setTeamId(teamId);
        assignReq.setPriorityOverrideReason("Authorized team dispatch");
        incidents.assign(incident.getId(), assignReq);

        // Verify that responder of this team sees the assigned incident
        List<IncidentResponseDTO> assignments = tracking.responderAssignments("Bearer dispatch-token-one");
        assertTrue(assignments.stream().anyMatch(a -> a.getId().equals(incident.getId())));

        // Responder submits location update and binds assignment
        LocationUpdateResponseDTO update = tracking.updateResponder("Bearer dispatch-token-one", location(28.6145, 77.2095));
        assertEquals(incident.getId(), update.incidentId());
        assertEquals("ONLINE", update.status());

        // Check citizen view receives live responder location and ETA
        IncidentResponseDTO citizenView = tracking.citizenTracking(incident.getId(), incident.getTrackingToken());
        assertNotNull(citizenView.getResponderLocation());
        assertEquals(28.6145, citizenView.getResponderLocation().latitude());
        assertNull(citizenView.getEstimatedArrivalTime());
        assertNull(citizenView.getDistanceMeters());
        assertNull(citizenView.getEstimatedTravelSeconds());
        resolve(incident.getId());
    }

    private boolean accepts(String token, Long offerId) {
        try {
            dispatch.accept(token, offerId);
            return true;
        } catch (RuntimeException ignored) {
            return false;
        }
    }

    private void setLocation(Long id, double latitude, double longitude) {
        TeamMember member = members.findById(id).orElseThrow();
        member.setLastLatitude(latitude);
        member.setLastLongitude(longitude);
        member.setLastLocationAt(Instant.now());
        member.setLocationStatus("ONLINE");
        members.save(member);
    }

    private void resolve(Long id) {
        incidents.updateStatus(id, "RESPONSE_DISPATCHED");
        incidents.updateStatus(id, "RESPONDING");
        incidents.updateStatus(id, "RESPONSE_COMPLETED");
        incidents.updateStatus(id, "RESOLVED");
    }

    private IncidentRequestDTO incidentRequest(Double latitude, Double longitude) {
        IncidentRequestDTO request = new IncidentRequestDTO();
        request.setDisasterType("Fire");
        request.setLocation("Dispatch test location");
        request.setSeverity("HIGH");
        request.setSource("CITIZEN");
        request.setLatitude(latitude);
        request.setLongitude(longitude);
        return request;
    }

    private IncidentRequestDTO incidentRequest(double latitude, double longitude) { return incidentRequest(Double.valueOf(latitude), Double.valueOf(longitude)); }

    private LocationUpdateRequestDTO location(double latitude, double longitude) {
        LocationUpdateRequestDTO request = new LocationUpdateRequestDTO();
        request.setLatitude(latitude);
        request.setLongitude(longitude);
        request.setAccuracy(4.0);
        request.setTimestamp(Instant.now().toString());
        return request;
    }

    private TeamMemberRequestDTO member(String name) {
        TeamMemberRequestDTO request = new TeamMemberRequestDTO();
        request.setName(name);
        request.setRole("Responder");
        return request;
    }
}
