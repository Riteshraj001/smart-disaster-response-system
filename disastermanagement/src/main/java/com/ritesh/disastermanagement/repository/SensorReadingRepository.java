package com.ritesh.disastermanagement.repository;

import com.ritesh.disastermanagement.entity.SensorReading;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {
    Optional<SensorReading> findTopByDeviceIdOrderByTimestampDesc(String deviceId);
    List<SensorReading> findByDeviceIdOrderByTimestampDesc(String deviceId);
    List<SensorReading> findTop20ByDeviceIdOrderByTimestampDesc(String deviceId);
    List<SensorReading> findByDeviceIdAndTimestampBetweenOrderByTimestampDesc(String deviceId, LocalDateTime start, LocalDateTime end, Pageable pageable);
    List<SensorReading> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end, Pageable pageable);
}
