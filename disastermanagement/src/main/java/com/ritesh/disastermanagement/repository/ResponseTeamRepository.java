package com.ritesh.disastermanagement.repository;
import com.ritesh.disastermanagement.entity.ResponseTeam;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ResponseTeamRepository extends JpaRepository<ResponseTeam, Long> {
    List<ResponseTeam> findByAvailableTrueOrderByNameAsc();
    List<ResponseTeam> findAllByOrderByNameAsc();
    java.util.Optional<ResponseTeam> findByNameIgnoreCase(String name);
    boolean existsByNameIgnoreCase(String name);
}
