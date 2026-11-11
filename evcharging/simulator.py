import time
import datetime
import requests
import random
import sys

BASE_URL = "http://localhost:8080/api"

def run_simulation(charger_id: int, session_id: int, target_energy_kwh: float = 25.0, power_kw: float = 45.0):
    """
    Simulates real-time telemetry streaming from an EV charger to Spring Boot.
    Sends power, energy, SOC, and temperature every 2 seconds until target energy is delivered.
    """
    print(f"=== Starting Telemetry Simulator for Charger ID: {charger_id}, Session ID: {session_id} ===")
    print(f"Target Energy: {target_energy_kwh} kWh | Allocated Power: {power_kw} kW")

    delivered_energy = 0.0
    soc = 20.0 # Starting SOC %
    temp = 32.0 # Starting temperature in Celsius

    step = 1
    while delivered_energy < target_energy_kwh:
        # Simulate slight physical power fluctuation (+/- 2%)
        current_power = round(power_kw * random.uniform(0.97, 1.02), 2)

        # Increment delivered energy (approx 2-3 kWh per step in simulation)
        energy_step = round(random.uniform(2.0, 3.5), 3)
        delivered_energy = round(min(delivered_energy + energy_step, target_energy_kwh), 3)

        # Increment SOC proportionately
        soc = round(min(20.0 + (delivered_energy / target_energy_kwh) * 60.0, 100.0), 2)

        # Fluctuate temperature realistically
        temp = round(min(32.0 + (delivered_energy * 0.4) + random.uniform(-0.5, 0.8), 65.0), 2)

        payload = {
            "chargerId": charger_id,
            "sessionId": session_id,
            "powerConsumptionKw": current_power,
            "energyKwh": delivered_energy,
            "socPercent": soc,
            "temperatureCelsius": temp,
            "recordedAt": datetime.datetime.now().isoformat()
        }

        try:
            res = requests.post(f"{BASE_URL}/telemetry", json=payload, timeout=5)
            if res.status_code in [200, 201]:
                print(f"[Step {step}] Sent: {delivered_energy}/{target_energy_kwh} kWh | Power: {current_power} kW | SOC: {soc}% | Temp: {temp}°C -> SUCCESS")
            else:
                print(f"[Step {step}] Failed with status {res.status_code}: {res.text}")
        except Exception as e:
            print(f"[Step {step}] Connection error (is Spring Boot running?): {e}")

        if delivered_energy >= target_energy_kwh:
            print("Target energy delivered! Charging session complete.")
            break

        step += 1
        time.sleep(2)

if __name__ == "__main__":
    cid = int(sys.argv[1]) if len(sys.argv) > 1 else 1
    sid = int(sys.argv[2]) if len(sys.argv) > 2 else 1
    target = float(sys.argv[3]) if len(sys.argv) > 3 else 20.0
    run_simulation(cid, sid, target)

