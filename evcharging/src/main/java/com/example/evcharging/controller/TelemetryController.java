package com.example.evcharging.controller;

import com.example.evcharging.dto.TelemetryRequest;
import com.example.evcharging.dto.TelemetryResponse;
import com.example.evcharging.service.TelemetryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/telemetry")
public class TelemetryController {

    private final TelemetryService telemetryService;

    public TelemetryController(TelemetryService telemetryService) {
        this.telemetryService = telemetryService;
    }

    @PostMapping
    public ResponseEntity<TelemetryResponse> receiveTelemetry(@Valid @RequestBody TelemetryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(telemetryService.receiveTelemetry(request));
    }

    @GetMapping("/session/{sessionId}")
    public ResponseEntity<List<TelemetryResponse>> getSessionTelemetry(@PathVariable Long sessionId) {
        return ResponseEntity.ok(telemetryService.getSessionTelemetry(sessionId));
    }

    @GetMapping("/charger/{chargerId}/latest")
    public ResponseEntity<TelemetryResponse> getLatestTelemetry(@PathVariable Long chargerId) {
        return ResponseEntity.ok(telemetryService.getLatestTelemetry(chargerId));
    }
}

