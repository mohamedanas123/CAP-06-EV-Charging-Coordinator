package com.example.evcharging.service;

import com.example.evcharging.dto.ChargerResponse;
import com.example.evcharging.entity.Charger;
import com.example.evcharging.entity.ChargingSite;
import com.example.evcharging.repository.ChargerRepository;
import com.example.evcharging.repository.ChargingSiteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class ChargerService {

    private final ChargerRepository chargerRepository;
    private final ChargingSiteRepository siteRepository;

    public ChargerService(
            ChargerRepository chargerRepository,
            ChargingSiteRepository siteRepository) {
        this.chargerRepository = chargerRepository;
        this.siteRepository = siteRepository;
    }

    // Add charger
    public ChargerResponse addCharger(Long siteId, Charger charger) {

        ChargingSite site = siteRepository.findById(siteId)
                .orElseThrow(() ->
                    new RuntimeException("Charging site not found"));

        charger.setChargingSite(site);
        charger.setStatus("AVAILABLE");

        Charger savedCharger = chargerRepository.save(charger);

        return mapToResponse(savedCharger);
    }

    // Get all chargers
    @Transactional(readOnly = true)
    public List<ChargerResponse> getAllChargers() {

        return chargerRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // Get chargers by site
    @Transactional(readOnly = true)
    public List<ChargerResponse> getChargersBySite(Long siteId) {

        if (!siteRepository.existsById(siteId)) {
            throw new RuntimeException("Charging site not found");
        }

        return chargerRepository
                .findByChargingSiteSiteId(siteId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // Get charger by ID
    @Transactional(readOnly = true)
    public ChargerResponse getChargerById(Long chargerId) {

        Charger charger = chargerRepository.findById(chargerId)
                .orElseThrow(() ->
                    new RuntimeException("Charger not found"));

        return mapToResponse(charger);
    }

    // Update charger details
    public ChargerResponse updateCharger(
            Long chargerId, Charger updatedCharger) {

        Charger charger = chargerRepository.findById(chargerId)
                .orElseThrow(() ->
                    new RuntimeException("Charger not found"));

        if ("CHARGING".equals(charger.getStatus())) {
            throw new RuntimeException(
                "Cannot update a charger while charging");
        }

        charger.setChargerName(updatedCharger.getChargerName());
        charger.setMaxPowerKw(updatedCharger.getMaxPowerKw());

        return mapToResponse(chargerRepository.save(charger));
    }

    // Change charger status
    public ChargerResponse updateChargerStatus(
            Long chargerId, String status) {

        Charger charger = chargerRepository.findById(chargerId)
                .orElseThrow(() ->
                    new RuntimeException("Charger not found"));

        if (!List.of("AVAILABLE", "FAILED").contains(status)) {
            throw new RuntimeException("Invalid charger status");
        }

        if ("CHARGING".equals(charger.getStatus())
                && "AVAILABLE".equals(status)) {
            throw new RuntimeException(
                "Cannot mark a charging charger as available");
        }

        charger.setStatus(status);

        return mapToResponse(chargerRepository.save(charger));
    }

    // Delete charger
    public void deleteCharger(Long chargerId) {

        Charger charger = chargerRepository.findById(chargerId)
                .orElseThrow(() ->
                    new RuntimeException("Charger not found"));

        if ("CHARGING".equals(charger.getStatus())) {
            throw new RuntimeException(
                "Cannot delete a charger while charging");
        }

        chargerRepository.delete(charger);
    }

    // Entity to DTO conversion
    private ChargerResponse mapToResponse(Charger charger) {

        return new ChargerResponse(
            charger.getChargerId(),
            charger.getChargerName(),
            charger.getChargingSite().getSiteId(),
            charger.getChargingSite().getSiteName(),
            charger.getMaxPowerKw(),
            charger.getStatus()
        );
    }
}

