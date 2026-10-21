package com.ritesh.disastermanagement.repository;

import com.ritesh.disastermanagement.entity.DispatchOffer;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface DispatchOfferRepository extends JpaRepository<DispatchOffer, Long> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select o from DispatchOffer o where o.id = :id")
    Optional<DispatchOffer> findByIdForUpdate(@Param("id") Long id);

    List<DispatchOffer> findByMemberIdAndStateInOrderByExpiresAtAsc(Long memberId, Collection<String> states);
    List<DispatchOffer> findByIncidentIdAndStateIn(Long incidentId, Collection<String> states);
    List<DispatchOffer> findByIncidentIdAndStateOrderByCandidateRankAsc(Long incidentId, String state);
    boolean existsByIncidentIdAndMemberIdAndStateIn(Long incidentId, Long memberId, Collection<String> states);
}
