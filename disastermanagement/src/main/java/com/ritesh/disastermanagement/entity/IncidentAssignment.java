package com.ritesh.disastermanagement.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "incident_assignments")
public class IncidentAssignment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "incident_id", nullable = false) private Incident incident;
    @ManyToOne(fetch = FetchType.LAZY, optional = false) @JoinColumn(name = "team_id", nullable = false) private ResponseTeam team;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "member_id") private TeamMember member;
    @ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "vehicle_id") private ResponseVehicle vehicle;
    @Column(nullable = false) private LocalDateTime assignedAt;
    private LocalDateTime unassignedAt;
    @Column(columnDefinition = "TEXT") private String notes;
    @Column(columnDefinition = "TEXT") private String priorityOverrideReason;
    @Column(nullable = false) private boolean active = true;
    @PrePersist protected void onCreate() { if (assignedAt == null) assignedAt = LocalDateTime.now(); }
    public Long getId() { return id; } public void setId(Long id) { this.id = id; }
    public Incident getIncident() { return incident; } public void setIncident(Incident incident) { this.incident = incident; }
    public ResponseTeam getTeam() { return team; } public void setTeam(ResponseTeam team) { this.team = team; }
    public TeamMember getMember() { return member; } public void setMember(TeamMember member) { this.member = member; }
    public ResponseVehicle getVehicle() { return vehicle; } public void setVehicle(ResponseVehicle vehicle) { this.vehicle = vehicle; }
    public LocalDateTime getAssignedAt() { return assignedAt; } public void setAssignedAt(LocalDateTime assignedAt) { this.assignedAt = assignedAt; }
    public LocalDateTime getUnassignedAt() { return unassignedAt; } public void setUnassignedAt(LocalDateTime unassignedAt) { this.unassignedAt = unassignedAt; }
    public String getNotes() { return notes; } public void setNotes(String notes) { this.notes = notes; }
    public String getPriorityOverrideReason() { return priorityOverrideReason; } public void setPriorityOverrideReason(String priorityOverrideReason) { this.priorityOverrideReason = priorityOverrideReason; }
    public boolean isActive() { return active; } public void setActive(boolean active) { this.active = active; }
}
