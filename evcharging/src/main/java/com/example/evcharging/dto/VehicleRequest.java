package com.example.evcharging.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public record VehicleRequest(
    @NotBlank String registrationNumber,
    @NotNull @DecimalMin("1.0") BigDecimal batteryCapacityKwh,
    @NotNull @DecimalMin("0.0") @DecimalMax("100.0") BigDecimal currentSoc
) {}

