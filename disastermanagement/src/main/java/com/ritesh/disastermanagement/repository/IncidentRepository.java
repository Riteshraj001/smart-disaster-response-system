package com.ritesh.disastermanagement.repository;

import com.ritesh.disastermanagement.entity.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface IncidentRepository extends JpaRepository<Incident, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select i from Incident i where i.id = :id")
    java.util.Optional<Incident> findByIdForUpdate(@Param("id") Long id);
    List<Incident> findByStatus(String status);
    List<Incident> findBySource(String source);
    List<Incident> findByDisasterType(String disasterType);
    List<Incident> findByDeviceId(String deviceId);
    List<Incident> findAllByOrderByReportedAtDesc();
}
