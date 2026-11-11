package com.example.evcharging.dto;

import java.math.BigDecimal;

public record VehicleResponse(
    Long vehicleId,
    String registrationNumber,
    BigDecimal batteryCapacityKwh,
    BigDecimal currentSoc
) {}

