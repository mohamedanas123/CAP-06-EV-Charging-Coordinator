package com.example.evcharging.controller;

import com.example.evcharging.dto.ChargerResponse;
import com.example.evcharging.entity.Charger;
import com.example.evcharging.service.ChargerService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/chargers")
public class ChargerController {

    private final ChargerService chargerService;

    public ChargerController(ChargerService chargerService) {
        this.chargerService = chargerService;
    }

    @PostMapping("/site/{siteId}")
    public ResponseEntity<ChargerResponse> addCharger(
            @PathVariable Long siteId,
            @RequestBody Charger charger) {
        return ResponseEntity.status(HttpStatus.CREATED).body(chargerService.addCharger(siteId, charger));
    }

    @GetMapping
    public ResponseEntity<List<ChargerResponse>> getAllChargers() {
        return ResponseEntity.ok(chargerService.getAllChargers());
    }

    @GetMapping("/site/{siteId}")
    public ResponseEntity<List<ChargerResponse>> getChargersBySite(@PathVariable Long siteId) {
        return ResponseEntity.ok(chargerService.getChargersBySite(siteId));
    }

    @GetMapping("/{chargerId}")
    public ResponseEntity<ChargerResponse> getChargerById(@PathVariable Long chargerId) {
        return ResponseEntity.ok(chargerService.getChargerById(chargerId));
    }

    @PutMapping("/{chargerId}")
    public ResponseEntity<ChargerResponse> updateCharger(
            @PathVariable Long chargerId,
            @RequestBody Charger charger) {
        return ResponseEntity.ok(chargerService.updateCharger(chargerId, charger));
    }

    @PatchMapping("/{chargerId}/status")
    public ResponseEntity<ChargerResponse> updateChargerStatus(
            @PathVariable Long chargerId,
            @RequestBody Map<String, String> statusUpdate) {
        String status = statusUpdate.get("status");
        return ResponseEntity.ok(chargerService.updateChargerStatus(chargerId, status));
    }

    @DeleteMapping("/{chargerId}")
    public ResponseEntity<Void> deleteCharger(@PathVariable Long chargerId) {
        chargerService.deleteCharger(chargerId);
        return ResponseEntity.noContent().build();
    }
}

