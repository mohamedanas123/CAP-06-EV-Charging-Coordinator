package com.example.evcharging.dto;

import java.time.LocalDateTime;

public record AlertResponse(
    String alertType,
    String message,
    String severity,
    Long siteId,
    Long chargerId,
    LocalDateTime createdAt
) {}

