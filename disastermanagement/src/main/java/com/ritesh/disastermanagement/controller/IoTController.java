package com.ritesh.disastermanagement.controller;

import com.ritesh.disastermanagement.dto.SensorDataDTO;
import com.ritesh.disastermanagement.dto.SensorSettingDTO;
import com.ritesh.disastermanagement.service.IoTService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/iot")
@CrossOrigin(origins = "*")
public class IoTController {

    @Autowired
    private IoTService ioTService;

    @PostMapping({"/sensor-data", "/telemetry"})
    public ResponseEntity<Map<String, Object>> ingestSensorData(@RequestBody SensorDataDTO sensorData) {
        Map<String, Object> result = ioTService.processSensorData(sensorData);
        return ResponseEntity.ok(result);
    }

    @GetMapping("/sensors")
    public ResponseEntity<List<Map<String, Object>>> getSensors() {
        return ResponseEntity.ok(ioTService.getAllSensors());
    }

    @GetMapping("/sensors/{deviceId}")
    public ResponseEntity<Map<String, Object>> getSensorById(@PathVariable String deviceId) {
        Map<String, Object> sensor = ioTService.getSensorById(deviceId);
        if (sensor == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(sensor);
    }

    @PostMapping("/sensors")
    public ResponseEntity<Map<String, Object>> registerSensor(@RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(ioTService.registerSensorFromPayload(payload));
    }

    @PutMapping("/sensors/{deviceId}")
    public ResponseEntity<Map<String, Object>> updateSensor(@PathVariable String deviceId, @RequestBody Map<String, Object> payload) {
        return ResponseEntity.ok(ioTService.updateSensor(deviceId, payload));
    }

    @DeleteMapping("/sensors/{deviceId}")
    public ResponseEntity<Map<String, Object>> deleteSensor(@PathVariable String deviceId) {
        return ResponseEntity.ok(ioTService.deleteSensor(deviceId));
    }

    @GetMapping("/readings/{deviceId}")
    public ResponseEntity<List<Map<String, Object>>> getReadings(@PathVariable String deviceId) {
        return ResponseEntity.ok(ioTService.getReadings(deviceId));
    }

    @GetMapping("/readings/{deviceId}/history")
    public ResponseEntity<List<Map<String, Object>>> getReadingsHistory(
            @PathVariable String deviceId,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "24") int hours) {
        return ResponseEntity.ok(ioTService.getReadingsHistory(deviceId, limit, hours));
    }

    @GetMapping("/settings")
    public ResponseEntity<SensorSettingDTO> getSettings() {
        return ResponseEntity.ok(ioTService.getSettings());
    }

    @PutMapping("/settings")
    public ResponseEntity<SensorSettingDTO> updateSettings(@RequestBody SensorSettingDTO settings) {
        SensorSettingDTO updated = ioTService.updateSettings(settings);
        return ResponseEntity.ok(updated);
    }
}
