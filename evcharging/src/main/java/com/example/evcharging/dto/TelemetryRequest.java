package com.example.evcharging.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TelemetryRequest(
    @NotNull Long chargerId,
    @NotNull Long sessionId,
    @NotNull BigDecimal powerConsumptionKw,
    @NotNull BigDecimal energyKwh,
    @NotNull @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal socPercent,
    @NotNull BigDecimal temperatureCelsius,
    @NotNull LocalDateTime recordedAt
) {}

