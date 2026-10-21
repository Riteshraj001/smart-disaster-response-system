package com.ritesh.disastermanagement.dto;

import jakarta.validation.constraints.NotBlank;

public class TeamMemberRequestDTO {
    @NotBlank(message = "Member name is required") private String name;
    private String role; private String contactInfo; private Boolean available = true;
    public String getName() { return name; } public void setName(String name) { this.name = name; }
    public String getRole() { return role; } public void setRole(String role) { this.role = role; }
    public String getContactInfo() { return contactInfo; } public void setContactInfo(String contactInfo) { this.contactInfo = contactInfo; }
    public Boolean getAvailable() { return available; } public void setAvailable(Boolean available) { this.available = available; }
}
