package com.ritesh.disastermanagement.entity;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "dispatch_offers", indexes = {
        @Index(name = "idx_dispatch_offer_incident_state", columnList = "incident_id,state"),
        @Index(name = "idx_dispatch_offer_member_state", columnList = "member_id,state")
})
public class DispatchOffer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "incident_id", nullable = false)
    private Incident incident;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "team_id", nullable = false)
    private ResponseTeam team;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "member_id", nullable = false)
    private TeamMember member;

    @Column(nullable = false)
    private String state = "OFFERED";
    @Column(nullable = false)
    private Instant offeredAt;
    @Column(nullable = false)
    private Instant expiresAt;
    private Instant respondedAt;
    private String decisionReason;
    private Double distanceMeters;
    private Long estimatedTravelSeconds;
    private Integer candidateRank;

    @PrePersist
    protected void onCreate() {
        if (offeredAt == null) offeredAt = Instant.now();
    }

    public Long getId() { return id; }
    public Incident getIncident() { return incident; }
    public void setIncident(Incident incident) { this.incident = incident; }
    public void setId(Long id) { this.id = id; }
    public ResponseTeam getTeam() { return team; }
    public void setTeam(ResponseTeam team) { this.team = team; }
    public TeamMember getMember() { return member; }
    public void setMember(TeamMember member) { this.member = member; }
    public String getState() { return state; }
    public void setState(String state) { this.state = state; }
    public Instant getOfferedAt() { return offeredAt; }
    public void setOfferedAt(Instant offeredAt) { this.offeredAt = offeredAt; }
    public Instant getExpiresAt() { return expiresAt; }
    public void setExpiresAt(Instant expiresAt) { this.expiresAt = expiresAt; }
    public Instant getRespondedAt() { return respondedAt; }
    public void setRespondedAt(Instant respondedAt) { this.respondedAt = respondedAt; }
    public String getDecisionReason() { return decisionReason; }
    public void setDecisionReason(String decisionReason) { this.decisionReason = decisionReason; }
    public Double getDistanceMeters() { return distanceMeters; }
    public void setDistanceMeters(Double distanceMeters) { this.distanceMeters = distanceMeters; }
    public Long getEstimatedTravelSeconds() { return estimatedTravelSeconds; }
    public void setEstimatedTravelSeconds(Long estimatedTravelSeconds) { this.estimatedTravelSeconds = estimatedTravelSeconds; }
    public Integer getCandidateRank() { return candidateRank; }
    public void setCandidateRank(Integer candidateRank) { this.candidateRank = candidateRank; }
}
