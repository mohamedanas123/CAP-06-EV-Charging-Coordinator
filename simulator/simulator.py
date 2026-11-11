"""
simulator.py
------------
Main EV Charging Simulator entry point for the CAP-06 project.
Simulates real-time telemetry from multiple charging bays and streams updates
every 5 seconds to the Spring Boot backend.
"""

import time
import argparse
import os
import sys
from typing import Dict
from api_client import BackendApiClient
from telemetry_generator import SessionTelemetryGenerator


def run_simulator(
    base_url: str,
    email: str,
    password: str,
    interval: float,
    fail_session_id: int = None,
    max_cycles: int = 0,
):
    print("=" * 70)
    print(" CAP-06: EV CHARGING HARDWARE & TELEMETRY SIMULATOR")
    print("=" * 70)
    print(f"Target Backend: {base_url}")
    print(f"Cycle Interval: {interval} seconds\n")

    client = BackendApiClient(base_url=base_url)

    # 1. Connect & Authenticate with Spring Boot (with startup retry loop)
    print("[1/3] Authenticating with Spring Boot...")
    max_retries = 15
    for attempt in range(1, max_retries + 1):
        if client.authenticate(email=email, password=password):
            print("✓ Successfully authenticated with backend.\n")
            break
        if attempt < max_retries:
            print(f"Backend not ready yet (attempt {attempt}/{max_retries}). Retrying in 4s...")
            time.sleep(4)
        else:
            print("\n[FAILED] Could not authenticate with Spring Boot.")
            print(f"Target URL: {base_url}")
            sys.exit(1)

    # If the user passed --fail-session, trigger failure and exit
    if fail_session_id is not None:
        print(f"[OPTION] Simulating hardware failure for Session #{fail_session_id}...")
        success = client.interrupt_session(fail_session_id, reason="Simulated hardware thermal limit trip")
        if success:
            print(f"✓ Charger fault simulated. Spring Boot has preserved queue seniority and marked bay FAILED.")
        sys.exit(0 if success else 1)

    # 2. Map Charger Names to Charger IDs
    print("[2/3] Fetching hardware charger configuration...")
    charger_map = client.load_charger_map()
    print(f"✓ Loaded {len(charger_map)} hardware chargers from network.\n")

    # 3. Main Multi-Session Telemetry Loop
    print("[3/3] Starting multi-session telemetry loop...")
    print("Press Ctrl+C to stop simulation.\n")

    generators: Dict[int, SessionTelemetryGenerator] = {}
    cycle = 1

    try:
        while True:
            # Query backend for current active sessions (ASSIGNED or CHARGING)
            active_sessions = client.get_active_sessions()

            if not active_sessions:
                print(f"[{time.strftime('%H:%M:%S')}] Cycle #{cycle}: No active sessions found. Waiting for queue dispatch...")
                generators.clear()
            else:
                active_ids = {s["sessionId"] for s in active_sessions}

                # Clean up any sessions that have completed or been interrupted
                stopped_ids = [sid for sid in generators if sid not in active_ids]
                for sid in stopped_ids:
                    print(f"--> Session #{sid} ended on backend. Stopped telemetry generator.")
                    del generators[sid]

                # Register any new active sessions
                for session in active_sessions:
                    sid = session["sessionId"]
                    if sid not in generators:
                        charger_name = session.get("chargerName", "")
                        charger_id = charger_map.get(charger_name)

                        if not charger_id:
                            charger_map = client.load_charger_map()
                            charger_id = charger_map.get(charger_name, 1)

                        allocated_power = float(session.get("allocatedPowerKw") or 50.0)
                        initial_energy = float(session.get("energyDeliveredKwh") or 0.0)

                        generator = SessionTelemetryGenerator(
                            session_id=sid,
                            charger_id=charger_id,
                            allocated_power_kw=allocated_power,
                            initial_energy_kwh=initial_energy,
                            initial_soc=25.0,
                            battery_capacity_kwh=60.0,
                        )
                        generators[sid] = generator
                        print(
                            f"--> Attached to Session #{sid} on '{charger_name}' (Bay ID #{charger_id}) | Power: {allocated_power} kW"
                        )

                # Generate and transmit telemetry readings for all active sessions
                print(f"\n--- [Cycle #{cycle}] {time.strftime('%H:%M:%S')} - Streaming {len(generators)} Active Session(s) ---")
                for sid, gen in list(generators.items()):
                    telemetry_payload = gen.next_reading(interval_seconds=interval)

                    success = client.send_telemetry(telemetry_payload)
                    status_str = "SUCCESS" if success else "REJECTED"

                    print(
                        f"  [Session #{sid:>2}] Bay #{gen.charger_id} | "
                        f"Power: {telemetry_payload['powerConsumptionKw']:>5.2f} kW | "
                        f"Energy: {telemetry_payload['energyKwh']:>6.3f} kWh | "
                        f"SOC: {telemetry_payload['socPercent']:>5.1f}% | "
                        f"Temp: {telemetry_payload['temperatureCelsius']:>4.1f}°C -> {status_str}"
                    )

                    if not success:
                        print(f"  --> Session #{sid} is no longer active on Spring Boot. Removing from simulator.")
                        del generators[sid]

            if max_cycles > 0 and cycle >= max_cycles:
                print(f"\n✓ Completed {max_cycles} requested simulation cycles.")
                break

            cycle += 1
            time.sleep(interval)

    except KeyboardInterrupt:
        print("\n\n[STOPPED] EV Charging Simulator stopped by operator.")


def main():
    default_base_url = os.environ.get("BASE_URL", "http://localhost:8080/api")
    default_email = os.environ.get("OPERATOR_EMAIL", "admin@evcharging.com")
    default_password = os.environ.get("OPERATOR_PASSWORD", "Password123!")

    parser = argparse.ArgumentParser(description="CAP-06: EV Charging Telemetry Simulator")
    parser.add_argument("--base-url", default=default_base_url, help="Spring Boot API base URL")
    parser.add_argument("--email", default=default_email, help="Operator login email")
    parser.add_argument("--password", default=default_password, help="Operator login password")
    parser.add_argument("--interval", type=float, default=5.0, help="Reading interval in seconds (default: 5.0)")
    parser.add_argument(
        "--cycles",
        type=int,
        default=0,
        help="Number of cycles to run before exiting (default: 0 = continuous)",
    )
    parser.add_argument(
        "--fail-session",
        type=int,
        default=None,
        help="Simulate hardware failure for a specific Session ID and exit",
    )

    args = parser.parse_args()
    run_simulator(
        base_url=args.base_url,
        email=args.email,
        password=args.password,
        interval=args.interval,
        fail_session_id=args.fail_session,
        max_cycles=args.cycles,
    )


if __name__ == "__main__":
    main()
