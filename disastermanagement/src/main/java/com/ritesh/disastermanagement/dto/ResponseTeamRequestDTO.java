package com.ritesh.disastermanagement.dto;

import jakarta.validation.constraints.NotBlank;

public class ResponseTeamRequestDTO {
    @NotBlank(message = "Team name is required") private String name;
    private String specialization;
    private Boolean available = true;
    public String getName() { return name; } public void setName(String name) { this.name = name; }
    public String getSpecialization() { return specialization; } public void setSpecialization(String specialization) { this.specialization = specialization; }
    public Boolean getAvailable() { return available; } public void setAvailable(Boolean available) { this.available = available; }
}
