package com.ritesh.disastermanagement.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "sensor_readings")
public class SensorReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "device_id", nullable = false)
    private String deviceId;

    @Column(name = "temperature")
    private Double temperature;

    @Column(name = "humidity")
    private Double humidity;

    @Column(name = "gas_level")
    private Integer gasLevel;

    @Column(name = "flame_detected")
    private Boolean flameDetected;

    @Column(name = "acceleration_x")
    private Double accelerationX;

    @Column(name = "acceleration_y")
    private Double accelerationY;

    @Column(name = "acceleration_z")
    private Double accelerationZ;

    @Column(name = "vibration_magnitude")
    private Double vibrationMagnitude;

    @Column(name = "source")
    private String source;

    @Column(name = "alert_reason")
    private String alertReason;

    @Column(name = "timestamp", nullable = false)
    private LocalDateTime timestamp;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }

    public Double getTemperature() { return temperature; }
    public void setTemperature(Double temperature) { this.temperature = temperature; }

    public Double getHumidity() { return humidity; }
    public void setHumidity(Double humidity) { this.humidity = humidity; }

    public Integer getGasLevel() { return gasLevel; }
    public void setGasLevel(Integer gasLevel) { this.gasLevel = gasLevel; }

    public Boolean getFlameDetected() { return flameDetected; }
    public void setFlameDetected(Boolean flameDetected) { this.flameDetected = flameDetected; }

    public Double getAccelerationX() { return accelerationX; }
    public void setAccelerationX(Double accelerationX) { this.accelerationX = accelerationX; }

    public Double getAccelerationY() { return accelerationY; }
    public void setAccelerationY(Double accelerationY) { this.accelerationY = accelerationY; }

    public Double getAccelerationZ() { return accelerationZ; }
    public void setAccelerationZ(Double accelerationZ) { this.accelerationZ = accelerationZ; }

    public Double getVibrationMagnitude() { return vibrationMagnitude; }
    public void setVibrationMagnitude(Double vibrationMagnitude) { this.vibrationMagnitude = vibrationMagnitude; }

    public String getSource() { return source; }
    public void setSource(String source) { this.source = source; }

    public String getAlertReason() { return alertReason; }
    public void setAlertReason(String alertReason) { this.alertReason = alertReason; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
