"""
api_client.py
-------------
REST API client for communicating with the Spring Boot EV Charging backend.
Handles authentication, session discovery, telemetry dispatch, and failure triggering.
"""

import requests
from typing import List, Dict, Optional


class BackendApiClient:
    def __init__(self, base_url: str = "http://localhost:8080/api"):
        self.base_url = base_url.rstrip("/")
        self.token: Optional[str] = None
        self.charger_id_map: Dict[str, int] = {}

    def authenticate(self, email: str = "admin@evcharging.com", password: str = "Password123!") -> bool:
        """
        Authenticates against Spring Boot /api/auth/login to obtain a JWT Bearer token.
        """
        url = f"{self.base_url}/auth/login"
        payload = {"email": email, "password": password}

        try:
            response = requests.post(url, json=payload, timeout=5)
            if response.status_code == 200:
                data = response.json()
                self.token = data.get("token")
                return True
            else:
                print(f"[API ERROR] Login failed ({response.status_code}): {response.text}")
                return False
        except requests.RequestException as e:
            print(f"[API ERROR] Unable to reach backend at {url}: {e}")
            return False

    def _auth_headers(self) -> Dict[str, str]:
        """Returns request headers including Bearer token if authenticated."""
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def load_charger_map(self) -> Dict[str, int]:
        """
        Fetches all hardware chargers to map chargerName -> chargerId.
        Used to resolve chargerId when sessions only expose chargerName.
        """
        url = f"{self.base_url}/chargers"
        try:
            response = requests.get(url, headers=self._auth_headers(), timeout=5)
            if response.status_code == 200:
                chargers = response.json()
                self.charger_id_map = {
                    c["chargerName"]: c["chargerId"] for c in chargers if "chargerName" in c and "chargerId" in c
                }
                return self.charger_id_map
            else:
                print(f"[API ERROR] Failed to fetch chargers ({response.status_code}): {response.text}")
        except requests.RequestException as e:
            print(f"[API ERROR] Error loading chargers: {e}")
        return self.charger_id_map

    def get_active_sessions(self) -> List[Dict]:
        """
        Retrieves all currently active sessions (ASSIGNED or CHARGING) from Spring Boot.
        Endpoint: GET /api/sessions/active
        """
        url = f"{self.base_url}/sessions/active"
        try:
            response = requests.get(url, headers=self._auth_headers(), timeout=5)
            if response.status_code == 200:
                return response.json()
            else:
                print(f"[API ERROR] Failed to fetch active sessions ({response.status_code}): {response.text}")
                return []
        except requests.RequestException as e:
            print(f"[API ERROR] Error contacting sessions endpoint: {e}")
            return []

    def send_telemetry(self, telemetry_data: Dict) -> bool:
        """
        Submits real-time charger telemetry to Spring Boot.
        Endpoint: POST /api/telemetry
        DTO: TelemetryRequest (chargerId, sessionId, powerConsumptionKw, energyKwh, socPercent, temperatureCelsius, recordedAt)
        """
        url = f"{self.base_url}/telemetry"
        try:
            # Note: /api/telemetry is permitAll() in SecurityConfig
            response = requests.post(url, json=telemetry_data, timeout=5)
            if response.status_code in (200, 201):
                return True
            else:
                print(f"[API ERROR] Telemetry rejected ({response.status_code}): {response.text}")
                return False
        except requests.RequestException as e:
            print(f"[API ERROR] Failed to send telemetry: {e}")
            return False

    def interrupt_session(self, session_id: int, reason: str = "Hardware fault simulated") -> bool:
        """
        Simulates hardware fault by triggering session interruption on the backend.
        Endpoint: POST /api/sessions/{sessionId}/interrupt
        """
        url = f"{self.base_url}/sessions/{session_id}/interrupt"
        payload = {"reason": reason}
        try:
            response = requests.post(url, json=payload, headers=self._auth_headers(), timeout=5)
            if response.status_code == 200:
                print(f"[SIMULATOR] Successfully triggered hardware failure for Session #{session_id}.")
                return True
            else:
                print(f"[API ERROR] Failed to interrupt session ({response.status_code}): {response.text}")
                return False
        except requests.RequestException as e:
            print(f"[API ERROR] Error interrupting session: {e}")
            return False

