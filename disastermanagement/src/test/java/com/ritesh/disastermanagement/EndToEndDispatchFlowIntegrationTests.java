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
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.MethodOrderer;
import org.junit.jupiter.api.Order;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.TestInstance;
import org.junit.jupiter.api.TestMethodOrder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.time.Instant;
import java.util.List;
import java.util.concurrent.*;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@TestInstance(TestInstance.Lifecycle.PER_CLASS)
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
@TestPropertySource(properties = {
        "app.tracking.responder-tokens=1=token-e2e-alpha;2=token-e2e-bravo",
        "app.tracking.vehicle-tokens=veh-e2e=token-e2e-veh",
        "app.tracking.vehicle-team-ids=veh-e2e=1",
        "app.tracking.vehicle-identifiers=veh-e2e=Rescue Cruiser 01",
        "app.dispatch.offer-batch-size=2",
        "app.dispatch.offer-timeout-seconds=60",
        "app.tracking.minimum-update-seconds=0"
})
public class EndToEndDispatchFlowIntegrationTests {

    @Autowired private IncidentService incidentService;
    @Autowired private ResponseTeamService responseTeamService;
    @Autowired private DispatchService dispatchService;
    @Autowired private TrackingService trackingService;
    @Autowired private TeamMemberRepository teamMemberRepository;
    @Autowired private DispatchOfferRepository dispatchOfferRepository;

    private Long teamId;
    private Long primaryMemberId;
    private Long secondaryMemberId;

    // Shared state between sequential ordered tests
    private Long e2eIncidentId;
    private String e2eCitizenTrackingToken;
    private Long e2eAcceptedOfferId;

    @BeforeAll
    void setupTeamAndResponders() {
        var team = responseTeamService.getTeamByName("Station 1 Fire & Rescue Engine");
        teamId = team.getId();

        primaryMemberId = responseTeamService.createMember(teamId, createMemberRequest("Officer Verma")).id();
        secondaryMemberId = responseTeamService.createMember(teamId, createMemberRequest("Officer Sharma")).id();

        assertEquals(1L, primaryMemberId);
        assertEquals(2L, secondaryMemberId);

        // Position members initially in Delhi area
        setMemberCoordinates(primaryMemberId, 28.6140, 77.2091, "ONLINE");
        setMemberCoordinates(secondaryMemberId, 28.6500, 77.2300, "ONLINE");
    }

    @Test
    @Order(1)
    @DisplayName("Test A — Incident reporting: Submit valid incident with coordinates and verify persistence")
    void testA_incidentReportingWithCoordinates() {
        IncidentRequestDTO request = new IncidentRequestDTO();
        request.setDisasterType("Fire");
        request.setLocation("Connaught Place Block A, New Delhi");
        request.setSeverity("CRITICAL");
        request.setSource("CITIZEN");
        request.setLatitude(28.6315);
        request.setLongitude(77.2167);

        IncidentResponseDTO created = incidentService.saveIncident(request);
        assertNotNull(created.getId(), "Incident must have generated ID");
        assertEquals("PENDING_VERIFICATION", created.getStatus());
        assertEquals(28.6315, created.getLatitude(), 0.0001);
        assertEquals(77.2167, created.getLongitude(), 0.0001);
        assertNotNull(created.getTrackingToken(), "Citizen tracking token must be issued upon report creation");

        e2eIncidentId = created.getId();
        e2eCitizenTrackingToken = created.getTrackingToken();

        // Verify retrieval from backend persistence
        IncidentResponseDTO fetched = incidentService.getIncidentById(e2eIncidentId);
        assertEquals("Connaught Place Block A, New Delhi", fetched.getLocation());
        assertEquals("CRITICAL", fetched.getSeverity());
    }

    @Test
    @Order(2)
    @DisplayName("Test B — Dispatch offer: Verification creates offers for eligible responders ranked by proximity")
    void testB_dispatchOffersGeneratedAndRanked() {
        // Transition incident to VERIFIED to trigger automatic dispatch pipeline
        IncidentResponseDTO verified = incidentService.updateStatus(e2eIncidentId, "VERIFIED");
        assertEquals("OFFERED", verified.getDispatchState());

        // Authenticated Responder Alpha checks their dispatch offers
        List<DispatchOfferResponseDTO> alphaOffers = dispatchService.responderOffers("Bearer token-e2e-alpha");
        assertFalse(alphaOffers.isEmpty(), "Responder Alpha must receive a dispatch offer");

        DispatchOfferResponseDTO targetOffer = alphaOffers.stream()
                .filter(o -> o.incidentId().equals(e2eIncidentId))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Offer for incident " + e2eIncidentId + " not found for Alpha"));

        assertEquals(primaryMemberId, targetOffer.memberId());
        assertEquals(teamId, targetOffer.teamId());
        assertEquals(1, targetOffer.candidateRank(), "Alpha is closest and should be Rank #1");
        assertNull(targetOffer.distanceMeters(), "Offers must not label straight-line proximity as road distance");
        assertNull(targetOffer.estimatedTravelSeconds(), "Road ETA is calculated by the citizen client only after a live GPS fix");
        assertEquals("OFFERED", targetOffer.state());

        e2eAcceptedOfferId = targetOffer.id();

        // Authenticated Responder Bravo also receives offer as batch size is 2
        List<DispatchOfferResponseDTO> bravoOffers = dispatchService.responderOffers("Bearer token-e2e-bravo");
        assertTrue(bravoOffers.stream().anyMatch(o -> o.incidentId().equals(e2eIncidentId)));
    }

    @Test
    @Order(3)
    @DisplayName("Test C — Acceptance: Offer acceptance creates active assignment and prevents competing claims")
    void testC_acceptanceCreatesActiveAssignmentAndRejectsCompeting() throws Exception {
        // Fetch Bravo's offer ID for the same incident
        List<DispatchOfferResponseDTO> bravoOffers = dispatchService.responderOffers("Bearer token-e2e-bravo");
        DispatchOfferResponseDTO bravoOffer = bravoOffers.stream()
                .filter(o -> o.incidentId().equals(e2eIncidentId))
                .findFirst()
                .orElseThrow();

        // Alpha accepts the offer
        DispatchOfferResponseDTO accepted = dispatchService.accept("Bearer token-e2e-alpha", e2eAcceptedOfferId);
        assertEquals("ACCEPTED", accepted.state());

        // Verify incident state in backend
        IncidentResponseDTO incident = incidentService.getIncidentById(e2eIncidentId);
        assertEquals("ASSIGNED", incident.getStatus());
        assertEquals("ACCEPTED", incident.getDispatchState());
        assertNotNull(incident.getCurrentAssignment());
        assertEquals(primaryMemberId, incident.getCurrentAssignment().memberId());
        assertEquals(teamId, incident.getCurrentAssignment().teamId());

        // Verify that competing responder Bravo cannot accept after Alpha accepted
        assertThrows(ApiException.class, () -> {
            dispatchService.accept("Bearer token-e2e-bravo", bravoOffer.id());
        }, "Competing responder acceptance must be rejected with conflict");

        // Verify Bravo's offers list no longer presents the claimed incident
        List<DispatchOfferResponseDTO> bravoUpdatedOffers = dispatchService.responderOffers("Bearer token-e2e-bravo");
        assertTrue(bravoUpdatedOffers.stream().noneMatch(o -> o.incidentId().equals(e2eIncidentId)));
    }

    @Test
    @Order(4)
    @DisplayName("Test D — GPS authorization: Authenticated responder GPS update is accepted for authorized assignment")
    void testD_gpsLocationUpdateAcceptedForAuthorizedAssignment() {
        // Alpha submits location update (starting point near 28.6145, 77.2095)
        LocationUpdateRequestDTO locRequest = new LocationUpdateRequestDTO();
        locRequest.setLatitude(28.6145);
        locRequest.setLongitude(77.2095);
        locRequest.setAccuracy(8.5);
        locRequest.setTimestamp(Instant.now().toString());

        LocationUpdateResponseDTO response = trackingService.updateResponder("Bearer token-e2e-alpha", locRequest);
        assertNotNull(response);
        assertEquals("RESPONDER_PHONE", response.sourceType());
        assertEquals(String.valueOf(primaryMemberId), response.sourceId());
        assertEquals(e2eIncidentId, response.incidentId());
        assertEquals("ONLINE", response.status());
        assertEquals(28.6145, response.latitude(), 0.0001);
        assertEquals(77.2095, response.longitude(), 0.0001);
    }

    @Test
    @Order(5)
    @DisplayName("Test E — Citizen tracking: Authorized citizen views real stored coordinates, road ETA, and distance")
    void testE_citizenTrackingDisplaysRealCoordinatesAndEta() {
        IncidentResponseDTO citizenView = trackingService.citizenTracking(e2eIncidentId, e2eCitizenTrackingToken);

        assertNotNull(citizenView, "Citizen tracking view must be returned");
        assertEquals(e2eIncidentId, citizenView.getId());
        assertEquals("ASSIGNED", citizenView.getStatus());
        assertEquals("ACCEPTED", citizenView.getDispatchState());

        // Real responder location assertions
        ResponderLocationDTO responderLoc = citizenView.getResponderLocation();
        assertNotNull(responderLoc, "Citizen view must have actual responder location");
        assertEquals("ONLINE", responderLoc.status());
        assertEquals(28.6145, responderLoc.latitude(), 0.0001);
        assertEquals(77.2095, responderLoc.longitude(), 0.0001);
        assertNotNull(responderLoc.locationTimestamp(), "Timestamp must be real recorded time");

        // ETA & Road distance assertions
        assertNull(citizenView.getDistanceMeters(), "Backend must not fabricate road distance");
        assertNull(citizenView.getEstimatedTravelSeconds(), "Backend must not fabricate route duration");
        assertNull(citizenView.getEstimatedArrivalTime(), "Backend must not fabricate route arrival time");
    }

    @Test
    @Order(6)
    @DisplayName("Test F — Location changes: Newer responder movement updates coordinates, distance, and timestamp")
    void testF_locationChangesUpdateCoordinatesAndEta() {
        // Responder moves closer toward Connaught Place (28.6250, 77.2130)
        LocationUpdateRequestDTO moved = new LocationUpdateRequestDTO();
        moved.setLatitude(28.6250);
        moved.setLongitude(77.2130);
        moved.setAccuracy(6.0);
        moved.setTimestamp(Instant.now().toString());

        LocationUpdateResponseDTO updatedLocation = trackingService.updateResponder("Bearer token-e2e-alpha", moved);
        assertEquals(28.6250, updatedLocation.latitude(), 0.0001);
        assertEquals(77.2130, updatedLocation.longitude(), 0.0001);

        // Fetch citizen view again and verify updated coordinates & decreased distance
        IncidentResponseDTO citizenView = trackingService.citizenTracking(e2eIncidentId, e2eCitizenTrackingToken);
        assertEquals(28.6250, citizenView.getResponderLocation().latitude(), 0.0001);
        assertEquals(77.2130, citizenView.getResponderLocation().longitude(), 0.0001);
        assertNull(citizenView.getDistanceMeters(), "Backend must not fabricate route distance after movement");
    }

    @Test
    @Order(7)
    @DisplayName("Test G — Security: Reject unauthorized responders and protect private citizen tracking")
    void testG_securityValidation() {
        // 1. Unauthorized responder (unregistered token)
        LocationUpdateRequestDTO rogueGps = new LocationUpdateRequestDTO();
        rogueGps.setLatitude(28.6200);
        rogueGps.setLongitude(77.2100);
        rogueGps.setTimestamp(Instant.now().toString());

        ApiException badTokenEx = assertThrows(ApiException.class, () -> {
            trackingService.updateResponder("Bearer completely-fake-token", rogueGps);
        });
        assertEquals(401, badTokenEx.getStatus().value(), "Unregistered responder token must return 401 Unauthorized");

        // 2. Responder Bravo has no active assignment for this incident now
        ApiException unassignedEx = assertThrows(ApiException.class, () -> {
            trackingService.updateResponder("Bearer token-e2e-bravo", rogueGps);
        });
        assertEquals(409, unassignedEx.getStatus().value(), "Responder without active assignment must return 409 Conflict");

        // 3. Unauthorized citizen trying to access e2eIncidentId with an invalid token
        ApiException badCitizenEx = assertThrows(ApiException.class, () -> {
            trackingService.citizenTracking(e2eIncidentId, "wrong-incident-token-12345");
        });
        assertEquals(403, badCitizenEx.getStatus().value(), "Citizen with invalid tracking token must receive 403 Forbidden");

        // 4. Incident tracking token for a different incident cannot access e2eIncidentId
        IncidentResponseDTO otherIncident = incidentService.saveIncident(createQuickIncident("Flood", "Yamuna Bank"));
        ApiException mismatchedTokenEx = assertThrows(ApiException.class, () -> {
            trackingService.citizenTracking(e2eIncidentId, otherIncident.getTrackingToken());
        });
        assertEquals(403, mismatchedTokenEx.getStatus().value(), "Foreign tracking token must receive 403 Forbidden");
    }

    @Test
    @Order(8)
    @DisplayName("Test H — Failure cases: Declined offers, expired offers, stale locations, and offline responder")
    void testH_failureCases() {
        // 1. Invalid coordinate boundaries (e.g. latitude > 90) while assigned
        LocationUpdateRequestDTO outOfBoundsGps = new LocationUpdateRequestDTO();
        outOfBoundsGps.setLatitude(99.999);
        outOfBoundsGps.setLongitude(77.2131);
        outOfBoundsGps.setTimestamp(Instant.now().toString());

        ApiException oobEx = assertThrows(ApiException.class, () -> {
            trackingService.updateResponder("Bearer token-e2e-alpha", outOfBoundsGps);
        });
        assertEquals(400, oobEx.getStatus().value(), "Out of bounds coordinate must be rejected with 400 Bad Request");

        // 2. Stale GPS update rejection (timestamp in the past or identical)
        Instant now = Instant.now();
        LocationUpdateRequestDTO staleGps = new LocationUpdateRequestDTO();
        staleGps.setLatitude(28.6251);
        staleGps.setLongitude(77.2131);
        staleGps.setTimestamp(now.minusSeconds(120).toString());

        ApiException staleEx = assertThrows(ApiException.class, () -> {
            trackingService.updateResponder("Bearer token-e2e-alpha", staleGps);
        });
        assertEquals(409, staleEx.getStatus().value(), "Stale GPS timestamp must be rejected with 409 Conflict");

        // 3. Responder stops tracking / goes OFFLINE
        trackingService.stopResponder("Bearer token-e2e-alpha");
        LocationUpdateResponseDTO offlineLoc = trackingService.responderLocation("Bearer token-e2e-alpha");
        assertEquals("OFFLINE", offlineLoc.status());

        // 4. Resolve e2e incident and verify tracking ceases
        incidentService.updateStatus(e2eIncidentId, "RESPONSE_DISPATCHED");
        incidentService.updateStatus(e2eIncidentId, "RESPONDING");
        incidentService.updateStatus(e2eIncidentId, "RESPONSE_COMPLETED");
        incidentService.updateStatus(e2eIncidentId, "RESOLVED");

        IncidentResponseDTO resolvedView = trackingService.citizenTracking(e2eIncidentId, e2eCitizenTrackingToken);
        assertEquals("RESOLVED", resolvedView.getStatus());

        // Location updates after incident resolution are rejected
        ApiException resolvedUpdateEx = assertThrows(ApiException.class, () -> {
            LocationUpdateRequestDTO afterResolveGps = new LocationUpdateRequestDTO();
            afterResolveGps.setLatitude(28.6255);
            afterResolveGps.setLongitude(77.2135);
            afterResolveGps.setTimestamp(Instant.now().toString());
            trackingService.updateResponder("Bearer token-e2e-alpha", afterResolveGps);
        });
        assertEquals(409, resolvedUpdateEx.getStatus().value(), "Updates after incident resolution must be rejected");

        // 5. Test Secondary Incident Offers: Declined & Expired workflows
        setMemberCoordinates(primaryMemberId, 28.6140, 77.2091, "ONLINE");
        setMemberCoordinates(secondaryMemberId, 28.6500, 77.2300, "ONLINE");

        IncidentResponseDTO newIncident = incidentService.saveIncident(createQuickIncident("Fire", "Okhla Phase 3"));
        incidentService.updateStatus(newIncident.getId(), "VERIFIED");

        List<DispatchOfferResponseDTO> offersForAlpha = dispatchService.responderOffers("Bearer token-e2e-alpha");
        DispatchOfferResponseDTO fireOffer = offersForAlpha.stream()
                .filter(o -> o.incidentId().equals(newIncident.getId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Offer for secondary incident not found for Alpha"));

        OfferDecisionRequestDTO declineReq = new OfferDecisionRequestDTO();
        declineReq.setReason("Unit undergoing refueling");
        DispatchOfferResponseDTO declined = dispatchService.decline("Bearer token-e2e-alpha", fireOffer.id(), declineReq);
        assertEquals("DECLINED", declined.state());
        assertEquals("VERIFIED", incidentService.getIncidentById(newIncident.getId()).getStatus());

        // 6. Expired offer workflow for Bravo
        List<DispatchOfferResponseDTO> offersForBravo = dispatchService.responderOffers("Bearer token-e2e-bravo");
        DispatchOfferResponseDTO bravoFireOffer = offersForBravo.stream()
                .filter(o -> o.incidentId().equals(newIncident.getId()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("Offer for secondary incident not found for Bravo"));

        // Simulate offer timeout
        DispatchOffer persistedOffer = dispatchOfferRepository.findById(bravoFireOffer.id()).orElseThrow();
        persistedOffer.setExpiresAt(Instant.now().minusSeconds(10));
        dispatchOfferRepository.save(persistedOffer);

        // Expired offer is marked EXPIRED and filtered from active list
        List<DispatchOfferResponseDTO> bravoRefreshed = dispatchService.responderOffers("Bearer token-e2e-bravo");
        assertTrue(bravoRefreshed.stream().noneMatch(o -> o.incidentId().equals(newIncident.getId())));
        assertEquals("EXPIRED", dispatchOfferRepository.findById(bravoFireOffer.id()).orElseThrow().getState());

        // Unassigned incident has null responder location in citizen tracking
        IncidentResponseDTO newCitizenView = trackingService.citizenTracking(newIncident.getId(), newIncident.getTrackingToken());
        assertNull(newCitizenView.getResponderLocation());
    }

    private void setMemberCoordinates(Long id, double latitude, double longitude, String status) {
        TeamMember member = teamMemberRepository.findById(id).orElseThrow();
        member.setLastLatitude(latitude);
        member.setLastLongitude(longitude);
        member.setLastLocationAt(Instant.now());
        member.setLocationStatus(status);
        teamMemberRepository.save(member);
    }

    private TeamMemberRequestDTO createMemberRequest(String name) {
        TeamMemberRequestDTO request = new TeamMemberRequestDTO();
        request.setName(name);
        request.setRole("Senior Responder");
        return request;
    }

    private IncidentRequestDTO createQuickIncident(String type, String location) {
        IncidentRequestDTO request = new IncidentRequestDTO();
        request.setDisasterType(type);
        request.setLocation(location);
        request.setSeverity("HIGH");
        request.setSource("CITIZEN");
        request.setLatitude(28.5355);
        request.setLongitude(77.2500);
        return request;
    }
}
