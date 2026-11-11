package com.example.evcharging.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "charging_request")
@Getter
@Setter
@NoArgsConstructor
public class ChargingRequest {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long requestId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    private ChargingSite chargingSite;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal requestedEnergyKwh;

    private LocalDateTime requestedTime;

    @Column(precision = 10, scale = 2)
    private BigDecimal priorityScore = BigDecimal.ZERO;

    @Column(nullable = false)
    private LocalDateTime joinedAt;

    @Column(nullable = false, length = 20)
    private String status = "WAITING";

    @OneToMany(mappedBy = "chargingRequest")
    private List<ChargingSession> chargingSessions;
}

