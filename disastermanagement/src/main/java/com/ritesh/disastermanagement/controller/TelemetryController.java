package com.ritesh.disastermanagement.controller;

import com.ritesh.disastermanagement.dto.TelemetryDeviceStatusDTO;
import com.ritesh.disastermanagement.dto.TelemetryHistoryResponseDTO;
import com.ritesh.disastermanagement.dto.TelemetryReadingRequestDTO;
import com.ritesh.disastermanagement.dto.TelemetryReadingResponseDTO;
import com.ritesh.disastermanagement.service.TelemetryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/telemetry")
@CrossOrigin(origins = "*")
public class TelemetryController {

    private final TelemetryService telemetryService;

    public TelemetryController(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    @PostMapping
    public ResponseEntity<TelemetryReadingResponseDTO> ingestReading(
            @Valid @RequestBody TelemetryReadingRequestDTO request) {
        TelemetryReadingResponseDTO response = telemetryService.ingestReadings(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/latest")
    public ResponseEntity<List<TelemetryDeviceStatusDTO>> getLatestReadings() {
        return ResponseEntity.ok(telemetryService.getLatestReadings());
    }

    @GetMapping("/history")
    public ResponseEntity<TelemetryHistoryResponseDTO> getTelemetryHistory(
            @RequestParam(required = false) String deviceId,
            @RequestParam(required = false) String start,
            @RequestParam(required = false) String end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int limit) {
        return ResponseEntity.ok(telemetryService.getHistory(deviceId, start, end, page, limit));
    }

    @GetMapping("/devices")
    public ResponseEntity<List<TelemetryDeviceStatusDTO>> getDevices() {
        return ResponseEntity.ok(telemetryService.getDevices());
    }
}
