package com.ritesh.disastermanagement.controller;

import com.ritesh.disastermanagement.dto.*;
import com.ritesh.disastermanagement.service.ResponseTeamService;
import jakarta.validation.Valid;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api") @CrossOrigin(origins = "*")
public class ResponseTeamController {
    private final ResponseTeamService service;
    public ResponseTeamController(ResponseTeamService service) { this.service = service; }
    @PostMapping("/response-teams") public ResponseEntity<ResponseTeamResponseDTO> createTeam(@Valid @RequestBody ResponseTeamRequestDTO request) { return ResponseEntity.status(HttpStatus.CREATED).body(service.createTeam(request)); }
    @GetMapping("/response-teams") public List<ResponseTeamResponseDTO> listTeams(@RequestParam(defaultValue = "false") boolean availableOnly) { return service.listTeams(availableOnly); }
    @PostMapping("/response-teams/{teamId}/members") public ResponseEntity<TeamMemberResponseDTO> createMember(@PathVariable Long teamId, @Valid @RequestBody TeamMemberRequestDTO request) { return ResponseEntity.status(HttpStatus.CREATED).body(service.createMember(teamId, request)); }
    @GetMapping("/response-teams/{teamId}/members") public List<TeamMemberResponseDTO> listTeamMembers(@PathVariable Long teamId, @RequestParam(defaultValue = "false") boolean availableOnly) { service.getTeam(teamId); return service.listMembers(teamId, availableOnly); }
    @GetMapping("/response-members") public List<TeamMemberResponseDTO> listMembers(@RequestParam(defaultValue = "false") boolean availableOnly) { return service.listMembers(null, availableOnly); }
}
