package com.ritesh.disastermanagement.service;

import com.ritesh.disastermanagement.entity.TeamMember;
import com.ritesh.disastermanagement.exception.ApiException;
import com.ritesh.disastermanagement.repository.TeamMemberRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;

@Service
public class TrackingTokenService {
    private final TeamMemberRepository members;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.tracking.responder-tokens:}")
    private String responderTokens;
    @Value("${app.tracking.vehicle-tokens:}")
    private String vehicleTokens;
    @Value("${app.tracking.vehicle-team-ids:}")
    private String vehicleTeamIds;
    @Value("${app.tracking.vehicle-identifiers:}")
    private String vehicleIdentifiers;

    public TrackingTokenService(TeamMemberRepository members) {
        this.members = members;
    }

    public String createIncidentToken() {
        byte[] bytes = new byte[32];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    public String hash(String token) {
        if (token == null || token.isBlank()) return null;
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(token.trim().getBytes(StandardCharsets.UTF_8));
            StringBuilder result = new StringBuilder();
            for (byte value : digest) result.append(String.format("%02x", value));
            return result.toString();
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("SHA-256 is not available", exception);
        }
    }

    public boolean matches(String token, String storedHash) {
        return token != null && storedHash != null
                && MessageDigest.isEqual(hash(token).getBytes(StandardCharsets.UTF_8), storedHash.getBytes(StandardCharsets.UTF_8));
    }

    public TeamMember authenticatedResponder(String authorization) {
        String token = bearerToken(authorization);
        for (Map.Entry<String, String> entry : parse(responderTokens).entrySet()) {
            if (MessageDigest.isEqual(token.getBytes(StandardCharsets.UTF_8), entry.getValue().getBytes(StandardCharsets.UTF_8))) {
                try {
                    return members.findById(Long.valueOf(entry.getKey()))
                            .orElseThrow(() -> unauthorized("Configured responder member was not found"));
                } catch (NumberFormatException exception) {
                    throw unauthorized("Responder tracking configuration is invalid");
                }
            }
        }
        throw unauthorized("Responder tracking credentials are invalid or not configured");
    }

    /** Resolves the credential to the server-owned responder record. */
    public TeamMember authenticatedResponderIdentity(String authorization) {
        return authenticatedResponder(authorization);
    }

    public String authenticatedVehicleDevice(String authorization, String requestedDeviceId) {
        String token = bearerToken(authorization);
        for (Map.Entry<String, String> entry : parse(vehicleTokens).entrySet()) {
            if (MessageDigest.isEqual(token.getBytes(StandardCharsets.UTF_8), entry.getValue().getBytes(StandardCharsets.UTF_8))) {
                if (requestedDeviceId != null && !requestedDeviceId.isBlank() && !entry.getKey().equals(requestedDeviceId.trim())) {
                    throw unauthorized("Vehicle token is not authorized for this device");
                }
                return entry.getKey();
            }
        }
        throw unauthorized("Vehicle tracking credentials are invalid or not configured");
    }

    public Long configuredVehicleTeamId(String deviceId) {
        String value = parse(vehicleTeamIds).get(deviceId);
        if (value == null || value.isBlank()) throw unauthorized("No response team is configured for vehicle " + deviceId);
        try {
            return Long.valueOf(value);
        } catch (NumberFormatException exception) {
            throw unauthorized("Vehicle team configuration is invalid");
        }
    }

    public String configuredVehicleIdentifier(String deviceId) {
        return parse(vehicleIdentifiers).getOrDefault(deviceId, deviceId);
    }

    private String bearerToken(String authorization) {
        if (authorization == null || !authorization.startsWith("Bearer ") || authorization.substring(7).isBlank()) {
            throw unauthorized("Bearer tracking authorization is required");
        }
        return authorization.substring(7).trim();
    }

    private Map<String, String> parse(String value) {
        Map<String, String> result = new LinkedHashMap<>();
        if (value == null || value.isBlank()) return result;
        for (String entry : value.split(";")) {
            int separator = entry.indexOf('=');
            if (separator <= 0 || separator == entry.length() - 1) continue;
            result.put(entry.substring(0, separator).trim(), entry.substring(separator + 1).trim());
        }
        return result;
    }

    private ApiException unauthorized(String message) {
        return new ApiException(HttpStatus.UNAUTHORIZED, message);
    }
}
