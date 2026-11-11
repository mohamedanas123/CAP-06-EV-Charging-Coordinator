"""
telemetry_generator.py
----------------------
Simulates physical EV charging telemetry using NumPy for realistic power fluctuations,
battery SOC ramp curves, and thermal heating dynamics.
"""

import numpy as np
import datetime
from typing import Dict


class SessionTelemetryGenerator:
    """
    Maintains and updates physical telemetry state for a single active EV charging session.
    """

    def __init__(
        self,
        session_id: int,
        charger_id: int,
        allocated_power_kw: float,
        initial_energy_kwh: float = 0.0,
        initial_soc: float = 25.0,
        battery_capacity_kwh: float = 60.0,
        ambient_temp_c: float = 28.0,
    ):
        self.session_id = session_id
        self.charger_id = charger_id
        self.allocated_power_kw = float(allocated_power_kw) if allocated_power_kw else 50.0
        self.energy_delivered_kwh = float(initial_energy_kwh)
        self.soc_percent = float(initial_soc)
        self.battery_capacity_kwh = float(battery_capacity_kwh)
        self.temperature_c = float(ambient_temp_c)
        self.ambient_temp_c = float(ambient_temp_c)

    def next_reading(self, interval_seconds: float = 5.0) -> Dict:
        """
        Generates the next telemetry reading using NumPy for physical modeling.
        Returns a dict matching Spring Boot's TelemetryRequest DTO.
        """
        # 1. Realistic Power Output Modeling
        # CC/CV profile: Once SOC exceeds 80%, charger slows down power delivery
        if self.soc_percent > 80.0:
            taper_factor = float(np.clip(1.0 - (self.soc_percent - 80.0) / 30.0, 0.25, 1.0))
            target_power = self.allocated_power_kw * taper_factor
        else:
            target_power = self.allocated_power_kw

        # Use NumPy Gaussian noise for natural grid & inverter power fluctuation (+/- 1.5%)
        noise = float(np.random.normal(loc=0.0, scale=max(0.3, target_power * 0.015)))
        current_power = float(np.clip(target_power + noise, 1.0, self.allocated_power_kw * 1.05))

        # 2. Cumulative Energy Calculation (kWh = kW * hours)
        hours_elapsed = interval_seconds / 3600.0
        delta_energy = current_power * hours_elapsed
        self.energy_delivered_kwh += delta_energy

        # 3. State of Charge (SOC %) Progression
        soc_delta = (delta_energy / self.battery_capacity_kwh) * 100.0
        self.soc_percent = float(np.clip(self.soc_percent + soc_delta, 0.0, 100.0))

        # 4. Thermal Dynamics Modeling
        # Joule heating: temperature rises with drawn power; dissipates towards ambient
        heating_rate = 0.04 * (current_power / 50.0)
        cooling_rate = 0.01 * (self.temperature_c - self.ambient_temp_c)
        temp_noise = float(np.random.normal(loc=0.0, scale=0.15))
        self.temperature_c = float(
            np.clip(self.temperature_c + heating_rate - cooling_rate + temp_noise, self.ambient_temp_c, 65.0)
        )

        # 5. Build DTO matching TelemetryRequest
        timestamp = datetime.datetime.now().strftime("%Y-%m-%dT%H:%M:%S")

        return {
            "chargerId": self.charger_id,
            "sessionId": self.session_id,
            "powerConsumptionKw": round(current_power, 2),
            "energyKwh": round(self.energy_delivered_kwh, 3),
            "socPercent": round(self.soc_percent, 1),
            "temperatureCelsius": round(self.temperature_c, 1),
            "recordedAt": timestamp,
        }

