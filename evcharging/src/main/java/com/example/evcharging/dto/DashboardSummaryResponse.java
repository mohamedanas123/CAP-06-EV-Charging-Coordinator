package com.example.evcharging.dto;

import java.math.BigDecimal;

public record DashboardSummaryResponse(
    Integer totalChargers,
    Integer availableChargers,
    Integer chargingChargers,
    Integer failedChargers,
    Integer waitingRequests,
    Integer activeSessions,
    Integer completedSessions,
    Integer interruptedSessions,
    BigDecimal totalEnergyDeliveredKwh,
    BigDecimal currentDemandKw,
    BigDecimal maxCapacityKw,
    BigDecimal capacityUtilizationPercent,
    BigDecimal averageWaitingTimeMinutes
) {}

