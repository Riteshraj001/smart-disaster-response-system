package com.ritesh.disastermanagement.dto;

public class SensorDataDTO {
    private String deviceId;
    private String deviceName;
    private String location;
    private String building;
    private String floor;
    private String room;
    private Double latitude;
    private Double longitude;
    private Double temperature;
    private Double humidity;
    private Integer gasLevel;
    private Boolean flameDetected;
    private Double accelerationX;
    private Double accelerationY;
    private Double accelerationZ;
    private Boolean buzzerActive;
    private Boolean ledActive;
    private Long timestamp;
    private String source;

    public SensorDataDTO() {
    }

    public String getDeviceId() {
        return deviceId;
    }

    public void setDeviceId(String deviceId) {
        this.deviceId = deviceId;
    }

    public String getDeviceName() {
        return deviceName;
    }

    public void setDeviceName(String deviceName) {
        this.deviceName = deviceName;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getBuilding() {
        return building;
    }

    public void setBuilding(String building) {
        this.building = building;
    }

    public String getFloor() {
        return floor;
    }

    public void setFloor(String floor) {
        this.floor = floor;
    }

    public String getRoom() {
        return room;
    }

    public void setRoom(String room) {
        this.room = room;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getHumidity() {
        return humidity;
    }

    public Double getHumidityValue() {
        return humidity;
    }

    public void setHumidity(Double humidity) {
        this.humidity = humidity;
    }

    public Integer getGasLevel() {
        return gasLevel;
    }

    public void setGasLevel(Integer gasLevel) {
        this.gasLevel = gasLevel;
    }

    public Boolean getFlameDetected() {
        return flameDetected;
    }

    public void setFlameDetected(Boolean flameDetected) {
        this.flameDetected = flameDetected;
    }

    public Double getAccelerationX() {
        return accelerationX;
    }

    public void setAccelerationX(Double accelerationX) {
        this.accelerationX = accelerationX;
    }

    public Double getAccelerationY() {
        return accelerationY;
    }

    public void setAccelerationY(Double accelerationY) {
        this.accelerationY = accelerationY;
    }

    public Double getAccelerationZ() {
        return accelerationZ;
    }

    public void setAccelerationZ(Double accelerationZ) {
        this.accelerationZ = accelerationZ;
    }

    public Boolean getBuzzerActive() {
        return buzzerActive;
    }

    public void setBuzzerActive(Boolean buzzerActive) {
        this.buzzerActive = buzzerActive;
    }

    public Boolean getLedActive() {
        return ledActive;
    }

    public void setLedActive(Boolean ledActive) {
        this.ledActive = ledActive;
    }

    public Long getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(Long timestamp) {
        this.timestamp = timestamp;
    }

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
