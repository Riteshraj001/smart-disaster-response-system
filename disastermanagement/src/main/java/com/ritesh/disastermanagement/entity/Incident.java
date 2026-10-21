package com.ritesh.disastermanagement.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

@Entity
@Table(name = "incidents")
public class Incident {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank
    @Column(nullable = false)
    private String disasterType;

    @NotBlank
    @Column(nullable = false)
    private String location;

    @Column(columnDefinition = "TEXT")
    private String description;

    private String severity = "MEDIUM";

    private String source = "CITIZEN";

    @NotBlank
    @Column(nullable = false)
    private String status = "PENDING_VERIFICATION";

    @Column(name = "dispatch_state")
    private String dispatchState = "WAITING_FOR_VERIFICATION";

    private LocalDateTime reportedAt;

    private LocalDateTime updatedAt;

    private String contactInfo;

    private String assignedTeam;

    @Column(columnDefinition = "TEXT")
    private String imageUrl;

    private String deviceId;

    private Double latitude;

    private Double longitude;

    @Column(name = "tracking_token_hash", length = 64)
    private String trackingTokenHash;

    public Incident() {
    }

    @PrePersist
    protected void onCreate() {
        if (this.reportedAt == null) {
            this.reportedAt = LocalDateTime.now();
        }
        this.updatedAt = LocalDateTime.now();
        if (this.status == null || this.status.isBlank()) {
            this.status = "PENDING_VERIFICATION";
        }
        if (this.dispatchState == null || this.dispatchState.isBlank()) {
            this.dispatchState = "WAITING_FOR_VERIFICATION";
        }
        if (this.source == null || this.source.isBlank()) {
            this.source = "CITIZEN";
        }
        if (this.severity == null || this.severity.isBlank()) {
            this.severity = "MEDIUM";
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getDisasterType() {
        return disasterType;
    }

    public void setDisasterType(String disasterType) {
        this.disasterType = disasterType;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getSeverity() {
        return severity;
    }

    public void setSeverity(String severity) {
        this.severity = severity;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getDispatchState() { return dispatchState; }
    public void setDispatchState(String dispatchState) { this.dispatchState = dispatchState; }

    public LocalDateTime getReportedAt() {
        return reportedAt;
    }

    public void setReportedAt(LocalDateTime reportedAt) {
        this.reportedAt = reportedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public String getContactInfo() {
        return contactInfo;
    }

    public void setContactInfo(String contactInfo) {
        this.contactInfo = contactInfo;
    }

    public String getAssignedTeam() {
        return assignedTeam;
    }

    public void setAssignedTeam(String assignedTeam) {
        this.assignedTeam = assignedTeam;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }
    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }
    public String getTrackingTokenHash() { return trackingTokenHash; }
    public void setTrackingTokenHash(String trackingTokenHash) { this.trackingTokenHash = trackingTokenHash; }
}
