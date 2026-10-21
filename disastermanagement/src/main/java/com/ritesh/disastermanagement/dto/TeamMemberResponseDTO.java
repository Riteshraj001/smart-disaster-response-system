package com.ritesh.disastermanagement.dto;
public record TeamMemberResponseDTO(Long id, String name, String role, String contactInfo, boolean available, Long teamId, String teamName) { }
