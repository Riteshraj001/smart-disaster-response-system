package com.ritesh.disastermanagement.dto;

public record GeocodingResultDTO(
        Long placeId,
        String displayName,
        String name,
        String type,
        Double latitude,
        Double longitude
) { }
