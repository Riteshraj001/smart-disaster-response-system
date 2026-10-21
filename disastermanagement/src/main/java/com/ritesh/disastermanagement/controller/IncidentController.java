package com.ritesh.disastermanagement.controller;

import com.ritesh.disastermanagement.dto.*;
import com.ritesh.disastermanagement.exception.ApiException;
import com.ritesh.disastermanagement.service.IncidentService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping({"/api/incidents", "/incidents"}) @CrossOrigin(origins = "*")
public class IncidentController {
    private final IncidentService service; public IncidentController(IncidentService service) { this.service = service; }
    // Kept as 200 for ESP32 clients that already consume the original endpoint.
    @PostMapping public ResponseEntity<IncidentResponseDTO> create(@Valid @RequestBody IncidentRequestDTO r) { return ResponseEntity.ok(service.saveIncident(r)); }
    @GetMapping public List<IncidentResponseDTO> all() { return service.getAllIncidents(); }
    @GetMapping("/queue") public PriorityQueueResponseDTO queue() { return service.priorityQueue(); }
    @GetMapping("/{id}") public IncidentResponseDTO one(@PathVariable Long id) { IncidentResponseDTO dto = service.getIncidentById(id); if (dto == null) throw new ApiException(HttpStatus.NOT_FOUND, "Incident " + id + " was not found"); return dto; }
    @PutMapping("/{id}") public IncidentResponseDTO update(@PathVariable Long id, @Valid @RequestBody IncidentRequestDTO r) { return service.updateIncident(id, r); }
    @PatchMapping("/{id}/status") public IncidentResponseDTO status(@PathVariable Long id, @Valid @RequestBody StatusUpdateRequestDTO r) { return service.updateStatus(id, r.getStatus()); }
    @PutMapping("/{id}/assignment") public IncidentResponseDTO assignment(@PathVariable Long id, @Valid @RequestBody AssignmentRequestDTO r) { return service.assign(id, r); }
    @GetMapping("/{id}/assignments") public List<AssignmentResponseDTO> history(@PathVariable Long id) { return service.history(id); }
    @GetMapping("/assigned/team/{teamId}") public List<IncidentResponseDTO> byTeam(@PathVariable Long teamId) { return service.getAssignedToTeam(teamId); }
    @GetMapping("/assigned/member/{memberId}") public List<IncidentResponseDTO> byMember(@PathVariable Long memberId) { return service.getAssignedToMember(memberId); }
    @DeleteMapping("/{id}") public ResponseEntity<Void> delete(@PathVariable Long id) { return service.deleteIncident(id) ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build(); }
}
