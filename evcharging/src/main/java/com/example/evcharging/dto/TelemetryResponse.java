package com.example.evcharging.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TelemetryResponse(
    Long telemetryId,
    Long chargerId,
    Long sessionId,
    BigDecimal powerConsumptionKw,
    BigDecimal energyKwh,
    BigDecimal socPercent,
    BigDecimal temperatureCelsius,
    LocalDateTime recordedAt
) {}

