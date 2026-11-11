package com.example.evcharging.dto;

import java.math.BigDecimal;

public record ChargingSiteResponse(
    Long siteId,
    String siteName,
    String location,
    BigDecimal maxCapacityKw,
    BigDecimal currentDemandKw,
    BigDecimal capacityUtilizationPercent,
    BigDecimal warningThresholdPercent,
    Integer totalChargers,
    Integer availableChargers,
    Integer chargingChargers,
    Integer failedChargers
) {}

