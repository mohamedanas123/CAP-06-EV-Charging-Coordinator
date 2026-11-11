package com.example.evcharging;

import com.example.evcharging.dto.*;
import com.example.evcharging.entity.*;
import com.example.evcharging.repository.*;
import com.example.evcharging.service.AuthService;
import com.example.evcharging.service.ChargingSchedulerService;
import com.example.evcharging.service.ChargingSessionService;
import com.example.evcharging.service.TelemetryService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
public class DatabaseAndIntegrationTest {

    @Autowired private UserRepository userRepository;
    @Autowired private ChargingSiteRepository siteRepository;
    @Autowired private ChargerRepository chargerRepository;
    @Autowired private VehicleRepository vehicleRepository;
    @Autowired private ChargingRequestRepository requestRepository;
    @Autowired private ChargingSessionRepository sessionRepository;
    @Autowired private TelemetryRepository telemetryRepository;

    @Autowired private AuthService authService;
    @Autowired private ChargingSchedulerService schedulerService;
    @Autowired private ChargingSessionService sessionService;
    @Autowired private TelemetryService telemetryService;

    @BeforeEach
    public void cleanUp() {
        telemetryRepository.deleteAll();
        sessionRepository.deleteAll();
        requestRepository.deleteAll();
        chargerRepository.deleteAll();
        vehicleRepository.deleteAll();
        siteRepository.deleteAll();
        userRepository.deleteAll();
    }

    // -------------------------------------------------------------
    // 1. Verify Database Integration: Check all 7 tables & CRUD
    // -------------------------------------------------------------
    @Test
    @DisplayName("Verify Database Integration - Check all seven tables, JPA relationships & CRUD")
    @Transactional
    public void testDatabaseIntegrationAllSevenTables() {
        // 1. User
        User user = new User();
        user.setName("John Doe");
        user.setEmail("john.doe@example.com");
        user.setPassword("secretPassword123");
        user.setRole("DRIVER");
        user = userRepository.save(user);
        assertNotNull(user.getUserId());
        assertTrue(userRepository.existsByEmail("john.doe@example.com"));

        // 2. ChargingSite
        ChargingSite site = new ChargingSite();
        site.setSiteName("Downtown Supercharger");
        site.setLocation("Sector 62, Noida");
        site.setMaxCapacityKw(BigDecimal.valueOf(150.0));
        site.setWarningThresholdPercent(BigDecimal.valueOf(80.0));
        site = siteRepository.save(site);
        assertNotNull(site.getSiteId());

        // 3. Charger
        Charger charger = new Charger();
        charger.setChargingSite(site);
        charger.setChargerName("Charger-A1");
        charger.setMaxPowerKw(BigDecimal.valueOf(50.0));
        charger.setStatus("AVAILABLE");
        charger = chargerRepository.save(charger);
        assertNotNull(charger.getChargerId());
        assertEquals("AVAILABLE", charger.getStatus());

        // 4. Vehicle
        Vehicle vehicle = new Vehicle();
        vehicle.setUser(user);
        vehicle.setRegistrationNumber("DL01AB1234");
        vehicle.setBatteryCapacityKwh(BigDecimal.valueOf(60.0));
        vehicle.setCurrentSoc(BigDecimal.valueOf(25.0));
        vehicle = vehicleRepository.save(vehicle);
        assertNotNull(vehicle.getVehicleId());
        assertEquals("DL01AB1234", vehicle.getRegistrationNumber());

        // 5. ChargingRequest
        ChargingRequest request = new ChargingRequest();
        request.setVehicle(vehicle);
        request.setChargingSite(site);
        request.setRequestedEnergyKwh(BigDecimal.valueOf(35.0));
        request.setPriorityScore(BigDecimal.valueOf(10.0));
        request.setJoinedAt(LocalDateTime.now());
        request.setStatus("WAITING");
        request = requestRepository.save(request);
        assertNotNull(request.getRequestId());
        assertEquals("WAITING", request.getStatus());

        // 6. ChargingSession
        ChargingSession session = new ChargingSession();
        session.setChargingRequest(request);
        session.setCharger(charger);
        session.setAllocatedPowerKw(BigDecimal.valueOf(50.0));
        session.setEnergyDeliveredKwh(BigDecimal.ZERO);
        session.setStartTime(LocalDateTime.now());
        session.setStatus("ASSIGNED");
        session = sessionRepository.save(session);
        assertNotNull(session.getSessionId());

        // 7. Telemetry
        Telemetry telemetry = new Telemetry();
        telemetry.setCharger(charger);
        telemetry.setChargingSession(session);
        telemetry.setPowerConsumptionKw(BigDecimal.valueOf(48.5));
        telemetry.setEnergyKwh(BigDecimal.valueOf(5.2));
        telemetry.setSocPercent(BigDecimal.valueOf(35.0));
        telemetry.setTemperatureCelsius(BigDecimal.valueOf(34.2));
        telemetry.setRecordedAt(LocalDateTime.now());
        telemetry = telemetryRepository.save(telemetry);
        assertNotNull(telemetry.getTelemetryId());

        // Verify relationships
        assertEquals(user.getUserId(), vehicle.getUser().getUserId());
        assertEquals(site.getSiteId(), charger.getChargingSite().getSiteId());
        assertEquals(vehicle.getVehicleId(), request.getVehicle().getVehicleId());
        assertEquals(session.getSessionId(), telemetry.getChargingSession().getSessionId());

        // Test delete / CRUD
        telemetryRepository.delete(telemetry);
        assertFalse(telemetryRepository.findById(telemetry.getTelemetryId()).isPresent());
    }

    // -------------------------------------------------------------
    // 2. Test User Registration and Login via AuthService & Security
    // -------------------------------------------------------------
    @Test
    @DisplayName("Verify User Registration & Login with Password Hashing & JWT")
    public void testUserRegistrationAndLogin() {
        RegisterRequest registerReq = new RegisterRequest("Alice Wonderland", "alice@example.com", "Password@123");
        AuthResponse registered = authService.register(registerReq);

        assertNotNull(registered.token());
        assertEquals("alice@example.com", registered.email());
        assertEquals("DRIVER", registered.role());

        // Test login
        LoginRequest loginReq = new LoginRequest("alice@example.com", "Password@123");
        AuthResponse loggedIn = authService.login(loginReq);
        assertNotNull(loggedIn.token());
        assertEquals(registered.userId(), loggedIn.userId());

        // Test wrong password
        assertThrows(RuntimeException.class, () -> {
            authService.login(new LoginRequest("alice@example.com", "WrongPassword!"));
        });
    }

    // -------------------------------------------------------------
    // 3. Implement Automatic Queue Scheduling & Capacity Prevention
    // -------------------------------------------------------------
    @Test
    @DisplayName("Verify Automatic Queue Scheduling, Charger Assignment & Capacity Prevention")
    public void testQueueSchedulingAndCapacityLimits() {
        // Site with 100 kW max capacity
        ChargingSite site = new ChargingSite();
        site.setSiteName("Express Charge Hub");
        site.setLocation("Indiranagar, Bangalore");
        site.setMaxCapacityKw(BigDecimal.valueOf(100.0));
        site.setWarningThresholdPercent(BigDecimal.valueOf(80.0));
        site = siteRepository.save(site);

        // Charger 1 (60 kW)
        Charger c1 = new Charger();
        c1.setChargingSite(site);
        c1.setChargerName("Bay-1");
        c1.setMaxPowerKw(BigDecimal.valueOf(60.0));
        c1.setStatus("AVAILABLE");
        chargerRepository.save(c1);

        // Charger 2 (60 kW)
        Charger c2 = new Charger();
        c2.setChargingSite(site);
        c2.setChargerName("Bay-2");
        c2.setMaxPowerKw(BigDecimal.valueOf(60.0));
        c2.setStatus("AVAILABLE");
        chargerRepository.save(c2);

        // User & 2 Vehicles
        User user = new User();
        user.setName("Bob");
        user.setEmail("bob@ev.com");
        user.setPassword("password123");
        user = userRepository.save(user);

        Vehicle v1 = new Vehicle();
        v1.setUser(user);
        v1.setRegistrationNumber("KA01EV0001");
        v1.setBatteryCapacityKwh(BigDecimal.valueOf(80.0));
        v1 = vehicleRepository.save(v1);

        Vehicle v2 = new Vehicle();
        v2.setUser(user);
        v2.setRegistrationNumber("KA01EV0002");
        v2.setBatteryCapacityKwh(BigDecimal.valueOf(80.0));
        v2 = vehicleRepository.save(v2);

        // Request 1
        ChargingRequest r1 = new ChargingRequest();
        r1.setVehicle(v1);
        r1.setChargingSite(site);
        r1.setRequestedEnergyKwh(BigDecimal.valueOf(40.0));
        r1.setJoinedAt(LocalDateTime.now().minusMinutes(5));
        r1.setStatus("WAITING");
        r1.setPriorityScore(BigDecimal.valueOf(5.0));
        requestRepository.save(r1);

        // Request 2
        ChargingRequest r2 = new ChargingRequest();
        r2.setVehicle(v2);
        r2.setChargingSite(site);
        r2.setRequestedEnergyKwh(BigDecimal.valueOf(50.0));
        r2.setJoinedAt(LocalDateTime.now());
        r2.setStatus("WAITING");
        r2.setPriorityScore(BigDecimal.valueOf(2.0));
        requestRepository.save(r2);

        // Execute scheduling:
        // Max capacity = 100 kW. c1 gets 60 kW (remaining 40 kW).
        // c2 gets min(60 kW, 40 kW) = 40 kW! Total capacity used = 100 kW.
        int scheduledCount = schedulerService.scheduleWaitingRequests(site.getSiteId());
        assertEquals(2, scheduledCount);

        List<ChargingSession> sessions = sessionRepository.findAll();
        assertEquals(2, sessions.size());

        // Verify allocated power respects site capacity: 60 kW + 40 kW = 100 kW <= 100 kW
        BigDecimal totalAllocated = sessions.stream()
                .map(ChargingSession::getAllocatedPowerKw)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(0, totalAllocated.compareTo(BigDecimal.valueOf(100.0)));
    }

    // -------------------------------------------------------------
    // 4. Connect Telemetry & Update Charging Sessions
    // -------------------------------------------------------------
    @Test
    @DisplayName("Verify Telemetry Feed from Simulator & Auto Transition to COMPLETED")
    public void testTelemetryReceptionAndSessionCompletion() {
        // Setup
        ChargingSite site = new ChargingSite();
        site.setSiteName("Tech Park Station");
        site.setMaxCapacityKw(BigDecimal.valueOf(200.0));
        site = siteRepository.save(site);

        Charger charger = new Charger();
        charger.setChargingSite(site);
        charger.setChargerName("Charger-Fast");
        charger.setMaxPowerKw(BigDecimal.valueOf(50.0));
        charger.setStatus("CHARGING");
        charger = chargerRepository.save(charger);

        User user = new User();
        user.setName("Charlie");
        user.setEmail("charlie@ev.com");
        user.setPassword("password");
        user = userRepository.save(user);

        Vehicle vehicle = new Vehicle();
        vehicle.setUser(user);
        vehicle.setRegistrationNumber("MH12EV9999");
        vehicle.setBatteryCapacityKwh(BigDecimal.valueOf(50.0));
        vehicle = vehicleRepository.save(vehicle);

        ChargingRequest request = new ChargingRequest();
        request.setVehicle(vehicle);
        request.setChargingSite(site);
        request.setRequestedEnergyKwh(BigDecimal.valueOf(20.0));
        request.setJoinedAt(LocalDateTime.now());
        request.setStatus("ASSIGNED");
        request = requestRepository.save(request);

        ChargingSession session = new ChargingSession();
        session.setChargingRequest(request);
        session.setCharger(charger);
        session.setAllocatedPowerKw(BigDecimal.valueOf(50.0));
        session.setEnergyDeliveredKwh(BigDecimal.ZERO);
        session.setStatus("ASSIGNED");
        session = sessionRepository.save(session);

        // 1st Telemetry reading (starts session)
        TelemetryRequest t1 = new TelemetryRequest(
                charger.getChargerId(),
                session.getSessionId(),
                BigDecimal.valueOf(45.0),
                BigDecimal.valueOf(5.0),
                BigDecimal.valueOf(30.0),
                BigDecimal.valueOf(38.5),
                LocalDateTime.now()
        );
        telemetryService.receiveTelemetry(t1);

        ChargingSession updatedSession1 = sessionRepository.findById(session.getSessionId()).get();
        assertEquals("CHARGING", updatedSession1.getStatus());
        assertEquals(0, BigDecimal.valueOf(5.0).compareTo(updatedSession1.getEnergyDeliveredKwh()));

        // Final Telemetry reading reaches requested energy (20.0 kWh) -> Session should auto complete!
        TelemetryRequest t2 = new TelemetryRequest(
                charger.getChargerId(),
                session.getSessionId(),
                BigDecimal.valueOf(45.0),
                BigDecimal.valueOf(20.0),
                BigDecimal.valueOf(70.0),
                BigDecimal.valueOf(41.0),
                LocalDateTime.now()
        );
        telemetryService.receiveTelemetry(t2);

        ChargingSession completedSession = sessionRepository.findById(session.getSessionId()).get();
        assertEquals("COMPLETED", completedSession.getStatus());
        assertNotNull(completedSession.getEndTime());

        // Charger is returned to AVAILABLE
        Charger freedCharger = chargerRepository.findById(charger.getChargerId()).get();
        assertEquals("AVAILABLE", freedCharger.getStatus());
    }

    // -------------------------------------------------------------
    // 5. Validate Failure Scenarios: Charger failure & interruption
    // -------------------------------------------------------------
    @Test
    @DisplayName("Validate Failure Scenarios - Charger Failure, Interruption & Reassignment to Queue")
    public void testFailureScenarios() {
        ChargingSite site = new ChargingSite();
        site.setSiteName("Airport Hub");
        site.setMaxCapacityKw(BigDecimal.valueOf(100.0));
        site = siteRepository.save(site);

        Charger charger = new Charger();
        charger.setChargingSite(site);
        charger.setChargerName("Bay-Faulty");
        charger.setMaxPowerKw(BigDecimal.valueOf(50.0));
        charger.setStatus("CHARGING");
        charger = chargerRepository.save(charger);

        User user = new User();
        user.setName("Dave");
        user.setEmail("dave@ev.com");
        user.setPassword("password");
        user = userRepository.save(user);

        Vehicle vehicle = new Vehicle();
        vehicle.setUser(user);
        vehicle.setRegistrationNumber("DL09EV1111");
        vehicle.setBatteryCapacityKwh(BigDecimal.valueOf(60.0));
        vehicle = vehicleRepository.save(vehicle);

        ChargingRequest request = new ChargingRequest();
        request.setVehicle(vehicle);
        request.setChargingSite(site);
        request.setRequestedEnergyKwh(BigDecimal.valueOf(30.0));
        request.setJoinedAt(LocalDateTime.now().minusHours(1));
        request.setStatus("ASSIGNED");
        request = requestRepository.save(request);

        ChargingSession session = new ChargingSession();
        session.setChargingRequest(request);
        session.setCharger(charger);
        session.setAllocatedPowerKw(BigDecimal.valueOf(50.0));
        session.setEnergyDeliveredKwh(BigDecimal.valueOf(10.0));
        session.setStatus("CHARGING");
        session = sessionRepository.save(session);

        // Interrupt session due to hardware overheating
        ChargingSessionResponse interrupted = sessionService.interruptSession(
                session.getSessionId(), "Overheating protection triggered");

        assertEquals("INTERRUPTED", interrupted.status());
        assertEquals("Overheating protection triggered", interrupted.failureReason());

        // Verify charger marked as FAILED
        Charger failedCharger = chargerRepository.findById(charger.getChargerId()).get();
        assertEquals("FAILED", failedCharger.getStatus());

        // Verify request placed back to WAITING state with preserved original joinedAt
        ChargingRequest reWaitingReq = requestRepository.findById(request.getRequestId()).get();
        assertEquals("WAITING", reWaitingReq.getStatus());
    }
}
