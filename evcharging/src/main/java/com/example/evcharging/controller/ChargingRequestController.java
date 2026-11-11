package com.example.evcharging.controller;

import com.example.evcharging.dto.ChargingRequestDto;
import com.example.evcharging.dto.QueueResponse;
import com.example.evcharging.service.ChargingRequestService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/requests")
public class ChargingRequestController {

    private final ChargingRequestService requestService;

    public ChargingRequestController(ChargingRequestService requestService) {
        this.requestService = requestService;
    }

    @PostMapping
    public ResponseEntity<QueueResponse> createRequest(@Valid @RequestBody ChargingRequestDto requestDto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(requestService.createRequest(requestDto));
    }

    @GetMapping
    public ResponseEntity<List<QueueResponse>> getAllRequests() {
        return ResponseEntity.ok(requestService.getAllRequests());
    }

    @GetMapping("/site/{siteId}")
    public ResponseEntity<List<QueueResponse>> getRequestsBySite(@PathVariable Long siteId) {
        return ResponseEntity.ok(requestService.getRequestsBySite(siteId));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<QueueResponse>> getRequestsByUser(@PathVariable Long userId) {
        return ResponseEntity.ok(requestService.getRequestsByUser(userId));
    }

    @PatchMapping("/{requestId}/cancel")
    public ResponseEntity<Void> cancelRequest(@PathVariable Long requestId) {
        requestService.cancelRequest(requestId);
        return ResponseEntity.noContent().build();
    }
}

