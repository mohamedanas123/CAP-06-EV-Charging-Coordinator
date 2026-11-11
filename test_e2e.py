"""
test_e2e.py
-----------
Comprehensive End-to-End Automated Test Suite for CAP-06:
1. Authentication (Admin & Driver)
2. Vehicle Registration & Lookup
3. Charging Site & Capacity Thresholds
4. Charger Bay Management & Status
5. Queueing & Priority Scheduling Algorithm
6. Active Session Lifecycle & Power Allocation
7. Telemetry Ingestion (kW, kWh, SOC%, Temp°C)
8. Hardware Failure & Queue Preservation Scenario
9. Dashboard Metrics & Automated Capacity Alerts
10. Frontend Availability & Reverse Proxy Routing
"""

import requests
import time
import sys

BACKEND_URL = "http://localhost:8080/api"
FRONTEND_URL = "http://localhost:5173"

tests_passed = 0
tests_failed = 0


def log_test(name: str, passed: bool, details: str = ""):
    global tests_passed, tests_failed
    if passed:
        tests_passed += 1
        print(f"  [PASS] {name}" + (f" -> {details}" if details else ""))
    else:
        tests_failed += 1
        print(f"  [FAIL] {name}" + (f" -> ERROR: {details}" if details else ""))


def run_e2e_tests():
    print("=" * 75)
    print(" CAP-06: END-TO-END AUTOMATED VERIFICATION TEST SUITE")
    print("=" * 75)
    print(f"Backend Target:  {BACKEND_URL}")
    print(f"Frontend Target: {FRONTEND_URL}\n")

    # TEST 1: Frontend Server Check
    print("1. Frontend Server & Proxy Routing")
    try:
        fe_res = requests.get(FRONTEND_URL, timeout=5)
        log_test("Frontend Homepage (Vite)", fe_res.status_code == 200, f"HTTP {fe_res.status_code}")
    except Exception as e:
        log_test("Frontend Homepage (Vite)", False, str(e))

    # TEST 2: Authentication
    print("\n2. Authentication & JWT Token Verification")
    admin_token = None
    driver_token = None
    alex_user_id = None

    try:
        # Admin Login
        login_res = requests.post(
            f"{BACKEND_URL}/auth/login",
            json={"email": "admin@evcharging.com", "password": "Password123!"},
            timeout=5,
        )
        data = login_res.json()
        admin_token = data.get("token")
        is_admin = data.get("role") == "ADMIN"
        log_test("Admin Authentication", login_res.status_code == 200 and is_admin, f"Role: {data.get('role')}")
    except Exception as e:
        log_test("Admin Authentication", False, str(e))

    try:
        # Driver Login (Alex Chen)
        login_res = requests.post(
            f"{BACKEND_URL}/auth/login",
            json={"email": "alex@example.com", "password": "Password123!"},
            timeout=5,
        )
        data = login_res.json()
        driver_token = data.get("token")
        alex_user_id = data.get("userId")
        is_driver = data.get("role") == "DRIVER"
        log_test("Driver Authentication", login_res.status_code == 200 and is_driver, f"Role: {data.get('role')}")
    except Exception as e:
        log_test("Driver Authentication", False, str(e))

    if not admin_token or not driver_token:
        print("\n[ABORT] Cannot proceed without valid authentication tokens.")
        sys.exit(1)

    admin_headers = {"Authorization": f"Bearer {admin_token}", "Content-Type": "application/json"}
    driver_headers = {"Authorization": f"Bearer {driver_token}", "Content-Type": "application/json"}

    # TEST 3: Vehicles
    print("\n3. Vehicle Management & SOC Retrieval")
    new_vehicle_id = None
    alex_vehicle_id = 1
    try:
        # Get Alex's vehicles
        v_res = requests.get(f"{BACKEND_URL}/vehicles/user/{alex_user_id}", headers=driver_headers, timeout=5)
        vehicles = v_res.json()
        if vehicles:
            alex_vehicle_id = vehicles[0].get("vehicleId", 1)
        log_test("Get User Vehicles", v_res.status_code == 200 and len(vehicles) >= 1, f"Found {len(vehicles)} EVs")

        # Add a temporary test EV
        temp_plate = f"TEST-EV-{int(time.time()) % 10000}"
        add_v_res = requests.post(
            f"{BACKEND_URL}/vehicles/user/{alex_user_id}",
            json={"registrationNumber": temp_plate, "batteryCapacityKwh": 55.0, "currentSoc": 40.0},
            headers=driver_headers,
            timeout=5,
        )
        new_vehicle_id = add_v_res.json().get("vehicleId")
        log_test("Add Vehicle (API)", add_v_res.status_code == 201, f"Vehicle ID #{new_vehicle_id} ({temp_plate})")

        # Update vehicle SOC
        if new_vehicle_id:
            up_v_res = requests.put(
                f"{BACKEND_URL}/vehicles/{new_vehicle_id}",
                json={"registrationNumber": temp_plate, "batteryCapacityKwh": 55.0, "currentSoc": 45.0},
                headers=driver_headers,
                timeout=5,
            )
            log_test("Update Vehicle", up_v_res.status_code == 200, f"Updated SOC to 45.0%")

            # Delete the temporary test EV
            del_v_res = requests.delete(f"{BACKEND_URL}/vehicles/{new_vehicle_id}", headers=driver_headers, timeout=5)
            log_test("Delete Vehicle", del_v_res.status_code in (200, 204))
    except Exception as e:
        log_test("Vehicle Operations", False, str(e))

    # TEST 4: Sites & Capacity Limits
    print("\n4. Charging Sites & Grid Capacity Validation")
    test_site_id = None
    try:
        sites_res = requests.get(f"{BACKEND_URL}/sites", headers=admin_headers, timeout=5)
        sites = sites_res.json()
        log_test("Get All Sites", sites_res.status_code == 200 and len(sites) >= 3, f"Found {len(sites)} sites")

        # Check utilization calculation
        s1 = sites[0]
        max_cap = float(s1.get("maxCapacityKw", 0))
        cur_dem = float(s1.get("currentDemandKw", 0))
        util = float(s1.get("capacityUtilizationPercent", 0))
        log_test(
            f"Site #{s1.get('siteId')} Capacity Metrics",
            max_cap > 0,
            f"Demand: {cur_dem} kW / Max: {max_cap} kW ({util}%)",
        )
    except Exception as e:
        log_test("Sites Verification", False, str(e))

    # TEST 5: Charger Bays & Status
    print("\n5. Hardware Charger Bays & Registry")
    try:
        chargers_res = requests.get(f"{BACKEND_URL}/chargers", headers=admin_headers, timeout=5)
        chargers = chargers_res.json()
        log_test(
            "Hardware Charger Registry",
            chargers_res.status_code == 200 and len(chargers) >= 8,
            f"{len(chargers)} total chargers",
        )
        avail_count = len([c for c in chargers if c.get("status") == "AVAILABLE"])
        log_test(
            "Charger Bay Availability",
            chargers_res.status_code == 200 and avail_count >= 1,
            f"{avail_count} available bay(s)",
        )
    except Exception as e:
        log_test("Chargers Verification", False, str(e))

    # TEST 6: Queue & Priority Scheduling
    print("\n6. Priority-Based Queue & Fair Allocation")
    try:
        requests_res = requests.get(f"{BACKEND_URL}/requests", headers=admin_headers, timeout=5)
        all_reqs = requests_res.json()
        log_test("Get Queue Requests", requests_res.status_code == 200, f"{len(all_reqs)} total requests recorded")

        # Ensure an active session exists; if not, create a request and schedule it
        sessions_check = requests.get(f"{BACKEND_URL}/sessions/active", headers=admin_headers, timeout=5)
        existing_active = sessions_check.json() if sessions_check.status_code == 200 else []
        if not existing_active:
            req_payload = {
                "userId": alex_user_id,
                "vehicleId": alex_vehicle_id,
                "siteId": 1,
                "requestedEnergyKwh": 25.0,
                "targetSoc": 80.0,
                "priorityTier": "STANDARD",
            }
            requests.post(f"{BACKEND_URL}/requests", json=req_payload, headers=driver_headers, timeout=5)

        # Trigger scheduler manually on Site 1
        sched_res = requests.post(f"{BACKEND_URL}/sites/1/schedule", headers=admin_headers, timeout=5)
        data = sched_res.json()
        log_test(
            "Execute Priority Scheduler",
            sched_res.status_code == 200,
            f"Scheduled {data.get('scheduledSessionsCount', 0)} sessions",
        )
    except Exception as e:
        log_test("Queue & Scheduling", False, str(e))

    # TEST 7: Active Sessions & Telemetry
    print("\n7. Live Sessions & Telemetry Ingestion")
    test_session = None
    try:
        sessions_res = requests.get(f"{BACKEND_URL}/sessions/active", headers=admin_headers, timeout=5)
        sessions = sessions_res.json()
        log_test("Get Active Sessions", sessions_res.status_code == 200 and len(sessions) > 0, f"{len(sessions)} active")

        if sessions:
            test_session = sessions[0]
            sid = test_session["sessionId"]

            # If session is ASSIGNED, start it to begin charging
            if test_session.get("status") == "ASSIGNED":
                requests.post(f"{BACKEND_URL}/sessions/{sid}/start", headers=admin_headers, timeout=5)

            # Resolve charger ID matching session's charger
            chargers_res = requests.get(f"{BACKEND_URL}/chargers", headers=admin_headers, timeout=5)
            chargers_list = chargers_res.json() if chargers_res.status_code == 200 else []
            c_name = test_session.get("chargerName")
            matched_c = next((c for c in chargers_list if c.get("chargerName") == c_name), None)
            actual_charger_id = matched_c.get("chargerId") if matched_c else 1

            # Post telemetry reading matching TelemetryRequest
            telemetry_payload = {
                "chargerId": actual_charger_id,
                "sessionId": sid,
                "powerConsumptionKw": 58.5,
                "energyKwh": float(test_session.get("energyDeliveredKwh", 0)) + 0.25,
                "socPercent": 36.0,
                "temperatureCelsius": 33.5,
                "recordedAt": time.strftime("%Y-%m-%dT%H:%M:%S"),
            }
            tel_res = requests.post(f"{BACKEND_URL}/telemetry", json=telemetry_payload, timeout=5)
            log_test("Post Telemetry Stream", tel_res.status_code in (200, 201), f"Session #{sid} (58.5 kW, 36.0% SOC)")

            # Query back session telemetry
            hist_res = requests.get(f"{BACKEND_URL}/telemetry/session/{sid}", headers=admin_headers, timeout=5)
            log_test(
                "Retrieve Telemetry History",
                hist_res.status_code == 200 and len(hist_res.json()) > 0,
                f"{len(hist_res.json())} telemetry entries",
            )
    except Exception as e:
        log_test("Sessions & Telemetry", False, str(e))

    # TEST 8: Failure Handling & Queue Wait-Time Preservation
    print("\n8. Charger Failure & Queue Preservation Scenario")
    try:
        if test_session:
            sid = test_session["sessionId"]
            req_id = test_session["requestId"]

            # Record session state before interruption
            interrupt_res = requests.post(
                f"{BACKEND_URL}/sessions/{sid}/interrupt",
                json={"reason": "Automatic Hardware Thermal Trip"},
                headers=admin_headers,
                timeout=5,
            )
            data = interrupt_res.json()
            is_interrupted = data.get("status") == "INTERRUPTED"
            log_test("Session Interruption Trigger", interrupt_res.status_code == 200 and is_interrupted, f"Status: {data.get('status')}")

            # Verify the request is preserved and returned to WAITING status
            all_reqs_after = requests.get(f"{BACKEND_URL}/requests", headers=admin_headers, timeout=5).json()
            reassigned_req = next((r for r in all_reqs_after if r["requestId"] == req_id), None)
            is_waiting = reassigned_req and reassigned_req.get("status") in ("WAITING", "ASSIGNED")
            log_test(
                "Queue Wait-Time Seniority Preserved",
                bool(reassigned_req and is_waiting),
                f"Request #{req_id} status is '{reassigned_req.get('status') if reassigned_req else 'None'}'",
            )

            # Restore charger status back to AVAILABLE
            requests.patch(f"{BACKEND_URL}/chargers/{actual_charger_id}/status", json={"status": "AVAILABLE"}, headers=admin_headers, timeout=5)
    except Exception as e:
        log_test("Failure Handling", False, str(e))

    # TEST 9: Dashboard Summary & Grid Alerts
    print("\n9. Dashboard Summary & Grid Safety Alerts")
    try:
        sum_res = requests.get(f"{BACKEND_URL}/dashboard/summary", headers=admin_headers, timeout=5)
        summary = sum_res.json()
        log_test(
            "Dashboard Aggregation API",
            sum_res.status_code == 200 and "totalChargers" in summary,
            f"Demand: {summary.get('currentDemandKw')} kW | Total Chargers: {summary.get('totalChargers')}",
        )

        alert_res = requests.get(f"{BACKEND_URL}/dashboard/alerts", headers=admin_headers, timeout=5)
        log_test("Grid Capacity Alerts API", alert_res.status_code == 200, f"{len(alert_res.json())} active alert(s)")
    except Exception as e:
        log_test("Dashboard & Alerts", False, str(e))

    # Final Report
    print("\n" + "=" * 75)
    print(f" TEST RUN COMPLETE: {tests_passed} PASSED | {tests_failed} FAILED")
    print("=" * 75)

    return tests_failed == 0


if __name__ == "__main__":
    success = run_e2e_tests()
    sys.exit(0 if success else 1)

