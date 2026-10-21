package com.ritesh.disastermanagement.repository;

import com.ritesh.disastermanagement.entity.ResponseVehicle;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface ResponseVehicleRepository extends JpaRepository<ResponseVehicle, Long> {
    Optional<ResponseVehicle> findByDeviceId(String deviceId);
}
