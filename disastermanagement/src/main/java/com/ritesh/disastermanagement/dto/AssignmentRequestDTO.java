package com.ritesh.disastermanagement.dto;
public class AssignmentRequestDTO {
    private Long teamId;
    private String teamName;
    private Long memberId; private String notes;
    private Long vehicleId;
    private String priorityOverrideReason;
    public Long getTeamId() { return teamId; } public void setTeamId(Long teamId) { this.teamId = teamId; }
    public String getTeamName() { return teamName; } public void setTeamName(String teamName) { this.teamName = teamName; }
    public Long getMemberId() { return memberId; } public void setMemberId(Long memberId) { this.memberId = memberId; }
    public Long getVehicleId() { return vehicleId; } public void setVehicleId(Long vehicleId) { this.vehicleId = vehicleId; }
    public String getNotes() { return notes; } public void setNotes(String notes) { this.notes = notes; }
    public String getPriorityOverrideReason() { return priorityOverrideReason; } public void setPriorityOverrideReason(String priorityOverrideReason) { this.priorityOverrideReason = priorityOverrideReason; }
}
