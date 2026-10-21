package com.ritesh.disastermanagement.repository;

import com.ritesh.disastermanagement.entity.IncidentAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface IncidentAssignmentRepository extends JpaRepository<IncidentAssignment, Long> {
    Optional<IncidentAssignment> findByIncidentIdAndActiveTrue(Long incidentId);
    List<IncidentAssignment> findByTeamIdAndActiveTrueOrderByAssignedAtDesc(Long teamId);
    List<IncidentAssignment> findByMemberIdAndActiveTrueOrderByAssignedAtDesc(Long memberId);
    List<IncidentAssignment> findByIncidentIdOrderByAssignedAtDesc(Long incidentId);
}
