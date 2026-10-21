package com.ritesh.disastermanagement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.Instant;

@Entity
@Table(name = "team_members")
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String name;

    private String role;
    private String contactInfo;

    @Column(nullable = false)
    private boolean available = true;

    private Double lastLatitude;
    private Double lastLongitude;
    private Double lastAccuracy;
    private Instant lastLocationAt;
    private String locationStatus = "UNAVAILABLE";

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private ResponseTeam team;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getContactInfo() { return contactInfo; }
    public void setContactInfo(String contactInfo) { this.contactInfo = contactInfo; }
    public boolean isAvailable() { return available; }
    public void setAvailable(boolean available) { this.available = available; }
    public ResponseTeam getTeam() { return team; }
    public void setTeam(ResponseTeam team) { this.team = team; }
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
