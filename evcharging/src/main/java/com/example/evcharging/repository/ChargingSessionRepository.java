package com.example.evcharging.repository;

import com.example.evcharging.entity.ChargingSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ChargingSessionRepository extends JpaRepository<ChargingSession, Long> {
    Optional<ChargingSession> findByChargerChargerIdAndStatus(Long chargerId, String status);
    List<ChargingSession> findByStatus(String status);
    List<ChargingSession> findByStatusIn(List<String> statuses);
    int countByStatus(String status);
    int countByStatusIn(List<String> statuses);

    @Query("SELECT COALESCE(SUM(cs.allocatedPowerKw), 0) FROM ChargingSession cs WHERE cs.charger.chargingSite.siteId = :siteId AND cs.status = 'ACTIVE'")
    BigDecimal getCurrentDemandBySite(@Param("siteId") Long siteId);

    @Query("SELECT COALESCE(SUM(cs.allocatedPowerKw), 0) FROM ChargingSession cs WHERE cs.status IN ('ASSIGNED', 'CHARGING')")
    BigDecimal getTotalCurrentDemand();

    @Query("SELECT COALESCE(SUM(cs.energyDeliveredKwh), 0) FROM ChargingSession cs")
    BigDecimal getTotalEnergyDelivered();
}

