package com.ritesh.disastermanagement.dto;

import java.util.List;
public record ResponseTeamResponseDTO(Long id, String name, String specialization, boolean available, List<TeamMemberResponseDTO> members) { }
