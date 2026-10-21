package com.ritesh.disastermanagement.dto;

import java.time.Instant;

public record ResponderLocationDTO(
        String sourceType,
        String sourceId,
        String teamName,
        Double latitude,
        Double longitude,
        Double accuracy,
        Instant locationTimestamp,
        String status,
        Double distanceMeters,
        Long estimatedTravelSeconds,
        Instant estimatedArrivalTime
) {
    public ResponderLocationDTO(String sourceType, String sourceId, String teamName, Double latitude, Double longitude, Double accuracy, Instant locationTimestamp, String status) {
        this(sourceType, sourceId, teamName, latitude, longitude, accuracy, locationTimestamp, status, null, null, null);
    }
}
