package com.example.evcharging.service;

import com.example.evcharging.dto.ChargingSiteResponse;
import com.example.evcharging.entity.ChargingSite;
import com.example.evcharging.repository.ChargingSiteRepository;
import com.example.evcharging.repository.ChargerRepository;
import com.example.evcharging.repository.ChargingSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@Transactional
public class ChargingSiteService {

    private final ChargingSiteRepository siteRepository;
    private final ChargerRepository chargerRepository;
    private final ChargingSessionRepository sessionRepository;

    public ChargingSiteService(
            ChargingSiteRepository siteRepository,
            ChargerRepository chargerRepository,
            ChargingSessionRepository sessionRepository) {
        this.siteRepository = siteRepository;
        this.chargerRepository = chargerRepository;
        this.sessionRepository = sessionRepository;
    }

    // Get all charging sites
    @Transactional(readOnly = true)
    public List<ChargingSiteResponse> getAllSites() {
        return siteRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // Get charging site by ID
    @Transactional(readOnly = true)
    public ChargingSiteResponse getSiteById(Long siteId) {

        ChargingSite site = siteRepository.findById(siteId)
                .orElseThrow(() ->
                    new RuntimeException("Charging site not found"));

        return mapToResponse(site);
    }

    // Create charging site
    public ChargingSiteResponse createSite(ChargingSite site) {

        ChargingSite savedSite = siteRepository.save(site);

        return mapToResponse(savedSite);
    }

    // Update charging site
    public ChargingSiteResponse updateSite(
            Long siteId, ChargingSite updatedSite) {

        ChargingSite site = siteRepository.findById(siteId)
                .orElseThrow(() ->
                    new RuntimeException("Charging site not found"));

        site.setSiteName(updatedSite.getSiteName());
        site.setLocation(updatedSite.getLocation());
        site.setMaxCapacityKw(updatedSite.getMaxCapacityKw());
        site.setWarningThresholdPercent(
            updatedSite.getWarningThresholdPercent());

        return mapToResponse(siteRepository.save(site));
    }

    // Delete charging site
    public void deleteSite(Long siteId) {

        ChargingSite site = siteRepository.findById(siteId)
                .orElseThrow(() ->
                    new RuntimeException("Charging site not found"));

        if (chargerRepository.existsByChargingSiteSiteId(siteId)) {
            throw new RuntimeException(
                "Cannot delete site because it has chargers");
        }

        siteRepository.delete(site);
    }

    // Convert entity to response DTO
    private ChargingSiteResponse mapToResponse(ChargingSite site) {

        Long siteId = site.getSiteId();

        int totalChargers =
                chargerRepository.countByChargingSiteSiteId(siteId);

        int availableChargers =
                chargerRepository.countByChargingSiteSiteIdAndStatus(
                    siteId, "AVAILABLE");

        int chargingChargers =
                chargerRepository.countByChargingSiteSiteIdAndStatus(
                    siteId, "CHARGING");

        int failedChargers =
                chargerRepository.countByChargingSiteSiteIdAndStatus(
                    siteId, "FAILED");

        BigDecimal currentDemand =
                sessionRepository.getCurrentDemandBySite(siteId);

        if (currentDemand == null) {
            currentDemand = BigDecimal.ZERO;
        }

        BigDecimal utilization = BigDecimal.ZERO;

        if (site.getMaxCapacityKw().compareTo(BigDecimal.ZERO) > 0) {
            utilization = currentDemand
                    .multiply(BigDecimal.valueOf(100))
                    .divide(site.getMaxCapacityKw(), 2,
                            RoundingMode.HALF_UP);
        }

        return new ChargingSiteResponse(
            site.getSiteId(),
            site.getSiteName(),
            site.getLocation(),
            site.getMaxCapacityKw(),
            currentDemand,
            utilization,
            site.getWarningThresholdPercent(),
            totalChargers,
            availableChargers,
            chargingChargers,
            failedChargers
        );
    }
}

