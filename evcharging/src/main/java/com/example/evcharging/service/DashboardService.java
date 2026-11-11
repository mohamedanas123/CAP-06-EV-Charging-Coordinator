package com.example.evcharging.service;

import com.example.evcharging.dto.AlertResponse;
import com.example.evcharging.dto.DashboardSummaryResponse;
import com.example.evcharging.entity.ChargingSite;
import com.example.evcharging.repository.ChargerRepository;
import com.example.evcharging.repository.ChargingRequestRepository;
import com.example.evcharging.repository.ChargingSessionRepository;
import com.example.evcharging.repository.ChargingSiteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class DashboardService {

    private final ChargerRepository chargerRepository;
    private final ChargingRequestRepository requestRepository;
    private final ChargingSessionRepository sessionRepository;
    private final ChargingSiteRepository siteRepository;

    public DashboardService(
            ChargerRepository chargerRepository,
            ChargingRequestRepository requestRepository,
            ChargingSessionRepository sessionRepository,
            ChargingSiteRepository siteRepository) {
        this.chargerRepository = chargerRepository;
        this.requestRepository = requestRepository;
        this.sessionRepository = sessionRepository;
        this.siteRepository = siteRepository;
    }

    public DashboardSummaryResponse getSummary() {
        int totalChargers = (int) chargerRepository.count();
        int availableChargers = chargerRepository.countByStatus("AVAILABLE");
        int chargingChargers = chargerRepository.countByStatus("CHARGING");
        int failedChargers = chargerRepository.countByStatus("FAILED");

        int waitingRequests = requestRepository.countByStatus("WAITING");
        int activeSessions = sessionRepository.countByStatusIn(List.of("ASSIGNED", "CHARGING"));
        int completedSessions = sessionRepository.countByStatus("COMPLETED");
        int interruptedSessions = sessionRepository.countByStatus("INTERRUPTED");

        BigDecimal totalEnergyDelivered = sessionRepository.getTotalEnergyDelivered();
        if (totalEnergyDelivered == null) {
            totalEnergyDelivered = BigDecimal.ZERO;
        }

        BigDecimal currentDemand = sessionRepository.getTotalCurrentDemand();
        if (currentDemand == null) {
            currentDemand = BigDecimal.ZERO;
        }

        BigDecimal maxCapacity = siteRepository.getTotalMaxCapacity();
        if (maxCapacity == null) {
            maxCapacity = BigDecimal.ZERO;
        }

        BigDecimal capacityUtilizationPercent = BigDecimal.ZERO;
        if (maxCapacity.compareTo(BigDecimal.ZERO) > 0) {
            capacityUtilizationPercent = currentDemand
                    .multiply(BigDecimal.valueOf(100))
                    .divide(maxCapacity, 2, RoundingMode.HALF_UP);
        }

        BigDecimal avgWaitingTime = BigDecimal.valueOf(15.0); // Default estimate in minutes

        return new DashboardSummaryResponse(
                totalChargers,
                availableChargers,
                chargingChargers,
                failedChargers,
                waitingRequests,
                activeSessions,
                completedSessions,
                interruptedSessions,
                totalEnergyDelivered,
                currentDemand,
                maxCapacity,
                capacityUtilizationPercent,
                avgWaitingTime
        );
    }

    public List<AlertResponse> getAlerts() {
        List<AlertResponse> alerts = new ArrayList<>();
        List<ChargingSite> sites = siteRepository.findAll();

        for (ChargingSite site : sites) {
            BigDecimal currentDemand = sessionRepository.getCurrentDemandBySite(site.getSiteId());
            if (currentDemand == null) currentDemand = BigDecimal.ZERO;

            if (site.getMaxCapacityKw().compareTo(BigDecimal.ZERO) > 0) {
                BigDecimal utilization = currentDemand
                        .multiply(BigDecimal.valueOf(100))
                        .divide(site.getMaxCapacityKw(), 2, RoundingMode.HALF_UP);

                if (utilization.compareTo(site.getWarningThresholdPercent()) >= 0) {
                    alerts.add(new AlertResponse(
                            "CAPACITY_WARNING",
                            "Site " + site.getSiteName() + " has reached " + utilization + "% capacity utilization.",
                            "HIGH",
                            site.getSiteId(),
                            null,
                            LocalDateTime.now()
                    ));
                }
            }
        }
        return alerts;
    }
}

