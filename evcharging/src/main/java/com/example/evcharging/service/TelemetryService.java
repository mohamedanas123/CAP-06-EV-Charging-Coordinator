package com.example.evcharging.service;

import com.example.evcharging.dto.TelemetryRequest;
import com.example.evcharging.dto.TelemetryResponse;
import com.example.evcharging.entity.Charger;
import com.example.evcharging.entity.ChargingSession;
import com.example.evcharging.entity.Telemetry;
import com.example.evcharging.repository.ChargerRepository;
import com.example.evcharging.repository.ChargingSessionRepository;
import com.example.evcharging.repository.TelemetryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@Transactional
public class TelemetryService {

    private final TelemetryRepository telemetryRepository;
    private final ChargerRepository chargerRepository;
    private final ChargingSessionRepository sessionRepository;
    private final ChargingSessionService sessionService;

    public TelemetryService(
            TelemetryRepository telemetryRepository,
            ChargerRepository chargerRepository,
            ChargingSessionRepository sessionRepository,
            ChargingSessionService sessionService) {

        this.telemetryRepository = telemetryRepository;
        this.chargerRepository = chargerRepository;
        this.sessionRepository = sessionRepository;
        this.sessionService = sessionService;
    }

    // Receive telemetry from Python simulator
    public TelemetryResponse receiveTelemetry(
            TelemetryRequest request) {

        Charger charger = chargerRepository.findById(
                request.chargerId())
                .orElseThrow(() ->
                    new RuntimeException("Charger not found"));

        ChargingSession session = sessionRepository.findById(
                request.sessionId())
                .orElseThrow(() ->
                    new RuntimeException("Session not found"));

        // Validate charger and session relationship
        if (!session.getCharger().getChargerId()
                .equals(charger.getChargerId())) {
            throw new RuntimeException(
                "Charger does not belong to this session");
        }

        // Validate active session
        if (!List.of("ASSIGNED", "CHARGING")
                .contains(session.getStatus())) {
            throw new RuntimeException(
                "Session is not active");
        }

        // Validate telemetry values
        if (request.powerConsumptionKw()
                .compareTo(BigDecimal.ZERO) < 0
                || request.energyKwh()
                .compareTo(BigDecimal.ZERO) < 0
                || request.temperatureCelsius()
                .compareTo(BigDecimal.ZERO) < 0
                || request.socPercent()
                .compareTo(BigDecimal.ZERO) < 0
                || request.socPercent()
                .compareTo(BigDecimal.valueOf(100)) > 0) {
            throw new RuntimeException(
                "Invalid telemetry values");
        }

        // Validate cumulative energy does not decrease
        if (request.energyKwh().compareTo(
                session.getEnergyDeliveredKwh()) < 0) {
            throw new RuntimeException(
                "Energy reading cannot decrease");
        }

        // Create telemetry record
        Telemetry telemetry = new Telemetry();

        telemetry.setCharger(charger);
        telemetry.setChargingSession(session);
        telemetry.setPowerConsumptionKw(
            request.powerConsumptionKw());
        telemetry.setEnergyKwh(request.energyKwh());
        telemetry.setSocPercent(request.socPercent());
        telemetry.setTemperatureCelsius(
            request.temperatureCelsius());
        telemetry.setRecordedAt(request.recordedAt());

        Telemetry savedTelemetry =
                telemetryRepository.save(telemetry);

        // Start session when first reading arrives
        if ("ASSIGNED".equals(session.getStatus())) {
            sessionService.startSession(session.getSessionId());
        }

        // Update charging progress
        sessionService.updateEnergyDelivered(
            session.getSessionId(),
            request.energyKwh()
        );

        return mapToResponse(savedTelemetry);
    }

    // Get telemetry by session
    @Transactional(readOnly = true)
    public List<TelemetryResponse> getSessionTelemetry(
            Long sessionId) {

        return telemetryRepository
                .findByChargingSessionSessionIdOrderByRecordedAtAsc(
                    sessionId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // Get latest telemetry for charger
    @Transactional(readOnly = true)
    public TelemetryResponse getLatestTelemetry(Long chargerId) {

        Telemetry telemetry = telemetryRepository
                .findFirstByChargerChargerIdOrderByRecordedAtDesc(
                    chargerId)
                .orElseThrow(() ->
                    new RuntimeException(
                        "Telemetry not found"));

        return mapToResponse(telemetry);
    }

    // Entity to DTO conversion
    private TelemetryResponse mapToResponse(
            Telemetry telemetry) {

        return new TelemetryResponse(
            telemetry.getTelemetryId(),
            telemetry.getCharger().getChargerId(),
            telemetry.getChargingSession().getSessionId(),
            telemetry.getPowerConsumptionKw(),
            telemetry.getEnergyKwh(),
            telemetry.getSocPercent(),
            telemetry.getTemperatureCelsius(),
            telemetry.getRecordedAt()
        );
    }
}

