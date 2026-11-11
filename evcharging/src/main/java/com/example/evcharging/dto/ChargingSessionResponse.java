package com.example.evcharging.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ChargingSessionResponse(
    Long sessionId,
    Long requestId,
    String driverName,
    String vehicleRegistrationNumber,
    String siteName,
    String chargerName,
    BigDecimal allocatedPowerKw,
    BigDecimal energyDeliveredKwh,
    BigDecimal currentSoc,
    LocalDateTime startTime,
    LocalDateTime endTime,
    String status,
    String failureReason
) {}

