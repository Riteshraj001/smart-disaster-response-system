package com.ritesh.disastermanagement.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ritesh.disastermanagement.dto.GeocodingResultDTO;
import com.ritesh.disastermanagement.exception.ApiException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class GeocodingService {
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final HttpClient httpClient;
    private final String endpoint;
    private final String userAgent;
    private final String email;
    private final long minimumRequestIntervalMillis;
    private final long cacheTtlMillis;
    private final Map<String, CachedResult> cache = new ConcurrentHashMap<>();
    private final Object requestLock = new Object();
    private long lastRequestAtMillis;

    public GeocodingService(
            @Value("${app.geocoding.endpoint:https://nominatim.openstreetmap.org/search}") String endpoint,
            @Value("${app.geocoding.user-agent:SmartDisasterManagement/1.0 (local development)}") String userAgent,
            @Value("${app.geocoding.email:}") String email,
            @Value("${app.geocoding.minimum-request-interval-ms:1100}") long minimumRequestIntervalMillis,
            @Value("${app.geocoding.cache-ttl-seconds:86400}") long cacheTtlSeconds) {
        this.httpClient = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
        this.endpoint = endpoint.replaceAll("/+$", "");
        this.userAgent = userAgent;
        this.email = email;
        this.minimumRequestIntervalMillis = Math.max(0, minimumRequestIntervalMillis);
        this.cacheTtlMillis = Math.max(1, cacheTtlSeconds) * 1000L;
    }

    public List<GeocodingResultDTO> search(String rawQuery, int requestedLimit) {
        String query = rawQuery == null ? "" : rawQuery.trim().replaceAll("\\s+", " ");
        if (query.length() < 3) return List.of();

        int limit = Math.max(1, Math.min(5, requestedLimit));
        String cacheKey = query.toLowerCase() + "|" + limit;
        CachedResult cached = cache.get(cacheKey);
        if (cached != null && cached.expiresAtMillis > System.currentTimeMillis()) return cached.results;

        StringBuilder url = new StringBuilder(endpoint)
                .append("?format=jsonv2&addressdetails=1&limit=")
                .append(limit)
                .append("&q=")
                .append(URLEncoder.encode(query, StandardCharsets.UTF_8));
        if (!email.isBlank()) url.append("&email=").append(URLEncoder.encode(email, StandardCharsets.UTF_8));

        HttpResponse<String> response;
        synchronized (requestLock) {
            waitForProviderRateLimit();
            HttpRequest request = HttpRequest.newBuilder(URI.create(url.toString()))
                    .timeout(Duration.ofSeconds(10))
                    .header("User-Agent", userAgent)
                    .header("Accept", "application/json")
                    .header("Accept-Language", "en")
                    .GET()
                    .build();
            try {
                response = httpClient.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            } catch (IOException exception) {
                throw new ApiException(HttpStatus.BAD_GATEWAY, "The geocoding provider could not be reached");
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "The geocoding request was interrupted");
            }
            lastRequestAtMillis = System.currentTimeMillis();
        }

        if (response.statusCode() == 429) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "The geocoding provider is rate limiting requests; please refine the search and try again");
        }
        if (response.statusCode() < 200 || response.statusCode() >= 300) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "The geocoding provider returned HTTP " + response.statusCode());
        }

        List<GeocodingResultDTO> results = parseResults(response.body());
        cache.put(cacheKey, new CachedResult(results, System.currentTimeMillis() + cacheTtlMillis));
        return results;
    }

    private void waitForProviderRateLimit() {
        long remaining = minimumRequestIntervalMillis - (System.currentTimeMillis() - lastRequestAtMillis);
        if (remaining <= 0) return;
        try {
            Thread.sleep(remaining);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "The geocoding request was interrupted");
        }
    }

    private List<GeocodingResultDTO> parseResults(String body) {
        try {
            JsonNode root = objectMapper.readTree(body);
            if (!root.isArray()) return List.of();
            List<GeocodingResultDTO> results = new ArrayList<>();
            for (JsonNode node : root) {
                double latitude = node.path("lat").asDouble(Double.NaN);
                double longitude = node.path("lon").asDouble(Double.NaN);
                if (!Double.isFinite(latitude) || !Double.isFinite(longitude)
                        || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) continue;
                Long placeId = node.hasNonNull("place_id") ? node.get("place_id").asLong() : null;
                results.add(new GeocodingResultDTO(
                        placeId,
                        node.path("display_name").asText(""),
                        node.path("name").asText(""),
                        node.path("type").asText(""),
                        latitude,
                        longitude));
            }
            return List.copyOf(results);
        } catch (IOException exception) {
            throw new ApiException(HttpStatus.BAD_GATEWAY, "The geocoding provider returned invalid data");
        }
    }

    private record CachedResult(List<GeocodingResultDTO> results, long expiresAtMillis) { }
}
