package com.ritesh.disastermanagement.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class LocationUpdateRequestDTO {
    @NotNull @DecimalMin(value = "-90.0") @DecimalMax(value = "90.0") private Double latitude;
    @NotNull @DecimalMin(value = "-180.0") @DecimalMax(value = "180.0") private Double longitude;
    @DecimalMin(value = "0.0") private Double accuracy;
    @NotBlank private String timestamp;
    private String deviceId;

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public Double getAccuracy() { return accuracy; }
    public void setAccuracy(Double accuracy) { this.accuracy = accuracy; }
    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
}
