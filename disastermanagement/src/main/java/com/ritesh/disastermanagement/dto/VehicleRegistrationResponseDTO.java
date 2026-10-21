package com.ritesh.disastermanagement.dto;

public record VehicleRegistrationResponseDTO(Long id, String vehicleIdentifier, String deviceId, Long teamId, String teamName, boolean active) { }
