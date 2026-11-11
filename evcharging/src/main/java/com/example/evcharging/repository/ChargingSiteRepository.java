package com.example.evcharging.repository;

import com.example.evcharging.entity.ChargingSite;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.Optional;

@Repository
public interface ChargingSiteRepository extends JpaRepository<ChargingSite, Long> {

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT s FROM ChargingSite s WHERE s.siteId = :siteId")
    Optional<ChargingSite> findByIdForUpdate(@Param("siteId") Long siteId);

    @Query("SELECT COALESCE(SUM(s.maxCapacityKw), 0) FROM ChargingSite s")
    BigDecimal getTotalMaxCapacity();
}

