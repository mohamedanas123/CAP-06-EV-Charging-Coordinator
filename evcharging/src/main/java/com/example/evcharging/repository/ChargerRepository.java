package com.example.evcharging.repository;

import com.example.evcharging.entity.Charger;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChargerRepository extends JpaRepository<Charger, Long> {
    List<Charger> findByChargingSiteSiteId(Long siteId);
    List<Charger> findByChargingSiteSiteIdAndStatus(Long siteId, String status);
    boolean existsByChargingSiteSiteId(Long siteId);
    int countByChargingSiteSiteId(Long siteId);
    int countByChargingSiteSiteIdAndStatus(Long siteId, String status);
    List<Charger> findByChargingSiteSiteIdAndStatusOrderByChargerIdAsc(Long siteId, String status);
    int countByStatus(String status);
}

