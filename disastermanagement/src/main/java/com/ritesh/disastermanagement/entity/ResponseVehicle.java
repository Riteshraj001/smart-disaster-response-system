package com.ritesh.disastermanagement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

@Entity
@Table(name = "response_vehicles", indexes = {
        @Index(name = "idx_response_vehicle_device", columnList = "device_id"),
        @Index(name = "idx_response_vehicle_team", columnList = "team_id")
})
public class ResponseVehicle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(name = "vehicle_identifier", nullable = false, unique = true)
    private String vehicleIdentifier;

    @NotBlank
    @Column(name = "device_id", nullable = false, unique = true)
    private String deviceId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private ResponseTeam team;

    @Column(nullable = false)
    private boolean active = true;

    private Double lastLatitude;
    private Double lastLongitude;
    private Double lastAccuracy;
    private Instant lastLocationAt;
    private String locationStatus = "UNAVAILABLE";

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getVehicleIdentifier() { return vehicleIdentifier; }
    public void setVehicleIdentifier(String vehicleIdentifier) { this.vehicleIdentifier = vehicleIdentifier; }
    public String getDeviceId() { return deviceId; }
    public void setDeviceId(String deviceId) { this.deviceId = deviceId; }
    public ResponseTeam getTeam() { return team; }
    public void setTeam(ResponseTeam team) { this.team = team; }
    public boolean isActive() { return active; }
    public void setActive(boolean active) { this.active = active; }
    public Double getLastLatitude() { return lastLatitude; }
    public void setLastLatitude(Double lastLatitude) { this.lastLatitude = lastLatitude; }
    public Double getLastLongitude() { return lastLongitude; }
    public void setLastLongitude(Double lastLongitude) { this.lastLongitude = lastLongitude; }
    public Double getLastAccuracy() { return lastAccuracy; }
    public void setLastAccuracy(Double lastAccuracy) { this.lastAccuracy = lastAccuracy; }
    public Instant getLastLocationAt() { return lastLocationAt; }
    public void setLastLocationAt(Instant lastLocationAt) { this.lastLocationAt = lastLocationAt; }
    public String getLocationStatus() { return locationStatus; }
    public void setLocationStatus(String locationStatus) { this.locationStatus = locationStatus; }
}
