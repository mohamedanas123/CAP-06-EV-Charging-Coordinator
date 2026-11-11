package com.example.evcharging.dto;

import java.math.BigDecimal;

public record ChargerResponse(
    Long chargerId,
    String chargerName,
    Long siteId,
    String siteName,
    BigDecimal maxPowerKw,
    String status
) {}

