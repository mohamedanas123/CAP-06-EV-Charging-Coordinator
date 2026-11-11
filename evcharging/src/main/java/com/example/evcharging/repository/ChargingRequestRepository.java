package com.example.evcharging.repository;

import com.example.evcharging.entity.ChargingRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface ChargingRequestRepository extends JpaRepository<ChargingRequest, Long> {
    List<ChargingRequest> findByChargingSiteSiteIdAndStatusOrderByPriorityScoreDescJoinedAtAsc(Long siteId, String status);
    List<ChargingRequest> findByVehicleVehicleId(Long vehicleId);
    List<ChargingRequest> findByChargingSiteSiteIdOrderByJoinedAtAsc(Long siteId);
    List<ChargingRequest> findByVehicleUserUserIdOrderByJoinedAtDesc(Long userId);
    int countByStatus(String status);

    @Query("""
        SELECT r FROM ChargingRequest r
        WHERE r.chargingSite.siteId = :siteId
        AND (
            r.status = 'WAITING'
            OR (r.status = 'RESERVED'
                AND r.requestedTime <= :currentTime)
        )
        ORDER BY r.priorityScore DESC, r.joinedAt ASC
    """)
    List<ChargingRequest> findEligibleRequests(
        @Param("siteId") Long siteId,
        @Param("currentTime") LocalDateTime currentTime
    );
}

