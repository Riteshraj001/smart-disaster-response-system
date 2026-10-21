package com.ritesh.disastermanagement.service;

import com.ritesh.disastermanagement.dto.IncidentRequestDTO;
import com.ritesh.disastermanagement.dto.IncidentResponseDTO;
import com.ritesh.disastermanagement.dto.SensorDataDTO;
import com.ritesh.disastermanagement.dto.SensorSettingDTO;
import com.ritesh.disastermanagement.entity.SensorDevice;
import com.ritesh.disastermanagement.entity.SensorReading;
import com.ritesh.disastermanagement.repository.SensorDeviceRepository;
import com.ritesh.disastermanagement.repository.SensorReadingRepository;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class IoTService {

    @Autowired
    private IncidentService incidentService;

    @Autowired
    private SensorDeviceRepository sensorDeviceRepository;

    @Autowired
    private SensorReadingRepository sensorReadingRepository;

    private SensorSettingDTO settings = new SensorSettingDTO();
    private final Map<String, Long> incidentCooldownMap = new ConcurrentHashMap<>();
    private final Map<String, Map<String, Object>> latestDeviceMap = new ConcurrentHashMap<>();

    @PostConstruct
    public void initializeDefaults() {
        if (sensorDeviceRepository.count() == 0) {
            createDefaultDevices();
        }
        normalizeSettings(settings);
    }

    private void createDefaultDevices() {
        registerDeviceState("ESP32-NODE-01", "ESP32-NODE-01", "Academic Block A", "2", "Lab 2B", "ESP32 DevKit V1 Multi-Sensor Unit",
                12.84432, 80.15202, 24.5, 48.0, 110, false, 0.05, 0.02, 1.01);
        registerDeviceState("ESP32-NODE-02", "ESP32-NODE-02", "Science Block", "3", "Chemistry Wing", "ESP32 DevKit V1 Multi-Sensor Unit",
                12.84510, 80.15410, 23.8, 52.0, 135, false, 0.03, 0.04, 0.99);
        registerDeviceState("ESP32-NODE-03", "ESP32-NODE-03", "Library", "1", "Server Room", "ESP32 DevKit V1 Multi-Sensor Unit",
                12.84290, 80.15120, 21.2, 42.0, 85, false, 0.01, 0.01, 1.00);
    }

    private void normalizeSettings(SensorSettingDTO incoming) {
        if (incoming == null) {
            incoming = new SensorSettingDTO();
        }
        if (incoming.getFlameAlertEnabled() == null) {
            incoming.setFlameAlertEnabled(incoming.getFlameDetectionEnabled());
        }
        if (incoming.getFlameDetectionEnabled() == null) {
            incoming.setFlameDetectionEnabled(incoming.getFlameAlertEnabled());
        }
        if (incoming.getAlertCooldownSeconds() == null) {
            incoming.setAlertCooldownSeconds(incoming.getCooldownSeconds());
        }
        if (incoming.getCooldownSeconds() == null) {
            incoming.setCooldownSeconds(incoming.getAlertCooldownSeconds());
        }
        if (incoming.getOfflineTimeoutSeconds() == null) {
            incoming.setOfflineTimeoutSeconds(45);
        }
        this.settings = incoming;
    }

    private SensorDevice upsertDevice(String deviceId, String deviceName, String building, String floor, String room,
                                      String deviceType, Double latitude, Double longitude) {
        SensorDevice device = sensorDeviceRepository.findByDeviceId(deviceId).orElseGet(() -> {
            SensorDevice created = new SensorDevice();
            created.setDeviceId(deviceId);
            return created;
        });
        if (deviceName != null && !deviceName.isBlank()) device.setDeviceName(deviceName);
        if (deviceType != null && !deviceType.isBlank()) device.setDeviceType(deviceType);
        if (building != null && !building.isBlank()) device.setBuilding(building);
        if (floor != null && !floor.isBlank()) device.setFloor(floor);
        if (room != null && !room.isBlank()) device.setRoom(room);
        if (latitude != null) device.setLatitude(latitude);
        if (longitude != null) device.setLongitude(longitude);
        device.setStatus("ONLINE");
        device.setActive(true);
        device.setLastSeen(LocalDateTime.now());
        return sensorDeviceRepository.save(device);
    }

    private void registerDeviceState(String deviceId, String deviceName, String building, String floor, String room, String deviceType,
                                     double latitude, double longitude, double temp, double humidity, int gas, boolean flame,
                                     double ax, double ay, double az) {
        SensorDevice device = upsertDevice(deviceId, deviceName, building, floor, room, deviceType, latitude, longitude);
        SensorReading reading = new SensorReading();
        reading.setDeviceId(deviceId);
        reading.setTemperature(temp);
        reading.setHumidity(humidity);
        reading.setGasLevel(gas);
        reading.setFlameDetected(flame);
        reading.setAccelerationX(ax);
        reading.setAccelerationY(ay);
        reading.setAccelerationZ(az);
        reading.setVibrationMagnitude(calculateVibrationMagnitude(ax, ay, az));
        reading.setSource("SYSTEM");
        reading.setTimestamp(LocalDateTime.now());
        sensorReadingRepository.save(reading);

        Map<String, Object> node = new LinkedHashMap<>();
        node.put("deviceId", device.getDeviceId());
        node.put("deviceName", device.getDeviceName() != null ? device.getDeviceName() : device.getDeviceId());
        node.put("deviceType", device.getDeviceType() != null ? device.getDeviceType() : "ESP32 DevKit V1 Multi-Sensor Unit");
        node.put("building", device.getBuilding() != null ? device.getBuilding() : "Unassigned");
        node.put("floor", device.getFloor() != null ? device.getFloor() : "N/A");
        node.put("room", device.getRoom() != null ? device.getRoom() : "N/A");
        node.put("location", buildLocation(device));
        node.put("latitude", device.getLatitude());
        node.put("longitude", device.getLongitude());
        node.put("status", isDeviceOnline(device) ? "ONLINE" : "OFFLINE");
        node.put("lastSeen", device.getLastSeen() == null ? "Never" : device.getLastSeen().toString());
        node.put("lastSeenTimestamp", device.getLastSeen() == null ? 0L : device.getLastSeen().toInstant(ZoneOffset.UTC).toEpochMilli());
        node.put("sensors", buildSensorSummary(temp, humidity, gas, flame, ax, ay, az));
        latestDeviceMap.put(deviceId, node);
    }

    private void registerDeviceState(String deviceId, String deviceName, String building, String floor, String room, String deviceType,
                                     double temp, double humidity, int gas, boolean flame, double ax, double ay, double az) {
        registerDeviceState(deviceId, deviceName, building, floor, room, deviceType, 0.0, 0.0, temp, humidity, gas, flame, ax, ay, az);
    }

    private boolean isDeviceOnline(SensorDevice device) {
        if (device == null || device.getLastSeen() == null) {
            return false;
        }
        long secondsSinceSeen = Duration.between(device.getLastSeen(), LocalDateTime.now()).getSeconds();
        return secondsSinceSeen <= settings.getOfflineTimeoutSeconds();
    }

    private String buildLocation(SensorDevice device) {
        if (device == null) return "Monitored Zone";
        StringBuilder builder = new StringBuilder();
        if (device.getBuilding() != null && !device.getBuilding().isBlank()) builder.append(device.getBuilding());
        if (device.getFloor() != null && !device.getFloor().isBlank()) {
            if (!builder.isEmpty()) builder.append(" - ");
            builder.append("Floor ").append(device.getFloor());
        }
        if (device.getRoom() != null && !device.getRoom().isBlank()) {
            if (!builder.isEmpty()) builder.append(" - ");
            builder.append(device.getRoom());
        }
        return builder.length() > 0 ? builder.toString() : "Monitored Zone";
    }

    private List<Map<String, Object>> buildSensorSummary(double temp, double humidity, int gas, boolean flame,
                                                          double ax, double ay, double az) {
        List<Map<String, Object>> sensors = new ArrayList<>();
        double vibMag = calculateVibrationMagnitude(ax, ay, az);
        sensors.add(sensorSummary("Flame Sensor (IR)", "Optical Flame", flame ? "FLAME DETECTED" : "NORMAL (No Flame)", "Flame Detected", flame ? "ALERT" : "NORMAL"));
        sensors.add(sensorSummary("MQ-2 Sensor", "Gas & Smoke", gas + " ADC", settings.getGasThreshold() + " ADC", gas > settings.getGasThreshold() ? "ALERT" : "NORMAL"));
        sensors.add(sensorSummary("DHT11 Sensor", "Temperature & Humidity", String.format("%.1f°C / %.1f%% RH", temp, humidity), settings.getTemperatureThreshold() + "°C", temp > settings.getTemperatureThreshold() ? "ALERT" : "NORMAL"));
        sensors.add(sensorSummary("MPU6050 Sensor", "Accelerometer / Vibration", String.format("%.2fg", vibMag), String.format("%.1fg", settings.getVibrationThreshold()), vibMag > settings.getVibrationThreshold() ? "ALERT" : "NORMAL"));
        return sensors;
    }

    private double calculateVibrationMagnitude(double ax, double ay, double az) {
        return Math.sqrt((ax * ax) + (ay * ay) + (az * az));
    }

    private Map<String, Object> sensorSummary(String name, String type, String currentReading, String threshold, String status) {
        Map<String, Object> sensor = new LinkedHashMap<>();
        sensor.put("name", name);
        sensor.put("type", type);
        sensor.put("currentReading", currentReading);
        sensor.put("threshold", threshold);
        sensor.put("status", status);
        return sensor;
    }

    public List<Map<String, Object>> getAllSensors() {
        List<SensorDevice> devices = sensorDeviceRepository.findAllByOrderByLastSeenDesc();
        if (devices.isEmpty()) {
            createDefaultDevices();
            devices = sensorDeviceRepository.findAllByOrderByLastSeenDesc();
        }
        return devices.stream().map(this::toSensorMap).toList();
    }

    public Map<String, Object> getSensorById(String deviceId) {
        SensorDevice device = sensorDeviceRepository.findByDeviceId(deviceId).orElse(null);
        return device == null ? null : toSensorMap(device);
    }

    public List<Map<String, Object>> getReadings(String deviceId) {
        List<SensorReading> readings = sensorReadingRepository.findTop20ByDeviceIdOrderByTimestampDesc(deviceId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (SensorReading reading : readings) {
            result.add(readingToMap(reading));
        }
        return result;
    }

    public List<Map<String, Object>> getReadingsHistory(String deviceId, int limit, int hours) {
        List<Map<String, Object>> result = new ArrayList<>();
        if (deviceId == null || deviceId.isBlank()) {
            return result;
        }
        LocalDateTime cutoff = LocalDateTime.now().minusHours(hours);
        List<SensorReading> readings = sensorReadingRepository.findByDeviceIdOrderByTimestampDesc(deviceId);
        for (SensorReading reading : readings) {
            if (reading.getTimestamp() != null && reading.getTimestamp().isAfter(cutoff)) {
                result.add(readingToMap(reading));
            }
            if (result.size() >= Math.max(limit, 1)) {
                break;
            }
        }
        return result;
    }

    public SensorSettingDTO getSettings() {
        normalizeSettings(this.settings);
        return this.settings;
    }

    public SensorSettingDTO updateSettings(SensorSettingDTO newSettings) {
        if (newSettings != null) {
            normalizeSettings(newSettings);
        }
        return this.settings;
    }

    public Map<String, Object> registerSensorFromPayload(Map<String, Object> payload) {
        Map<String, Object> result = new HashMap<>();
        String deviceId = payload == null ? "" : String.valueOf(payload.getOrDefault("deviceId", payload.getOrDefault("deviceID", ""))).trim();
        if (deviceId.isBlank()) {
            result.put("success", false);
            result.put("message", "Device ID is required");
            return result;
        }
        String deviceName = payload.get("deviceName") == null ? deviceId : String.valueOf(payload.get("deviceName"));
        String building = payload.get("building") == null ? "" : String.valueOf(payload.get("building"));
        String floor = payload.get("floor") == null ? "" : String.valueOf(payload.get("floor"));
        String room = payload.get("room") == null ? "" : String.valueOf(payload.get("room"));
        String deviceType = payload.get("deviceType") == null ? "ESP32 DevKit V1 Multi-Sensor Unit" : String.valueOf(payload.get("deviceType"));
        Double latitude = payload.get("latitude") == null ? null : Double.valueOf(String.valueOf(payload.get("latitude")));
        Double longitude = payload.get("longitude") == null ? null : Double.valueOf(String.valueOf(payload.get("longitude")));
        SensorDevice device = upsertDevice(deviceId, deviceName, building, floor, room, deviceType, latitude, longitude);
        result.put("success", true);
        result.put("device", toSensorMap(device));
        result.put("message", "Device registered successfully");
        return result;
    }

    public Map<String, Object> updateSensor(String deviceId, Map<String, Object> payload) {
        SensorDevice device = sensorDeviceRepository.findByDeviceId(deviceId).orElse(null);
        if (device == null) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Device not found");
            return response;
        }
        if (payload != null) {
            if (payload.get("deviceName") != null) device.setDeviceName(String.valueOf(payload.get("deviceName")));
            if (payload.get("building") != null) device.setBuilding(String.valueOf(payload.get("building")));
            if (payload.get("floor") != null) device.setFloor(String.valueOf(payload.get("floor")));
            if (payload.get("room") != null) device.setRoom(String.valueOf(payload.get("room")));
            if (payload.get("deviceType") != null) device.setDeviceType(String.valueOf(payload.get("deviceType")));
            if (payload.get("latitude") != null) device.setLatitude(Double.valueOf(String.valueOf(payload.get("latitude"))));
            if (payload.get("longitude") != null) device.setLongitude(Double.valueOf(String.valueOf(payload.get("longitude"))));
            if (payload.get("active") != null) device.setActive(Boolean.valueOf(String.valueOf(payload.get("active"))));
        }
        device.setLastSeen(LocalDateTime.now());
        sensorDeviceRepository.save(device);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("device", toSensorMap(device));
        response.put("message", "Device updated successfully");
        return response;
    }

    public Map<String, Object> deleteSensor(String deviceId) {
        Map<String, Object> response = new HashMap<>();
        Optional<SensorDevice> device = sensorDeviceRepository.findByDeviceId(deviceId);
        if (device.isEmpty()) {
            response.put("success", false);
            response.put("message", "Device not found");
            return response;
        }
        sensorDeviceRepository.delete(device.get());
        response.put("success", true);
        response.put("deviceId", deviceId);
        response.put("message", "Device removed");
        return response;
    }

    public Map<String, Object> processSensorData(SensorDataDTO data) {
        Map<String, Object> response = new HashMap<>();
        if (data == null || data.getDeviceId() == null) {
            response.put("success", false);
            response.put("message", "Invalid sensor telemetry payload");
            return response;
        }

        String deviceId = data.getDeviceId();
        String deviceName = data.getDeviceName() != null ? data.getDeviceName() : deviceId;
        String building = data.getBuilding() != null ? data.getBuilding() : "Monitored Zone";
        String floor = data.getFloor() != null ? data.getFloor() : "N/A";
        String room = data.getRoom() != null ? data.getRoom() : "N/A";
        String location = data.getLocation() != null ? data.getLocation() : String.format("%s - %s", building, room);
        double temp = data.getTemperature() != null ? data.getTemperature() : 25.0;
        double hum = data.getHumidity() != null ? data.getHumidity() : 50.0;
        int gas = data.getGasLevel() != null ? data.getGasLevel() : 100;
        boolean flame = Boolean.TRUE.equals(data.getFlameDetected());
        double ax = data.getAccelerationX() != null ? data.getAccelerationX() : 0.0;
        double ay = data.getAccelerationY() != null ? data.getAccelerationY() : 0.0;
        double az = data.getAccelerationZ() != null ? data.getAccelerationZ() : 1.0;
        double vibMag = calculateVibrationMagnitude(ax, ay, az);

        SensorDevice device = upsertDevice(deviceId, deviceName, building, floor, room,
                "ESP32 DevKit V1 Multi-Sensor Unit", data.getLatitude(), data.getLongitude());
        SensorReading reading = new SensorReading();
        reading.setDeviceId(deviceId);
        reading.setTemperature(temp);
        reading.setHumidity(hum);
        reading.setGasLevel(gas);
        reading.setFlameDetected(flame);
        reading.setAccelerationX(ax);
        reading.setAccelerationY(ay);
        reading.setAccelerationZ(az);
        reading.setVibrationMagnitude(vibMag);
        reading.setSource(data.getSource() != null ? data.getSource() : "ESP32");
        reading.setTimestamp(LocalDateTime.now());
        sensorReadingRepository.save(reading);

        // ESP32 firmware already raises incidents when local thresholds trip.
        // The backend now persists telemetry without creating duplicate incidents for every packet.
        List<IncidentResponseDTO> generatedIncidents = new ArrayList<>();
        boolean triggerAlarm = false;

        response.put("success", true);
        response.put("deviceId", deviceId);
        response.put("alarmTriggered", false);
        response.put("buzzerState", false);
        response.put("ledState", false);
        response.put("incidentsCreated", 0);
        response.put("incidents", generatedIncidents);
        response.put("reading", readingToMap(reading));
        response.put("message", "Telemetry processed normally. Incident creation is handled by the ESP32 or explicit incident APIs.");
        return response;
    }

    private Map<String, Object> toSensorMap(SensorDevice device) {
        Map<String, Object> node = new LinkedHashMap<>();
        SensorReading latest = sensorReadingRepository.findTopByDeviceIdOrderByTimestampDesc(device.getDeviceId()).orElse(null);
        node.put("deviceId", device.getDeviceId());
        node.put("deviceName", device.getDeviceName() != null ? device.getDeviceName() : device.getDeviceId());
        node.put("deviceType", device.getDeviceType() != null ? device.getDeviceType() : "ESP32 DevKit V1 Multi-Sensor Unit");
        node.put("building", device.getBuilding() != null ? device.getBuilding() : "Unassigned");
        node.put("floor", device.getFloor() != null ? device.getFloor() : "N/A");
        node.put("room", device.getRoom() != null ? device.getRoom() : "N/A");
        node.put("location", buildLocation(device));
        node.put("latitude", device.getLatitude());
        node.put("longitude", device.getLongitude());
        node.put("status", isDeviceOnline(device) ? "ONLINE" : "OFFLINE");
        node.put("lastSeen", device.getLastSeen() == null ? "Never" : device.getLastSeen().toString());
        node.put("lastSeenTimestamp", device.getLastSeen() == null ? 0L : device.getLastSeen().toInstant(ZoneOffset.UTC).toEpochMilli());
        node.put("supportedSensorTypes", device.getSupportedSensorTypes() == null ? "Flame, MQ-2, DHT11, MPU6050" : device.getSupportedSensorTypes());
        node.put("active", device.getActive() == null || device.getActive());
        node.put("sensors", buildLatestSensors(latest));
        latestDeviceMap.put(device.getDeviceId(), node);
        return node;
    }

    private List<Map<String, Object>> buildLatestSensors(SensorReading latest) {
        List<Map<String, Object>> sensors = new ArrayList<>();
        sensors.add(sensorSummary("Flame Sensor (IR)", "Optical Flame",
                latest != null && Boolean.TRUE.equals(latest.getFlameDetected()) ? "FLAME DETECTED" : "NORMAL (No Flame)",
                "Flame Detected", latest != null && Boolean.TRUE.equals(latest.getFlameDetected()) ? "ALERT" : "NORMAL"));
        sensors.add(sensorSummary("MQ-2 Sensor", "Gas & Smoke",
                latest != null && latest.getGasLevel() != null ? latest.getGasLevel() + " ADC" : "0 ADC",
                settings.getGasThreshold() + " ADC",
                latest != null && latest.getGasLevel() != null && latest.getGasLevel() > settings.getGasThreshold() ? "ALERT" : "NORMAL"));
        sensors.add(sensorSummary("DHT11 Sensor", "Temperature & Humidity",
                latest != null ? String.format("%.1f°C / %.1f%% RH", latest.getTemperature() != null ? latest.getTemperature() : 25.0,
                        latest.getHumidity() != null ? latest.getHumidity() : 50.0) : "25.0°C / 50.0% RH",
                settings.getTemperatureThreshold() + "°C",
                latest != null && latest.getTemperature() != null && latest.getTemperature() > settings.getTemperatureThreshold() ? "ALERT" : "NORMAL"));
        sensors.add(sensorSummary("MPU6050 Sensor", "Accelerometer / Vibration",
                latest != null && latest.getVibrationMagnitude() != null ? String.format("%.2fg", latest.getVibrationMagnitude()) : "0.00g",
                String.format("%.1fg", settings.getVibrationThreshold()),
                latest != null && latest.getVibrationMagnitude() != null && latest.getVibrationMagnitude() > settings.getVibrationThreshold() ? "ALERT" : "NORMAL"));
        return sensors;
    }

    private Map<String, Object> readingToMap(SensorReading reading) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("deviceId", reading.getDeviceId());
        row.put("temperature", reading.getTemperature());
        row.put("humidity", reading.getHumidity());
        row.put("gasLevel", reading.getGasLevel());
        row.put("flameDetected", reading.getFlameDetected());
        row.put("accelerationX", reading.getAccelerationX());
        row.put("accelerationY", reading.getAccelerationY());
        row.put("accelerationZ", reading.getAccelerationZ());
        row.put("vibrationMagnitude", reading.getVibrationMagnitude());
        row.put("source", reading.getSource());
        row.put("alertReason", reading.getAlertReason());
        row.put("timestamp", reading.getTimestamp() == null ? null : reading.getTimestamp().toString());
        return row;
    }
}
