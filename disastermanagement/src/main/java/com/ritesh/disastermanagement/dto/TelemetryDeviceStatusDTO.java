package com.ritesh.disastermanagement.dto;

public class TelemetryDeviceStatusDTO {
    private String deviceId;
    private String deviceName;
    private String status;
    private String lastSeen;
    private Long lastSeenEpochMs;
    private String location;
    private TelemetryReadingResponseDTO latestReading;

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getLastSeen() {
        return lastSeen;
    }

    public void setLastSeen(String lastSeen) {
        this.lastSeen = lastSeen;
    }

    public Long getLastSeenEpochMs() {
        return lastSeenEpochMs;
    }

    public void setLastSeenEpochMs(Long lastSeenEpochMs) {
        this.lastSeenEpochMs = lastSeenEpochMs;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public TelemetryReadingResponseDTO getLatestReading() {
        return latestReading;
    }

    public void setLatestReading(TelemetryReadingResponseDTO latestReading) {
        this.latestReading = latestReading;
    }
}
