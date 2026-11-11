package com.example.evcharging.service;

import com.example.evcharging.entity.Charger;
import com.example.evcharging.entity.ChargingRequest;
import com.example.evcharging.entity.ChargingSession;
import com.example.evcharging.entity.ChargingSite;
import com.example.evcharging.repository.ChargerRepository;
import com.example.evcharging.repository.ChargingRequestRepository;
import com.example.evcharging.repository.ChargingSessionRepository;
import com.example.evcharging.repository.ChargingSiteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
public class ChargingSchedulerService {

    private final ChargingSiteRepository siteRepository;
    private final ChargerRepository chargerRepository;
    private final ChargingRequestRepository requestRepository;
    private final ChargingSessionRepository sessionRepository;

    public ChargingSchedulerService(
            ChargingSiteRepository siteRepository,
            ChargerRepository chargerRepository,
            ChargingRequestRepository requestRepository,
            ChargingSessionRepository sessionRepository) {

        this.siteRepository = siteRepository;
        this.chargerRepository = chargerRepository;
        this.requestRepository = requestRepository;
        this.sessionRepository = sessionRepository;
    }

    // Schedule waiting requests for a particular site
    @Transactional
    public int scheduleWaitingRequests(Long siteId) {

        // Lock the site to prevent concurrent allocations
        ChargingSite site = siteRepository.findByIdForUpdate(siteId)
                .orElseThrow(() ->
                    new RuntimeException("Charging site not found"));

        // Get requests eligible for scheduling
        List<ChargingRequest> requests =
                requestRepository.findEligibleRequests(
                    siteId, LocalDateTime.now());

        // Get available chargers
        List<Charger> chargers =
                chargerRepository
                    .findByChargingSiteSiteIdAndStatusOrderByChargerIdAsc(
                        siteId, "AVAILABLE");

        // Get current electricity demand
        BigDecimal currentDemand =
                sessionRepository.getCurrentDemandBySite(siteId);

        if (currentDemand == null) {
            currentDemand = BigDecimal.ZERO;
        }

        int assignedCount = 0;

        for (ChargingRequest request : requests) {

            if (chargers.isEmpty()) {
                break;
            }

            // Calculate remaining site capacity
            BigDecimal remainingCapacity =
                    site.getMaxCapacityKw().subtract(currentDemand);

            if (remainingCapacity.compareTo(BigDecimal.ZERO) <= 0) {
                break;
            }

            // Select an available charger
            Charger charger = chargers.get(0);

            // Allocate the lower of charger power and remaining capacity
            BigDecimal allocatedPower =
                    charger.getMaxPowerKw().min(remainingCapacity);

            // Create charging session
            ChargingSession session = new ChargingSession();

            session.setChargingRequest(request);
            session.setCharger(charger);
            session.setAllocatedPowerKw(allocatedPower);
            session.setEnergyDeliveredKwh(BigDecimal.ZERO);
            session.setStartTime(LocalDateTime.now());
            session.setStatus("ASSIGNED");

            sessionRepository.save(session);

            // Update request status
            request.setStatus("ASSIGNED");
            requestRepository.save(request);

            // Update charger status
            charger.setStatus("CHARGING");
            chargerRepository.save(charger);

            // Update local demand and available charger list
            currentDemand = currentDemand.add(allocatedPower);
            chargers.remove(0);

            assignedCount++;
        }

        return assignedCount;
    }
}

