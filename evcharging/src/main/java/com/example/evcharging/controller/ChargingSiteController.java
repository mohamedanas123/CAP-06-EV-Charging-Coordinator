package com.example.evcharging.controller;

import com.example.evcharging.dto.ChargingSiteResponse;
import com.example.evcharging.entity.ChargingSite;
import com.example.evcharging.service.ChargingSchedulerService;
import com.example.evcharging.service.ChargingSiteService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sites")
public class ChargingSiteController {

    private final ChargingSiteService siteService;
    private final ChargingSchedulerService schedulerService;

    public ChargingSiteController(
            ChargingSiteService siteService,
            ChargingSchedulerService schedulerService) {
        this.siteService = siteService;
        this.schedulerService = schedulerService;
    }

    @GetMapping
    public ResponseEntity<List<ChargingSiteResponse>> getAllSites() {
        return ResponseEntity.ok(siteService.getAllSites());
    }

    @GetMapping("/{siteId}")
    public ResponseEntity<ChargingSiteResponse> getSiteById(@PathVariable Long siteId) {
        return ResponseEntity.ok(siteService.getSiteById(siteId));
    }

    @PostMapping
    public ResponseEntity<ChargingSiteResponse> createSite(@RequestBody ChargingSite site) {
        return ResponseEntity.status(HttpStatus.CREATED).body(siteService.createSite(site));
    }

    @PutMapping("/{siteId}")
    public ResponseEntity<ChargingSiteResponse> updateSite(
            @PathVariable Long siteId,
            @RequestBody ChargingSite updatedSite) {
        return ResponseEntity.ok(siteService.updateSite(siteId, updatedSite));
    }

    @DeleteMapping("/{siteId}")
    public ResponseEntity<Void> deleteSite(@PathVariable Long siteId) {
        siteService.deleteSite(siteId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{siteId}/schedule")
    public ResponseEntity<Map<String, Object>> triggerScheduler(@PathVariable Long siteId) {
        int scheduledCount = schedulerService.scheduleWaitingRequests(siteId);
        return ResponseEntity.ok(Map.of(
                "siteId", siteId,
                "scheduledSessionsCount", scheduledCount,
                "message", "Scheduling algorithm executed successfully"
        ));
    }
}

