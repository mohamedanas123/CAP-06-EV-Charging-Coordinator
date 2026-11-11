package com.example.evcharging.service;

import com.example.evcharging.dto.VehicleRequest;
import com.example.evcharging.dto.VehicleResponse;
import com.example.evcharging.entity.User;
import com.example.evcharging.entity.Vehicle;
import com.example.evcharging.repository.UserRepository;
import com.example.evcharging.repository.VehicleRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class VehicleService {

    private final VehicleRepository vehicleRepository;
    private final UserRepository userRepository;

    public VehicleService(
            VehicleRepository vehicleRepository,
            UserRepository userRepository) {
        this.vehicleRepository = vehicleRepository;
        this.userRepository = userRepository;
    }

    // Add vehicle
    public VehicleResponse addVehicle(Long userId, VehicleRequest request) {

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                    new RuntimeException("User not found"));

        if (vehicleRepository.existsByRegistrationNumber(
                request.registrationNumber())) {
            throw new RuntimeException(
                "Vehicle already registered");
        }

        Vehicle vehicle = new Vehicle();

        vehicle.setUser(user);
        vehicle.setRegistrationNumber(
            request.registrationNumber());
        vehicle.setBatteryCapacityKwh(
            request.batteryCapacityKwh());
        vehicle.setCurrentSoc(request.currentSoc());

        Vehicle savedVehicle = vehicleRepository.save(vehicle);

        return mapToResponse(savedVehicle);
    }

    // Get all vehicles of a user
    @Transactional(readOnly = true)
    public List<VehicleResponse> getUserVehicles(Long userId) {

        return vehicleRepository.findByUserUserId(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // Get vehicle by ID
    @Transactional(readOnly = true)
    public VehicleResponse getVehicleById(Long vehicleId) {

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() ->
                    new RuntimeException("Vehicle not found"));

        return mapToResponse(vehicle);
    }

    // Update vehicle
    public VehicleResponse updateVehicle(
            Long vehicleId, VehicleRequest request) {

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() ->
                    new RuntimeException("Vehicle not found"));

        if (!vehicle.getRegistrationNumber().equals(
                request.registrationNumber())
                && vehicleRepository.existsByRegistrationNumber(
                    request.registrationNumber())) {
            throw new RuntimeException(
                "Registration number already exists");
        }

        vehicle.setRegistrationNumber(
            request.registrationNumber());
        vehicle.setBatteryCapacityKwh(
            request.batteryCapacityKwh());
        vehicle.setCurrentSoc(request.currentSoc());

        return mapToResponse(vehicleRepository.save(vehicle));
    }

    // Delete vehicle
    public void deleteVehicle(Long vehicleId) {

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() ->
                    new RuntimeException("Vehicle not found"));

        vehicleRepository.delete(vehicle);
    }

    // Entity to DTO conversion
    private VehicleResponse mapToResponse(Vehicle vehicle) {

        return new VehicleResponse(
            vehicle.getVehicleId(),
            vehicle.getRegistrationNumber(),
            vehicle.getBatteryCapacityKwh(),
            vehicle.getCurrentSoc()
        );
    }
}

