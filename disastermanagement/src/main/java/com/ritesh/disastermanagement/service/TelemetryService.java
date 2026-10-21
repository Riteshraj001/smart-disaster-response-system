package com.ritesh.disastermanagement.service;

import com.ritesh.disastermanagement.dto.TelemetryDeviceStatusDTO;
import com.ritesh.disastermanagement.dto.TelemetryHistoryResponseDTO;
import com.ritesh.disastermanagement.dto.TelemetryReadingRequestDTO;
import com.ritesh.disastermanagement.dto.TelemetryReadingResponseDTO;
import com.ritesh.disastermanagement.entity.SensorDevice;
import com.ritesh.disastermanagement.entity.SensorReading;
import com.ritesh.disastermanagement.repository.SensorDeviceRepository;
import com.ritesh.disastermanagement.repository.SensorReadingRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

@Service
public class TelemetryService {

    private final SensorDeviceRepository sensorDeviceRepository;
    private final SensorReadingRepository sensorReadingRepository;

    @Value("${app.iot.online-timeout-seconds:60}")
    private long onlineTimeoutSeconds;

    @Value("${app.iot.offline-timeout-seconds:180}")
    private long offlineTimeoutSeconds;

    public TelemetryService(SensorDeviceRepository sensorDeviceRepository,
                           SensorReadingRepository sensorReadingRepository) {
        this.sensorDeviceRepository = sensorDeviceRepository;
        this.sensorReadingRepository = sensorReadingRepository;
    }

    public TelemetryReadingResponseDTO ingestReadings(TelemetryReadingRequestDTO request) {
        if (request == null || request.getDeviceId() == null || request.getDeviceId().isBlank()) {
            throw new IllegalArgumentException("deviceId is required");
        }

        validateRequest(request);

        String deviceId = request.getDeviceId().trim();
        LocalDateTime readingTime = parseTimestamp(request.getTimestamp());
        if (readingTime == null) {
            readingTime = LocalDateTime.now();
        }

        SensorDevice device = sensorDeviceRepository.findByDeviceId(deviceId)
                .orElseGet(() -> {
                    SensorDevice created = new SensorDevice();
                    created.setDeviceId(deviceId);
                    created.setActive(true);
                    created.setStatus("OFFLINE");
                    return created;
                });

        device.setDeviceName(device.getDeviceName() != null ? device.getDeviceName() : deviceId);
        device.setDeviceType(device.getDeviceType() != null ? device.getDeviceType() : "ESP32");
        device.setActive(true);
        device.setLastSeen(readingTime);
        device.setStatus(resolveStatus(readingTime));
        if (device.getSupportedSensorTypes() == null || device.getSupportedSensorTypes().isBlank()) {
            device.setSupportedSensorTypes("TEMPERATURE,HUMIDITY,MQ2,FLAME,MPU6050");
        }
        sensorDeviceRepository.save(device);

        SensorReading reading = new SensorReading();
        reading.setDeviceId(deviceId);
        reading.setTemperature(request.getTemperature());
        reading.setHumidity(request.getHumidity());
        reading.setGasLevel(request.getMq2Raw());
        reading.setFlameDetected(Boolean.TRUE.equals(request.getFlameDetected()));
        reading.setAccelerationX(request.getAccelerationX());
        reading.setAccelerationY(request.getAccelerationY());
        reading.setAccelerationZ(request.getAccelerationZ());
        reading.setVibrationMagnitude(calculateMagnitude(request.getAccelerationX(), request.getAccelerationY(), request.getAccelerationZ()));
        reading.setSource(request.getSource() != null && !request.getSource().isBlank() ? request.getSource() : "ESP32");
        reading.setTimestamp(readingTime);
        sensorReadingRepository.save(reading);

        return toResponse(reading);
    }

    public List<TelemetryDeviceStatusDTO> getLatestReadings() {
        Set<String> deviceIds = new HashSet<>();
        sensorDeviceRepository.findAll().forEach(device -> deviceIds.add(device.getDeviceId()));
        sensorReadingRepository.findAll().forEach(reading -> deviceIds.add(reading.getDeviceId()));

        List<TelemetryDeviceStatusDTO> devices = new ArrayList<>();
        for (String deviceId : deviceIds) {
            SensorDevice device = sensorDeviceRepository.findByDeviceId(deviceId).orElse(null);
            if (device == null) {
                continue;
            }
            SensorReading latest = sensorReadingRepository.findTopByDeviceIdOrderByTimestampDesc(deviceId).orElse(null);
            devices.add(buildDeviceStatus(device, latest));
        }

        devices.sort((left, right) -> {
            Long leftTs = left.getLastSeenEpochMs() == null ? 0L : left.getLastSeenEpochMs();
            Long rightTs = right.getLastSeenEpochMs() == null ? 0L : right.getLastSeenEpochMs();
            return rightTs.compareTo(leftTs);
        });
        return devices;
    }

    public TelemetryHistoryResponseDTO getHistory(String deviceId, String start, String end, int page, int limit) {
        int safeLimit = Math.max(1, Math.min(limit > 0 ? limit : 50, 200));
        int safePage = Math.max(0, page);

        LocalDateTime startTime = parseDateTime(start, false);
        LocalDateTime endTime = parseDateTime(end, true);

        List<SensorReading> filteredReadings = new ArrayList<>();
        if (deviceId != null && !deviceId.isBlank()) {
            filteredReadings.addAll(sensorReadingRepository.findByDeviceIdOrderByTimestampDesc(deviceId));
        } else {
            filteredReadings.addAll(sensorReadingRepository.findAll());
        }

        List<SensorReading> inRange = filteredReadings.stream()
                .filter(reading -> reading.getTimestamp() != null)
                .filter(reading -> (startTime == null || !reading.getTimestamp().isBefore(startTime)))
                .filter(reading -> (endTime == null || !reading.getTimestamp().isAfter(endTime)))
                .sorted((left, right) -> right.getTimestamp().compareTo(left.getTimestamp()))
                .toList();

        int totalElements = inRange.size();
        int totalPages = totalElements == 0 ? 0 : (int) Math.ceil((double) totalElements / safeLimit);
        int fromIndex = Math.min(safePage * safeLimit, totalElements);
        int toIndex = Math.min(fromIndex + safeLimit, totalElements);

        List<TelemetryReadingResponseDTO> pageItems = inRange.subList(fromIndex, toIndex).stream()
                .map(this::toResponse)
                .toList();

        TelemetryHistoryResponseDTO response = new TelemetryHistoryResponseDTO();
        response.setReadings(pageItems);
        response.setPage(safePage);
        response.setLimit(safeLimit);
        response.setTotalElements(totalElements);
        response.setTotalPages(totalPages);
        return response;
    }

    public List<TelemetryDeviceStatusDTO> getDevices() {
        List<SensorDevice> devices = sensorDeviceRepository.findAllByOrderByLastSeenDesc();
        List<TelemetryDeviceStatusDTO> result = new ArrayList<>();
        for (SensorDevice device : devices) {
            SensorReading latest = sensorReadingRepository.findTopByDeviceIdOrderByTimestampDesc(device.getDeviceId()).orElse(null);
            result.add(buildDeviceStatus(device, latest));
        }
        return result;
    }

    public String resolveStatus(LocalDateTime lastSeen) {
        return resolveStatus(lastSeen, onlineTimeoutSeconds, offlineTimeoutSeconds);
    }

    public static String resolveStatus(LocalDateTime lastSeen, long onlineTimeoutSeconds, long offlineTimeoutSeconds) {
        if (lastSeen == null) {
            return "OFFLINE";
        }
        long secondsSinceLastSeen = Duration.between(lastSeen, LocalDateTime.now()).getSeconds();
        if (secondsSinceLastSeen <= onlineTimeoutSeconds) {
            return "ONLINE";
        }
        if (secondsSinceLastSeen <= offlineTimeoutSeconds) {
            return "STALE";
        }
        return "OFFLINE";
    }

    private void validateRequest(TelemetryReadingRequestDTO request) {
        if (request.getTemperature() != null && (request.getTemperature() < -100.0 || request.getTemperature() > 100.0)) {
            throw new IllegalArgumentException("temperature must be between -100 and 100");
        }
        if (request.getHumidity() != null && (request.getHumidity() < 0.0 || request.getHumidity() > 100.0)) {
            throw new IllegalArgumentException("humidity must be between 0 and 100");
        }
        if (request.getMq2Raw() != null && (request.getMq2Raw() < 0 || request.getMq2Raw() > 4095)) {
            throw new IllegalArgumentException("mq2Raw must be between 0 and 4095");
        }
        if (request.getAccelerationX() != null && (request.getAccelerationX() < -20.0 || request.getAccelerationX() > 20.0)) {
            throw new IllegalArgumentException("accelerationX must be between -20 and 20");
        }
        if (request.getAccelerationY() != null && (request.getAccelerationY() < -20.0 || request.getAccelerationY() > 20.0)) {
            throw new IllegalArgumentException("accelerationY must be between -20 and 20");
        }
        if (request.getAccelerationZ() != null && (request.getAccelerationZ() < -20.0 || request.getAccelerationZ() > 20.0)) {
            throw new IllegalArgumentException("accelerationZ must be between -20 and 20");
        }
    }

    private TelemetryDeviceStatusDTO buildDeviceStatus(SensorDevice device, SensorReading latest) {
        TelemetryDeviceStatusDTO dto = new TelemetryDeviceStatusDTO();
        dto.setDeviceId(device.getDeviceId());
        dto.setDeviceName(device.getDeviceName() != null ? device.getDeviceName() : device.getDeviceId());
        dto.setStatus(resolveStatus(device.getLastSeen(), onlineTimeoutSeconds, offlineTimeoutSeconds));
        dto.setLastSeen(device.getLastSeen() == null ? null : device.getLastSeen().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        dto.setLastSeenEpochMs(device.getLastSeen() == null ? null : device.getLastSeen().atZone(ZoneOffset.UTC).toInstant().toEpochMilli());
        dto.setLocation(buildLocation(device));
        dto.setLatestReading(latest == null ? null : toResponse(latest));
        return dto;
    }

    private String buildLocation(SensorDevice device) {
        if (device == null) {
            return "Unassigned";
        }
        StringBuilder builder = new StringBuilder();
        if (device.getBuilding() != null && !device.getBuilding().isBlank()) {
            builder.append(device.getBuilding());
        }
        if (device.getFloor() != null && !device.getFloor().isBlank()) {
            if (!builder.isEmpty()) {
                builder.append(" - ");
            }
            builder.append("Floor ").append(device.getFloor());
        }
        if (device.getRoom() != null && !device.getRoom().isBlank()) {
            if (!builder.isEmpty()) {
                builder.append(" - ");
            }
            builder.append(device.getRoom());
        }
        return builder.length() > 0 ? builder.toString() : "Unassigned";
    }

    private TelemetryReadingResponseDTO toResponse(SensorReading reading) {
        TelemetryReadingResponseDTO response = new TelemetryReadingResponseDTO();
        response.setDeviceId(reading.getDeviceId());
        response.setTimestamp(reading.getTimestamp());
        response.setTimestampIso(reading.getTimestamp() == null ? null : reading.getTimestamp().format(DateTimeFormatter.ISO_LOCAL_DATE_TIME));
        response.setTemperature(reading.getTemperature());
        response.setHumidity(reading.getHumidity());
        response.setMq2Raw(reading.getGasLevel());
        response.setFlameDetected(reading.getFlameDetected());
        response.setAccelerationX(reading.getAccelerationX());
        response.setAccelerationY(reading.getAccelerationY());
        response.setAccelerationZ(reading.getAccelerationZ());
        response.setVibrationMagnitude(reading.getVibrationMagnitude());
        response.setSource(reading.getSource());
        return response;
    }

    private double calculateMagnitude(Double ax, Double ay, Double az) {
        double x = ax == null ? 0.0 : ax;
        double y = ay == null ? 0.0 : ay;
        double z = az == null ? 0.0 : az;
        return Math.sqrt((x * x) + (y * y) + (z * z));
    }

    private LocalDateTime parseTimestamp(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        String trimmed = value.trim();
        try {
            if (trimmed.matches("\\d+")) {
                long epochMillis = Long.parseLong(trimmed);
                return Instant.ofEpochMilli(epochMillis).atZone(ZoneId.systemDefault()).toLocalDateTime();
            }
            if (trimmed.contains("T") || trimmed.contains(" ")) {
                try {
                    return LocalDateTime.parse(trimmed, DateTimeFormatter.ISO_DATE_TIME);
                } catch (DateTimeParseException ignored) {
                    try {
                        return Instant.parse(trimmed).atZone(ZoneId.systemDefault()).toLocalDateTime();
                    } catch (DateTimeParseException ignoredAgain) {
                        return LocalDateTime.parse(trimmed, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
                    }
                }
            }
        } catch (Exception ignored) {
            return null;
        }

        return null;
    }

    private LocalDateTime parseDateTime(String value, boolean endOfRange) {
        if (value == null || value.isBlank()) {
            return endOfRange ? LocalDateTime.now() : LocalDateTime.now().minusDays(1);
        }

        LocalDateTime parsed = parseTimestamp(value);
        if (parsed != null) {
            return parsed;
        }

        try {
            return Instant.parse(value).atZone(ZoneId.systemDefault()).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            return endOfRange ? LocalDateTime.now() : LocalDateTime.now().minusDays(1);
        }
    }
}
