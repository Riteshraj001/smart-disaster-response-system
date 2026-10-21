package com.ritesh.disastermanagement;

import com.ritesh.disastermanagement.dto.*;
import com.ritesh.disastermanagement.exception.ApiException;
import com.ritesh.disastermanagement.service.IncidentService;
import com.ritesh.disastermanagement.service.ResponseTeamService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class IncidentWorkflowIntegrationTests {
    @Autowired private IncidentService incidents;
    @Autowired private ResponseTeamService teams;

    @Test
    void createsAssignmentReassignmentAndTransitions() {
        IncidentResponseDTO incident = incidents.saveIncident(incident("HIGH"));
        assertEquals("HIGH", incident.getSeverity());
        assertEquals("PENDING_VERIFICATION", incident.getStatus());
        assertThrows(ApiException.class, () -> incidents.assign(incident.getId(), assignment(1L, null)));

        incidents.updateStatus(incident.getId(), "VERIFIED");
        ResponseTeamResponseDTO first = teams.createTeam(team("Fire Unit"));
        TeamMemberResponseDTO firstMember = teams.createMember(first.id(), member("Asha"));
        IncidentResponseDTO assigned = incidents.assign(incident.getId(), assignment(first.id(), firstMember.id()));
        assertEquals("ASSIGNED", assigned.getStatus());
        assertEquals(first.id(), assigned.getCurrentAssignment().teamId());

        ResponseTeamResponseDTO second = teams.createTeam(team("Medical Unit"));
        IncidentResponseDTO reassigned = incidents.assign(incident.getId(), assignment(second.id(), null));
        assertEquals(second.id(), reassigned.getCurrentAssignment().teamId());
        assertEquals(2, incidents.history(incident.getId()).size());
        assertFalse(incidents.history(incident.getId()).get(1).active());

        assertThrows(ApiException.class, () -> incidents.updateStatus(incident.getId(), "RESOLVED"));
        incidents.updateStatus(incident.getId(), "RESPONSE_DISPATCHED");
        incidents.updateStatus(incident.getId(), "RESPONDING");
        assertThrows(ApiException.class, () -> incidents.updateStatus(incident.getId(), "RESOLVED"));
        assertEquals("RESPONSE_COMPLETED", incidents.updateStatus(incident.getId(), "RESPONSE_COMPLETED").getStatus());
        assertEquals("RESOLVED", incidents.updateStatus(incident.getId(), "RESOLVED").getStatus());
    }

    @Test
    void supportsDispatchResponseWorkflowAndRejectsInvalidTransitions() {
        IncidentResponseDTO incident = incidents.saveIncident(incident("HIGH"));
        incidents.updateStatus(incident.getId(), "VERIFIED");
        ResponseTeamResponseDTO team = teams.createTeam(team("Response Unit"));
        incidents.assign(incident.getId(), assignment(team.id(), null));

        assertEquals("RESPONSE_DISPATCHED", incidents.updateStatus(incident.getId(), "RESPONSE_DISPATCHED").getStatus());
        assertThrows(ApiException.class, () -> incidents.updateStatus(incident.getId(), "RESPONSE_COMPLETED"));
        assertEquals("RESPONDING", incidents.updateStatus(incident.getId(), "RESPONDING").getStatus());
        assertEquals("RESPONSE_COMPLETED", incidents.updateStatus(incident.getId(), "RESPONSE_COMPLETED").getStatus());
        assertEquals("RESOLVED", incidents.updateStatus(incident.getId(), "RESOLVED").getStatus());
        assertThrows(ApiException.class, () -> incidents.updateStatus(incident.getId(), "VERIFIED"));
    }

    @Test
    void rejectsUnknownSeverityAndInvalidMemberTeamCombination() {
        IncidentRequestDTO invalid = incident("URGENT");
        assertThrows(ApiException.class, () -> incidents.saveIncident(invalid));
        ResponseTeamResponseDTO team1 = teams.createTeam(team("Rescue Unit A"));
        ResponseTeamResponseDTO team2 = teams.createTeam(team("Rescue Unit B"));
        TeamMemberResponseDTO member = teams.createMember(team1.id(), member("Vikram"));
        IncidentResponseDTO created = incidents.saveIncident(incident("LOW"));
        incidents.updateStatus(created.getId(), "VERIFIED");
        assertThrows(ApiException.class, () -> incidents.assign(created.getId(), assignment(team2.id(), member.id())));
    }

    @Test
    void seedsTheDefaultStationTeamForAssignmentLookup() {
        assertEquals("Station 1 Fire & Rescue Engine", teams.getTeamByName("Station 1 Fire & Rescue Engine").getName());
    }

    @Test
    void resolvesLegacyTeamNamePayloadToPersistedTeamAndAssignment() {
        var team = teams.getTeamByName("Station 1 Fire & Rescue Engine");
        IncidentResponseDTO created = incidents.saveIncident(incident("HIGH"));

        IncidentResponseDTO verified = incidents.updateStatus(created.getId(), "VERIFIED");
        assertEquals("VERIFIED", incidents.getIncidentById(created.getId()).getStatus());
        assertEquals("VERIFIED", verified.getStatus());

        AssignmentRequestDTO request = new AssignmentRequestDTO();
        request.setTeamName("Station 1 Fire & Rescue Engine");
        request.setNotes("Dispatcher selected the listed team");
        request.setPriorityOverrideReason("Dispatcher authorized this assignment");
        IncidentResponseDTO assigned = incidents.assign(created.getId(), request);

        assertEquals("ASSIGNED", assigned.getStatus());
        assertEquals(team.getId(), assigned.getCurrentAssignment().teamId());
        assertEquals(team.getName(), assigned.getAssignedTeam());
        assertEquals(team.getId(), teams.listTeams(true).stream()
                .filter(available -> available.name().equals(team.getName()))
                .findFirst().orElseThrow().id());
        assertEquals(created.getId(), incidents.getAssignedToTeam(team.getId()).stream()
                .filter(item -> item.getId().equals(created.getId()))
                .findFirst().orElseThrow().getId());
        assertThrows(ApiException.class, () -> {
            AssignmentRequestDTO missing = new AssignmentRequestDTO();
            missing.setTeamName("Station 99 Missing Unit");
            missing.setPriorityOverrideReason("Dispatcher authorized this assignment");
            incidents.assign(created.getId(), missing);
        });
    }

    @Test
    void prioritizesUnresolvedCriticalIncidentsAndValidatesCoordinates() {
        IncidentResponseDTO low = incidents.saveIncident(incident("LOW"));
        IncidentRequestDTO criticalRequest = incident("CRITICAL"); criticalRequest.setLatitude(28.6139); criticalRequest.setLongitude(77.2090);
        IncidentResponseDTO critical = incidents.saveIncident(criticalRequest);
        assertNotEquals(low.getId(), critical.getId());
        assertEquals("CRITICAL", incidents.priorityQueue().incidents().getFirst().getSeverity());
        assertEquals(1, incidents.priorityQueue().unresolvedCriticalCount());
        assertEquals(critical.getId(), incidents.priorityQueue().unresolvedCriticalIncidents().getFirst().getId());
        assertEquals(28.6139, critical.getLatitude());
        IncidentRequestDTO partialCoordinates = incident("MEDIUM"); partialCoordinates.setLatitude(20.0);
        assertThrows(ApiException.class, () -> incidents.saveIncident(partialCoordinates));
        IncidentRequestDTO invalidCoordinates = incident("MEDIUM"); invalidCoordinates.setLatitude(91.0); invalidCoordinates.setLongitude(20.0);
        assertThrows(ApiException.class, () -> incidents.saveIncident(invalidCoordinates));
    }

    private IncidentRequestDTO incident(String severity) { IncidentRequestDTO r = new IncidentRequestDTO(); r.setDisasterType("Fire"); r.setLocation("Lab"); r.setSeverity(severity); return r; }
    private ResponseTeamRequestDTO team(String name) { ResponseTeamRequestDTO r = new ResponseTeamRequestDTO(); r.setName(name); r.setSpecialization("Emergency"); return r; }
    private TeamMemberRequestDTO member(String name) { TeamMemberRequestDTO r = new TeamMemberRequestDTO(); r.setName(name); r.setRole("Lead"); return r; }
    private AssignmentRequestDTO assignment(Long teamId, Long memberId) { AssignmentRequestDTO r = new AssignmentRequestDTO(); r.setTeamId(teamId); r.setMemberId(memberId); r.setNotes("Dispatch"); r.setPriorityOverrideReason("Dispatcher capacity decision"); return r; }
}
