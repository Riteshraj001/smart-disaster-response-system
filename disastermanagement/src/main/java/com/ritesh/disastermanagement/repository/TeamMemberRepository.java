package com.ritesh.disastermanagement.repository;
import com.ritesh.disastermanagement.entity.TeamMember;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface TeamMemberRepository extends JpaRepository<TeamMember, Long> {
    List<TeamMember> findByTeamIdOrderByNameAsc(Long teamId);
    List<TeamMember> findByAvailableTrueOrderByNameAsc();
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select m from TeamMember m where m.id = :id")
    Optional<TeamMember> findByIdForUpdate(@Param("id") Long id);
}
