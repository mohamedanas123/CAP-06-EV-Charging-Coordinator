package com.example.evcharging.repository;

import com.example.evcharging.entity.Telemetry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TelemetryRepository extends JpaRepository<Telemetry, Long> {
    List<Telemetry> findByChargingSessionSessionIdOrderByRecordedAtDesc(Long sessionId);
    List<Telemetry> findByChargingSessionSessionIdOrderByRecordedAtAsc(Long sessionId);
    Optional<Telemetry> findFirstByChargerChargerIdOrderByRecordedAtDesc(Long chargerId);
}

