package com.example.evcharging.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "charging_session")
@Getter
@Setter
@NoArgsConstructor
public class ChargingSession {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "request_id", nullable = false)
    private ChargingRequest chargingRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "charger_id", nullable = false)
    private Charger charger;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal allocatedPowerKw;

    @Column(precision = 10, scale = 2)
    private BigDecimal energyDeliveredKwh = BigDecimal.ZERO;

    private LocalDateTime startTime;
    private LocalDateTime endTime;

    @Column(nullable = false, length = 20)
    private String status = "ASSIGNED";

    private String failureReason;

    @OneToMany(mappedBy = "chargingSession")
    private List<Telemetry> telemetryRecords;
}

