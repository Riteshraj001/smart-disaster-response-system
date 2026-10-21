package com.ritesh.disastermanagement.dto;

public record ResponderIdentityResponseDTO(
        Long memberId,
        String memberName,
        String role,
        Long teamId,
        String teamName
) {
}
