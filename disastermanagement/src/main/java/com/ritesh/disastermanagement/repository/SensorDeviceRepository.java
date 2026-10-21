package com.ritesh.disastermanagement.repository;

import com.ritesh.disastermanagement.entity.SensorDevice;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SensorDeviceRepository extends JpaRepository<SensorDevice, Long> {
    Optional<SensorDevice> findByDeviceId(String deviceId);
    List<SensorDevice> findAllByOrderByLastSeenDesc();
    boolean existsByDeviceId(String deviceId);
}
