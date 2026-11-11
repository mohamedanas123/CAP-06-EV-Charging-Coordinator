package com.example.evcharging.controller;

import com.example.evcharging.dto.ChargingSessionResponse;
import com.example.evcharging.service.ChargingSessionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sessions")
public class ChargingSessionController {

    private final ChargingSessionService sessionService;

    public ChargingSessionController(ChargingSessionService sessionService) {
        this.sessionService = sessionService;
    }

    @GetMapping("/active")
    public ResponseEntity<List<ChargingSessionResponse>> getActiveSessions() {
        return ResponseEntity.ok(sessionService.getActiveSessions());
    }

    @GetMapping("/{sessionId}")
    public ResponseEntity<ChargingSessionResponse> getSessionById(@PathVariable Long sessionId) {
        return ResponseEntity.ok(sessionService.getSessionById(sessionId));
    }

    @PostMapping("/{sessionId}/start")
    public ResponseEntity<ChargingSessionResponse> startSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(sessionService.startSession(sessionId));
    }

    @PostMapping("/{sessionId}/complete")
    public ResponseEntity<ChargingSessionResponse> completeSession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(sessionService.completeSession(sessionId));
    }

    @PostMapping("/{sessionId}/interrupt")
    public ResponseEntity<ChargingSessionResponse> interruptSession(
            @PathVariable Long sessionId,
            @RequestBody(required = false) Map<String, String> body) {
        String reason = (body != null && body.containsKey("reason")) ? body.get("reason") : "System interrupted";
        return ResponseEntity.ok(sessionService.interruptSession(sessionId, reason));
    }
}

