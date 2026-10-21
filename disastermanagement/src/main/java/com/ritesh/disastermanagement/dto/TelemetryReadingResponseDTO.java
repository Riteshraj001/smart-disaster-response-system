package com.ritesh.disastermanagement.dto;

import java.time.LocalDateTime;

public class TelemetryReadingResponseDTO {
    private String deviceId;
    private LocalDateTime timestamp;
    private String timestampIso;
    private Double temperature;
    private Double humidity;
    private Integer mq2Raw;
    private Boolean flameDetected;
    private Double accelerationX;
    private Double accelerationY;
    private Double accelerationZ;
    private Double gyroX;
    private Double gyroY;
    private Double gyroZ;
    private Double vibrationMagnitude;
    private String source;

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }

    public String getTimestampIso() {
        return timestampIso;
    }

    public void setTimestampIso(String timestampIso) {
        this.timestampIso = timestampIso;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getHumidity() {
        return humidity;
    }

    public void setHumidity(Double humidity) {
        this.humidity = humidity;
    }

    public Integer getMq2Raw() {
        return mq2Raw;
    }

    public void setMq2Raw(Integer mq2Raw) {
        this.mq2Raw = mq2Raw;
    }

    public Boolean getFlameDetected() {
        return flameDetected;
    }

    public void setFlameDetected(Boolean flameDetected) {
        this.flameDetected = flameDetected;
    }

    public Double getAccelerationX() {
        return accelerationX;
    }

    public void setAccelerationX(Double accelerationX) {
        this.accelerationX = accelerationX;
    }

    public Double getAccelerationY() {
        return accelerationY;
    }

    public void setAccelerationY(Double accelerationY) {
        this.accelerationY = accelerationY;
    }

    public Double getAccelerationZ() {
        return accelerationZ;
    }

    public void setAccelerationZ(Double accelerationZ) {
        this.accelerationZ = accelerationZ;
    }

    public Double getGyroX() {
        return gyroX;
    }

    public void setGyroX(Double gyroX) {
        this.gyroX = gyroX;
    }

    public Double getGyroY() {
        return gyroY;
    }

    public void setGyroY(Double gyroY) {
        this.gyroY = gyroY;
    }

    public Double getGyroZ() {
        return gyroZ;
    }

    public void setGyroZ(Double gyroZ) {
        this.gyroZ = gyroZ;
    }

    public Double getVibrationMagnitude() {
        return vibrationMagnitude;
    }

    public void setVibrationMagnitude(Double vibrationMagnitude) {
        this.vibrationMagnitude = vibrationMagnitude;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
