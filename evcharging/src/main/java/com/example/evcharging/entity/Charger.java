package com.example.evcharging.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "charger")
@Getter
@Setter
@NoArgsConstructor
public class Charger {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long chargerId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id", nullable = false)
    private ChargingSite chargingSite;

    @Column(nullable = false, length = 50)
    private String chargerName;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal maxPowerKw;

    @Column(nullable = false, length = 20)
    private String status = "AVAILABLE";

    @OneToMany(mappedBy = "charger")
    private List<ChargingSession> chargingSessions;

    @OneToMany(mappedBy = "charger")
    private List<Telemetry> telemetryRecords;
}

