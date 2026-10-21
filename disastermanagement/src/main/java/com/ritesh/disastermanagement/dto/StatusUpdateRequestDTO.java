package com.ritesh.disastermanagement.dto;
import jakarta.validation.constraints.NotBlank;
public class StatusUpdateRequestDTO {
    @NotBlank(message = "Status is required") private String status;
    public String getStatus() { return status; } public void setStatus(String status) { this.status = status; }
}
