package com.ritesh.disastermanagement.dto;

import java.time.Instant;

public record DispatchOfferResponseDTO(
        Long id,
        Long incidentId,
        String disasterType,
        String location,
        Double incidentLatitude,
        Double incidentLongitude,
        String severity,
        String incidentStatus,
        String dispatchState,
        Long teamId,
        String teamName,
        Long memberId,
        String memberName,
        Instant offeredAt,
        Instant expiresAt,
        String state,
        Double distanceMeters,
        Long estimatedTravelSeconds,
        Integer candidateRank
) { }
