package com.ritesh.disastermanagement.dto;
import java.time.LocalDateTime;
public record AssignmentResponseDTO(Long id, Long teamId, String teamName, Long memberId, String memberName, Long vehicleId, String vehicleIdentifier, LocalDateTime assignedAt, LocalDateTime unassignedAt, String notes, String priorityOverrideReason, boolean active) { }
