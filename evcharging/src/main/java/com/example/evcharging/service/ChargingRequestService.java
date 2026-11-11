package com.example.evcharging.service;

import com.example.evcharging.dto.ChargingRequestDto;
import com.example.evcharging.dto.QueueResponse;
import com.example.evcharging.entity.ChargingRequest;
import com.example.evcharging.entity.ChargingSite;
import com.example.evcharging.entity.Vehicle;
import com.example.evcharging.repository.ChargingRequestRepository;
import com.example.evcharging.repository.ChargingSiteRepository;
import com.example.evcharging.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;

@Service
@Transactional
public class ChargingRequestService {

    private final ChargingRequestRepository requestRepository;
    private final VehicleRepository vehicleRepository;
    private final ChargingSiteRepository siteRepository;

    public ChargingRequestService(
            ChargingRequestRepository requestRepository,
            VehicleRepository vehicleRepository,
            ChargingSiteRepository siteRepository) {
        this.requestRepository = requestRepository;
        this.vehicleRepository = vehicleRepository;
        this.siteRepository = siteRepository;
    }

    // Join queue or create reservation
    public QueueResponse createRequest(
            ChargingRequestDto request) {

        Vehicle vehicle = vehicleRepository.findById(
                request.vehicleId())
                .orElseThrow(() ->
                    new RuntimeException("Vehicle not found"));

        ChargingSite site = siteRepository.findById(
                request.siteId())
                .orElseThrow(() ->
                    new RuntimeException("Charging site not found"));

        if (request.requestedEnergyKwh().compareTo(
                BigDecimal.ZERO) <= 0) {
            throw new RuntimeException(
                "Requested energy must be greater than zero");
        }

        if (request.requestedEnergyKwh().compareTo(
                vehicle.getBatteryCapacityKwh()) > 0) {
            throw new RuntimeException(
                "Requested energy exceeds battery capacity");
        }

        ChargingRequest chargingRequest = new ChargingRequest();

        chargingRequest.setVehicle(vehicle);
        chargingRequest.setChargingSite(site);
        chargingRequest.setRequestedEnergyKwh(
            request.requestedEnergyKwh());
        chargingRequest.setRequestedTime(
            request.requestedTime());

        chargingRequest.setJoinedAt(LocalDateTime.now());

        // Reservation or normal queue
        chargingRequest.setStatus(
            request.requestedTime() != null
                ? "RESERVED"
                : "WAITING"
        );

        chargingRequest.setPriorityScore(BigDecimal.ZERO);

        ChargingRequest saved =
                requestRepository.save(chargingRequest);

        return mapToQueueResponse(saved);
    }

    // Get all requests
    @Transactional(readOnly = true)
    public List<QueueResponse> getAllRequests() {

        return requestRepository.findAll()
                .stream()
                .map(this::mapToQueueResponse)
                .toList();
    }

    // Get requests by site
    @Transactional(readOnly = true)
    public List<QueueResponse> getRequestsBySite(Long siteId) {

        if (!siteRepository.existsById(siteId)) {
            throw new RuntimeException("Charging site not found");
        }

        return requestRepository
                .findByChargingSiteSiteIdOrderByJoinedAtAsc(siteId)
                .stream()
                .map(this::mapToQueueResponse)
                .toList();
    }

    // Get requests by user
    @Transactional(readOnly = true)
    public List<QueueResponse> getRequestsByUser(Long userId) {

        return requestRepository
                .findByVehicleUserUserIdOrderByJoinedAtDesc(userId)
                .stream()
                .map(this::mapToQueueResponse)
                .toList();
    }

    // Cancel request
    public void cancelRequest(Long requestId) {

        ChargingRequest request = requestRepository.findById(requestId)
                .orElseThrow(() ->
                    new RuntimeException("Request not found"));

        if (!List.of("WAITING", "RESERVED").contains(
                request.getStatus())) {
            throw new RuntimeException(
                "Only waiting or reserved requests can be cancelled");
        }

        request.setStatus("CANCELLED");

        requestRepository.save(request);
    }

    // Convert entity to response DTO
    private QueueResponse mapToQueueResponse(
            ChargingRequest request) {

        LocalDateTime now = LocalDateTime.now();

        long waitingTime = Duration.between(
                request.getJoinedAt(), now).toMinutes();

        List<ChargingRequest> waitingRequests =
                requestRepository
                    .findByChargingSiteSiteIdAndStatusOrderByPriorityScoreDescJoinedAtAsc(
                        request.getChargingSite().getSiteId(),
                        "WAITING"
                    );

        int queuePosition = 0;

        if ("WAITING".equals(request.getStatus())) {
            for (int i = 0; i < waitingRequests.size(); i++) {
                if (waitingRequests.get(i).getRequestId()
                        .equals(request.getRequestId())) {
                    queuePosition = i + 1;
                    break;
                }
            }
        }

        return new QueueResponse(
            request.getRequestId(),
            request.getVehicle().getUser().getName(),
            request.getVehicle().getRegistrationNumber(),
            request.getChargingSite().getSiteName(),
            request.getRequestedEnergyKwh(),
            request.getPriorityScore(),
            queuePosition == 0 ? null : queuePosition,
            waitingTime,
            null, // Estimated waiting time added later
            request.getJoinedAt(),
            request.getStatus()
        );
    }
}

