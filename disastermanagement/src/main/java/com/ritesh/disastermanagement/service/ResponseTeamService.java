package com.ritesh.disastermanagement.service;

import com.ritesh.disastermanagement.dto.*;
import com.ritesh.disastermanagement.entity.ResponseTeam;
import com.ritesh.disastermanagement.entity.TeamMember;
import com.ritesh.disastermanagement.exception.ApiException;
import com.ritesh.disastermanagement.repository.ResponseTeamRepository;
import com.ritesh.disastermanagement.repository.TeamMemberRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class ResponseTeamService {
    private final ResponseTeamRepository teamRepository;
    private final TeamMemberRepository memberRepository;
    public ResponseTeamService(ResponseTeamRepository teamRepository, TeamMemberRepository memberRepository) { this.teamRepository = teamRepository; this.memberRepository = memberRepository; }

    @Transactional
    public ResponseTeamResponseDTO createTeam(ResponseTeamRequestDTO request) {
        if (teamRepository.existsByNameIgnoreCase(request.getName().trim())) throw new ApiException(HttpStatus.CONFLICT, "A response team with that name already exists");
        ResponseTeam team = new ResponseTeam(); team.setName(request.getName().trim()); team.setSpecialization(request.getSpecialization()); team.setAvailable(!Boolean.FALSE.equals(request.getAvailable()));
        return toTeamDto(teamRepository.save(team));
    }
    @Transactional(readOnly = true)
    public List<ResponseTeamResponseDTO> listTeams(boolean availableOnly) {
        List<ResponseTeam> teams = availableOnly ? teamRepository.findByAvailableTrueOrderByNameAsc() : teamRepository.findAllByOrderByNameAsc();
        return teams.stream().map(this::toTeamDto).toList();
    }
    @Transactional
    public TeamMemberResponseDTO createMember(Long teamId, TeamMemberRequestDTO request) {
        ResponseTeam team = getTeam(teamId); TeamMember member = new TeamMember(); member.setTeam(team); member.setName(request.getName().trim()); member.setRole(request.getRole()); member.setContactInfo(request.getContactInfo()); member.setAvailable(!Boolean.FALSE.equals(request.getAvailable()));
        return toMemberDto(memberRepository.save(member));
    }
    @Transactional(readOnly = true)
    public List<TeamMemberResponseDTO> listMembers(Long teamId, boolean availableOnly) {
        List<TeamMember> members = teamId == null ? (availableOnly ? memberRepository.findByAvailableTrueOrderByNameAsc() : memberRepository.findAll()) : memberRepository.findByTeamIdOrderByNameAsc(teamId);
        return members.stream().filter(member -> !availableOnly || member.isAvailable()).map(this::toMemberDto).toList();
    }
    @Transactional(readOnly = true) public ResponseTeam getTeam(Long id) { return teamRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Response team " + id + " was not found")); }
    @Transactional(readOnly = true)
    public ResponseTeam getTeamByName(String name) {
        if (name == null || name.isBlank()) throw new ApiException(HttpStatus.BAD_REQUEST, "teamId or teamName is required");
        String requestedName = name.trim();
        return teamRepository.findByNameIgnoreCase(requestedName)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Response team \"" + requestedName + "\" was not found; fetch available teams from GET /api/response-teams"));
    }
    @Transactional(readOnly = true) public TeamMember getMember(Long id) { return memberRepository.findById(id).orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "Team member " + id + " was not found")); }
    public ResponseTeamResponseDTO toTeamDto(ResponseTeam team) { return new ResponseTeamResponseDTO(team.getId(), team.getName(), team.getSpecialization(), team.isAvailable(), team.getMembers().stream().map(this::toMemberDto).toList()); }
    public TeamMemberResponseDTO toMemberDto(TeamMember member) { return new TeamMemberResponseDTO(member.getId(), member.getName(), member.getRole(), member.getContactInfo(), member.isAvailable(), member.getTeam().getId(), member.getTeam().getName()); }
}
