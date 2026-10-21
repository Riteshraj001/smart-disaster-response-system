package com.ritesh.disastermanagement;

import com.ritesh.disastermanagement.dto.TelemetryReadingRequestDTO;
import com.ritesh.disastermanagement.entity.SensorDevice;
import com.ritesh.disastermanagement.repository.SensorDeviceRepository;
import com.ritesh.disastermanagement.repository.SensorReadingRepository;
import com.ritesh.disastermanagement.service.TelemetryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.catchThrowableOfType;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class TelemetryApiIntegrationTests {

    @Autowired
    private SensorDeviceRepository sensorDeviceRepository;

    @Autowired
    private SensorReadingRepository sensorReadingRepository;

    @Autowired
    private TelemetryService telemetryService;

    @Autowired
    private MockMvc mockMvc;

    @BeforeEach
    void resetData() {
        sensorReadingRepository.deleteAll();
        sensorDeviceRepository.deleteAll();
    }

    @Test
    void shouldPersistTelemetryAndReturnLatestHistory() {
        TelemetryReadingRequestDTO request = new TelemetryReadingRequestDTO();
        request.setDeviceId("ESP32-001");
        request.setTimestamp(String.valueOf(System.currentTimeMillis()));
        request.setTemperature(29.4);
        request.setHumidity(61.5);
        request.setMq2Raw(412);
        request.setFlameDetected(false);
        request.setAccelerationX(0.12);
        request.setAccelerationY(-0.08);
        request.setAccelerationZ(0.97);
        request.setSource("ESP32");

        var response = telemetryService.ingestReadings(request);
        assertThat(response.getDeviceId()).isEqualTo("ESP32-001");
        assertThat(response.getMq2Raw()).isEqualTo(412);

        var latest = telemetryService.getLatestReadings();
        assertThat(latest).anySatisfy(device -> {
            assertThat(device.getDeviceId()).isEqualTo("ESP32-001");
            assertThat(device.getStatus()).isEqualTo("ONLINE");
            assertThat(device.getLatestReading()).isNotNull();
            assertThat(device.getLatestReading().getMq2Raw()).isEqualTo(412);
        });

        var history = telemetryService.getHistory("ESP32-001", null, null, 0, 10);
        assertThat(history.getReadings()).hasSize(1);
        assertThat(history.getReadings().getFirst().getDeviceId()).isEqualTo("ESP32-001");

        var devices = telemetryService.getDevices();
        assertThat(devices).anySatisfy(device -> {
            assertThat(device.getDeviceId()).isEqualTo("ESP32-001");
            assertThat(device.getLatestReading()).isNotNull();
            assertThat(device.getLatestReading().getMq2Raw()).isEqualTo(412);
        });
    }

    @Test
    void shouldAcceptTelemetryPostThroughRestController() throws Exception {
        String payload = """
                {
                  "deviceId": "ESP32-001",
                  "temperature": 23.2,
                  "humidity": 55.0,
                  "mq2Raw": 1659,
                  "flameDetected": false,
                  "accelerationX": 1.113,
                  "accelerationY": -0.122,
                  "accelerationZ": -10.017,
                  "source": "ESP32"
                }
                """;

        mockMvc.perform(post("/api/telemetry")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.deviceId").value("ESP32-001"))
                .andExpect(jsonPath("$.temperature").value(23.2))
                .andExpect(jsonPath("$.humidity").value(55.0))
                .andExpect(jsonPath("$.mq2Raw").value(1659))
                .andExpect(jsonPath("$.source").value("ESP32"));
    }

    @Test
    void shouldRejectInvalidTelemetryPayload() {
        TelemetryReadingRequestDTO request = new TelemetryReadingRequestDTO();
        request.setDeviceId(" ");
        request.setTemperature(120.0);
        request.setHumidity(120.0);
        request.setMq2Raw(6000);

        IllegalArgumentException ex = catchThrowableOfType(() -> telemetryService.ingestReadings(request), IllegalArgumentException.class);
        assertThat(ex).isNotNull();
        assertThat(ex.getMessage()).isEqualTo("deviceId is required");
    }

    @Test
    void shouldReportStaleDeviceStatusWhenLastSeenExceedsTimeout() {
        SensorDevice staleDevice = new SensorDevice();
        staleDevice.setDeviceId("ESP32-STALE");
        staleDevice.setDeviceName("ESP32-STALE");
        staleDevice.setLastSeen(LocalDateTime.now().minusSeconds(120));
        staleDevice.setStatus("OFFLINE");
        staleDevice.setActive(true);
        sensorDeviceRepository.save(staleDevice);

        var devices = telemetryService.getDevices();
        assertThat(devices).isNotEmpty();
        assertThat(devices).anySatisfy(device -> {
            assertThat(device.getDeviceId()).isEqualTo("ESP32-STALE");
            assertThat(device.getStatus()).isEqualTo("STALE");
        });
    }
}
