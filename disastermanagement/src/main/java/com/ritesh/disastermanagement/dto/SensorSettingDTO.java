package com.ritesh.disastermanagement.dto;

public class SensorSettingDTO {
    private Integer gasThreshold = 400;
    private Integer temperatureThreshold = 40;
    private Double vibrationThreshold = 1.5;
    private Boolean flameAlertEnabled = true;
    private Boolean flameDetectionEnabled = true;
    private Integer telemetryIntervalSeconds = 5;
    private Integer alertCooldownSeconds = 60;
    private Integer cooldownSeconds = 60;
    private Integer offlineTimeoutSeconds = 45;
    private Boolean autoDispatchHighSeverity = false;

    public SensorSettingDTO() {
    }

    public Integer getGasThreshold() {
        return gasThreshold;
    }

    public void setGasThreshold(Integer gasThreshold) {
        this.gasThreshold = gasThreshold;
    }

    public Integer getTemperatureThreshold() {
        return temperatureThreshold;
    }

    public void setTemperatureThreshold(Integer temperatureThreshold) {
        this.temperatureThreshold = temperatureThreshold;
    }

    public Double getVibrationThreshold() {
        return vibrationThreshold;
    }

    public void setVibrationThreshold(Double vibrationThreshold) {
        this.vibrationThreshold = vibrationThreshold;
    }

    public Boolean getFlameAlertEnabled() {
        return flameAlertEnabled != null ? flameAlertEnabled : flameDetectionEnabled;
    }

    public void setFlameAlertEnabled(Boolean flameAlertEnabled) {
        this.flameAlertEnabled = flameAlertEnabled;
        if (flameAlertEnabled != null) {
            this.flameDetectionEnabled = flameAlertEnabled;
        }
    }

    public Boolean getFlameDetectionEnabled() {
        return flameDetectionEnabled != null ? flameDetectionEnabled : flameAlertEnabled;
    }

    public void setFlameDetectionEnabled(Boolean flameDetectionEnabled) {
        this.flameDetectionEnabled = flameDetectionEnabled;
        if (flameDetectionEnabled != null) {
            this.flameAlertEnabled = flameDetectionEnabled;
        }
    }

    public Integer getTelemetryIntervalSeconds() {
        return telemetryIntervalSeconds;
    }

    public void setTelemetryIntervalSeconds(Integer telemetryIntervalSeconds) {
        this.telemetryIntervalSeconds = telemetryIntervalSeconds;
    }

    public Integer getAlertCooldownSeconds() {
        return alertCooldownSeconds != null ? alertCooldownSeconds : cooldownSeconds;
    }

    public void setAlertCooldownSeconds(Integer alertCooldownSeconds) {
        this.alertCooldownSeconds = alertCooldownSeconds;
        if (alertCooldownSeconds != null) {
            this.cooldownSeconds = alertCooldownSeconds;
        }
    }

    public Integer getCooldownSeconds() {
        return cooldownSeconds != null ? cooldownSeconds : alertCooldownSeconds;
    }

    public void setCooldownSeconds(Integer cooldownSeconds) {
        this.cooldownSeconds = cooldownSeconds;
        if (cooldownSeconds != null) {
            this.alertCooldownSeconds = cooldownSeconds;
        }
    }

    public Integer getOfflineTimeoutSeconds() {
        return offlineTimeoutSeconds == null ? 45 : offlineTimeoutSeconds;
    }

    public void setOfflineTimeoutSeconds(Integer offlineTimeoutSeconds) {
        this.offlineTimeoutSeconds = offlineTimeoutSeconds;
    }

    public Boolean getAutoDispatchHighSeverity() {
        return autoDispatchHighSeverity;
    }

    public void setAutoDispatchHighSeverity(Boolean autoDispatchHighSeverity) {
        this.autoDispatchHighSeverity = autoDispatchHighSeverity;
    }
}
