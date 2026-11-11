package com.example.evcharging.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "charging_site")
@Getter
@Setter
@NoArgsConstructor
public class ChargingSite {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long siteId;

    @Column(nullable = false, length = 100)
    private String siteName;

    private String location;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal maxCapacityKw;

    @Column(precision = 5, scale = 2)
    private BigDecimal warningThresholdPercent = BigDecimal.valueOf(80);

    @OneToMany(mappedBy = "chargingSite")
    private List<Charger> chargers;

    @OneToMany(mappedBy = "chargingSite")
    private List<ChargingRequest> chargingRequests;
}

