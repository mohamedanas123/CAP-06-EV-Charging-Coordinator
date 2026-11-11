package com.example.evcharging.service;

import com.example.evcharging.dto.ChargingSessionResponse;
import com.example.evcharging.entity.Charger;
import com.example.evcharging.entity.ChargingRequest;
import com.example.evcharging.entity.ChargingSession;
import com.example.evcharging.repository.ChargerRepository;
import com.example.evcharging.repository.ChargingRequestRepository;
import com.example.evcharging.repository.ChargingSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ChargingSessionService {

    private final ChargingSessionRepository sessionRepository;
    private final ChargingRequestRepository requestRepository;
    private final ChargerRepository chargerRepository;

    public ChargingSessionService(
            ChargingSessionRepository sessionRepository,
            ChargingRequestRepository requestRepository,
            ChargerRepository chargerRepository) {

        this.sessionRepository = sessionRepository;
        this.requestRepository = requestRepository;
        this.chargerRepository = chargerRepository;
    }

    // Get all active sessions
    @Transactional(readOnly = true)
    public List<ChargingSessionResponse> getActiveSessions() {

        return sessionRepository
                .findByStatusIn(List.of("ASSIGNED", "CHARGING"))
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // Get session by ID
    @Transactional(readOnly = true)
    public ChargingSessionResponse getSessionById(Long sessionId) {

        ChargingSession session = sessionRepository.findById(sessionId)
                .orElseThrow(() ->
                    new RuntimeException("Session not found"));

        return mapToResponse(session);
    }

    // Start charging session
    public ChargingSessionResponse startSession(Long sessionId) {

        ChargingSession session = getSession(sessionId);

        if (!"ASSIGNED".equals(session.getStatus())) {
            throw new RuntimeException(
                "Only assigned sessions can be started");
        }

        session.setStatus("CHARGING");
        session.setStartTime(LocalDateTime.now());

        return mapToResponse(sessionRepository.save(session));
    }

    // Complete charging session
    public ChargingSessionResponse completeSession(Long sessionId) {

        ChargingSession session = getSession(sessionId);

        if (!"CHARGING".equals(session.getStatus())) {
            throw new RuntimeException(
                "Only charging sessions can be completed");
        }

        session.setStatus("COMPLETED");
        session.setEndTime(LocalDateTime.now());

        ChargingRequest request = session.getChargingRequest();
        request.setStatus("COMPLETED");

        Charger charger = session.getCharger();
        charger.setStatus("AVAILABLE");

        sessionRepository.save(session);
        requestRepository.save(request);
        chargerRepository.save(charger);

        return mapToResponse(session);
    }

    // Interrupt session when charger fails
    public ChargingSessionResponse interruptSession(
            Long sessionId, String failureReason) {

        ChargingSession session = getSession(sessionId);

        if (!List.of("ASSIGNED", "CHARGING")
                .contains(session.getStatus())) {
            throw new RuntimeException(
                "Session cannot be interrupted");
        }

        session.setStatus("INTERRUPTED");
        session.setEndTime(LocalDateTime.now());
        session.setFailureReason(failureReason);

        ChargingRequest request = session.getChargingRequest();

        // Preserve original joinedAt
        request.setStatus("WAITING");

        Charger charger = session.getCharger();
        charger.setStatus("FAILED");

        sessionRepository.save(session);
        requestRepository.save(request);
        chargerRepository.save(charger);

        return mapToResponse(session);
    }

    // Update energy delivered from telemetry
    public void updateEnergyDelivered(
            Long sessionId, BigDecimal energyKwh) {

        ChargingSession session = getSession(sessionId);

        if (!List.of("ASSIGNED", "CHARGING")
                .contains(session.getStatus())) {
            throw new RuntimeException(
                "Session is not active");
        }

        session.setEnergyDeliveredKwh(energyKwh);

        if (energyKwh.compareTo(
                session.getChargingRequest().getRequestedEnergyKwh()) >= 0) {
            completeSession(sessionId);
        }
    }

    // Internal session lookup
    private ChargingSession getSession(Long sessionId) {

        return sessionRepository.findById(sessionId)
                .orElseThrow(() ->
                    new RuntimeException("Session not found"));
    }

    // Convert entity to DTO
    private ChargingSessionResponse mapToResponse(
            ChargingSession session) {

        return new ChargingSessionResponse(
            session.getSessionId(),
            session.getChargingRequest().getRequestId(),
            session.getChargingRequest().getVehicle()
                    .getUser().getName(),
            session.getChargingRequest().getVehicle()
                    .getRegistrationNumber(),
            session.getChargingRequest().getChargingSite()
                    .getSiteName(),
            session.getCharger().getChargerName(),
            session.getAllocatedPowerKw(),
            session.getEnergyDeliveredKwh(),
            null, // Latest SOC will come from telemetry
            session.getStartTime(),
            session.getEndTime(),
            session.getStatus(),
            session.getFailureReason()
        );
    }
}

