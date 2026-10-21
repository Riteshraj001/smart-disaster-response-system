package com.ritesh.disastermanagement.dto;

import com.fasterxml.jackson.annotation.JsonAlias;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public class TelemetryReadingRequestDTO {

    @NotBlank(message = "deviceId is required")
    private String deviceId;

    private String timestamp;

    @DecimalMin(value = "-100.0", message = "temperature must be between -100 and 100")
    @DecimalMax(value = "100.0", message = "temperature must be between -100 and 100")
    private Double temperature;

    @DecimalMin(value = "0.0", message = "humidity must be between 0 and 100")
    @DecimalMax(value = "100.0", message = "humidity must be between 0 and 100")
    private Double humidity;

    @JsonAlias({"mq2", "mq2RawValue", "gasLevel", "gasLevelRaw"})
    @Min(value = 0, message = "mq2Raw must be >= 0")
    @Max(value = 4095, message = "mq2Raw must be <= 4095")
    private Integer mq2Raw;

    @JsonAlias({"flame", "flameState"})
    private Boolean flameDetected;

    @DecimalMin(value = "-20.0", message = "accelerationX must be between -20 and 20")
    @DecimalMax(value = "20.0", message = "accelerationX must be between -20 and 20")
    private Double accelerationX;

    @DecimalMin(value = "-20.0", message = "accelerationY must be between -20 and 20")
    @DecimalMax(value = "20.0", message = "accelerationY must be between -20 and 20")
    private Double accelerationY;

    @DecimalMin(value = "-20.0", message = "accelerationZ must be between -20 and 20")
    @DecimalMax(value = "20.0", message = "accelerationZ must be between -20 and 20")
    private Double accelerationZ;

    private Double gyroX;
    private Double gyroY;
    private Double gyroZ;

    private String source;

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(String timestamp) {
        this.timestamp = timestamp;
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

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
