package com.example.evcharging.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record ChargingRequestDto(
    @NotNull Long vehicleId,
    @NotNull Long siteId,
    @NotNull @DecimalMin("0.1") BigDecimal requestedEnergyKwh,
    LocalDateTime requestedTime
) {}

