package com.ritesh.disastermanagement.dto;

import java.time.LocalDateTime;
import com.fasterxml.jackson.annotation.JsonInclude;

public class IncidentResponseDTO {

    private Long id;
    private String disasterType;
    private String location;
    private String description;
    private String severity;
    private String source;
    private String status;
    private String dispatchState;
    private LocalDateTime reportedAt;
    private LocalDateTime updatedAt;
    private String contactInfo;
    private String assignedTeam;
    private String imageUrl;
    private String deviceId;
    private Double latitude;
    private Double longitude;
    private AssignmentResponseDTO currentAssignment;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private ResponderLocationDTO responderLocation;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private String trackingToken;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Double distanceMeters;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private Long estimatedTravelSeconds;
    @JsonInclude(JsonInclude.Include.NON_NULL)
    private java.time.Instant estimatedArrivalTime;

    public IncidentResponseDTO() {
    }

    public IncidentResponseDTO(Long id, String disasterType, String location, String description,
                               String severity, String source, String status, LocalDateTime reportedAt,
                               LocalDateTime updatedAt, String contactInfo, String assignedTeam,
                               String imageUrl, String deviceId) {
        this.id = id;
        this.disasterType = disasterType;
        this.location = location;
        this.description = description;
        this.severity = severity;
        this.source = source;
        this.status = status;
        this.reportedAt = reportedAt;
        this.updatedAt = updatedAt;
        this.contactInfo = contactInfo;
        this.assignedTeam = assignedTeam;
        this.imageUrl = imageUrl;
        this.deviceId = deviceId;
    }

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

    public AssignmentResponseDTO getCurrentAssignment() { return currentAssignment; }
    public void setCurrentAssignment(AssignmentResponseDTO currentAssignment) { this.currentAssignment = currentAssignment; }
    public ResponderLocationDTO getResponderLocation() { return responderLocation; }
    public void setResponderLocation(ResponderLocationDTO responderLocation) { this.responderLocation = responderLocation; }
    public String getTrackingToken() { return trackingToken; }
    public void setTrackingToken(String trackingToken) { this.trackingToken = trackingToken; }

    public Double getDistanceMeters() { return distanceMeters; }
    public void setDistanceMeters(Double distanceMeters) { this.distanceMeters = distanceMeters; }
    public Long getEstimatedTravelSeconds() { return estimatedTravelSeconds; }
    public void setEstimatedTravelSeconds(Long estimatedTravelSeconds) { this.estimatedTravelSeconds = estimatedTravelSeconds; }
    public java.time.Instant getEstimatedArrivalTime() { return estimatedArrivalTime; }
    public void setEstimatedArrivalTime(java.time.Instant estimatedArrivalTime) { this.estimatedArrivalTime = estimatedArrivalTime; }
}
