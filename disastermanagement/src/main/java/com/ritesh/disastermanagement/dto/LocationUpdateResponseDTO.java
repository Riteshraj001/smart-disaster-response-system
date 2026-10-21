package com.ritesh.disastermanagement.dto;

import java.time.Instant;

public record LocationUpdateResponseDTO(
        String sourceType,
        String sourceId,
        Long incidentId,
        String teamName,
        Double latitude,
        Double longitude,
        Double accuracy,
        Instant locationTimestamp,
        String status
) { }
