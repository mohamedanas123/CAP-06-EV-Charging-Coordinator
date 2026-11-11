package com.example.evcharging.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record QueueResponse(
    Long requestId,
    String driverName,
    String vehicleRegistrationNumber,
    String siteName,
    BigDecimal requestedEnergyKwh,
    BigDecimal priorityScore,
    Integer queuePosition,
    Long waitingTimeMinutes,
    Long estimatedWaitingTimeMinutes,
    LocalDateTime joinedAt,
    String status
) {}

