package com.example.evcharging.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "telemetry")
@Getter
@Setter
@NoArgsConstructor
public class Telemetry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long telemetryId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "charger_id", nullable = false)
    private Charger charger;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private ChargingSession chargingSession;

    @Column(precision = 10, scale = 2)
    private BigDecimal powerConsumptionKw;

    @Column(precision = 10, scale = 3)
    private BigDecimal energyKwh;

    @Column(precision = 5, scale = 2)
    private BigDecimal socPercent;

    @Column(precision = 6, scale = 2)
    private BigDecimal temperatureCelsius;

    @Column(nullable = false)
    private LocalDateTime recordedAt;
}

