package com.example.evcharging.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import java.math.BigDecimal;
import java.util.List;

@Entity
@Table(name = "vehicle")
@Getter
@Setter
@NoArgsConstructor
public class Vehicle {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long vehicleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true, length = 30)
    private String registrationNumber;

    @Column(precision = 10, scale = 2)
    private BigDecimal batteryCapacityKwh;

    @Column(precision = 5, scale = 2)
    private BigDecimal currentSoc;

    @OneToMany(mappedBy = "vehicle")
    private List<ChargingRequest> chargingRequests;
}

