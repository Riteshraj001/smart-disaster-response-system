package com.ritesh.disastermanagement.repository;

import com.ritesh.disastermanagement.entity.TeamMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeamIdOrderByNameAsc(Long teamId);
    List<TeamMember> findByAvailableTrueOrderByNameAsc();
}
