# CAP-06: EV Charging Queue & Grid-Demand Coordinator

An intelligent EV charging management platform designed to reduce customer waiting times, prevent electricity grid overloads, allocate charging bays fairly using priority-based scheduling, and handle hardware failures with queue seniority preservation.

---

## Architecture Overview

```
                      +-----------------------------+
                      |       React Frontend        |
                      |   (Vite, Tailwind, Recharts)|
                      |    http://localhost:5173    |
                      +--------------+--------------+
                                     |
                                     | REST (JWT Auth)
                                     v
+-----------------------+     +-----------------------------+
|   Python Simulator    |     |  Spring Boot Java Backend   |
| (NumPy, Multi-Session)| --> | (Fair Queue, Capacity Check)|
|  Streams telemetry    |     |    http://localhost:8080    |
+-----------------------+     +--------------+--------------+
                                             |
                                             v
                                      +--------------+
                                      |   Database   |
                                      | (MySQL / H2) |
                                      +--------------+
```

---

## Components

### 1. Backend (`/evcharging`)
- **Technology:** Java 21, Spring Boot 4.1.2, Spring Security with JWT, Spring Data JPA, Hibernate.
- **Key Features:**
  - Priority-based queue scheduling algorithm.
  - Substation capacity validation (allocated power never exceeds transformer limits).
  - Hardware fault handling with wait-time preservation on reassignment.
  - Telemetry recording and automatic session completion.

### 2. Frontend (`/frontend`)
- **Technology:** React 18, Vite, Tailwind CSS, React Router, Axios, Lucide React, Recharts.
- **Portals:**
  - **Driver Portal (`/driver/*`):** Dashboard, Charging Stations, My Vehicles, Book Charging, My Queue, Live Charging (real-time telemetry charts), and History.
  - **Admin Portal (`/admin/*`):** 
    - **Overview:** Network KPIs, active chargers, current grid demand, and system alerts.
    - **Site Management:** Click any location to see its local grid capacity, live load, and all chargers (occupying car license plate, driver name, power kW, and energy delivered, with direct "Mark Available / Unavailable" controls).
    - **Queue Management:** Priority queue inspection, waiting requests, and manual/automated FIFO dispatch.
  - **Role-Based Auth:** Strictly enforced JWT role verification for DRIVER and ADMIN accounts.

### 3. Telemetry Simulator (`/simulator`)
- **Technology:** Python 3, NumPy, Requests.
- **Key Features:**
  - Discovers active sessions dynamically via Spring Boot REST API.
  - Multi-session concurrency with individual state tracking.
  - NumPy physical modeling: power noise ($\pm 1.5\%$), CC/CV taper above 80% SOC, Joule heating & cooling.
  - Transmits updates every 5 seconds to `/api/telemetry`.
  - Built-in `--fail-session <id>` flag to test fault recovery.

---

## Docker Containerization & Quick-Start

The entire ecosystem can be started using Docker Compose with persistent MySQL storage, inter-service networking, and health checks.

### 1. Prerequisites
- Docker & Docker Compose (Docker Desktop on Windows/Mac, or Docker Engine on Linux)

### 2. Environment Setup
Copy the template configuration:
```powershell
cp .env.example .env
```

### 3. Build & Launch Containers
```powershell
docker compose up --build -d
```

### 4. Check Container Status
```powershell
docker compose ps
```
You should see 4 healthy containers:
- `cap06-mysql`: MySQL 8.0 on host port 3307 (healthy).
- `cap06-backend`: Spring Boot 4.1.2 on port 8080 (healthy).
- `cap06-frontend`: React Nginx SPA on port 5173.
- `cap06-simulator`: Python telemetry streaming daemon.

### 5. Access the Application
- **Frontend Web UI:** `http://localhost:5173`
- **Backend REST API:** `http://localhost:8080/api`
- **MySQL Database (Docker):** `localhost:3307` (Database: `ev-charging`, User: `root`, Password: `anas`)

### 6. View Live Service Logs
```powershell
# View all logs
docker compose logs -f

# View only the Python telemetry stream
docker compose logs -f simulator

# View Spring Boot backend logs
docker compose logs -f backend
```

### 7. Stopping Containers
```powershell
# Stop all services (preserves database volume)
docker compose down

# Stop and wipe database volume (clean reset)
docker compose down -v
```

---

## Local Development (Without Docker)

### 1. Run the Spring Boot Backend
```powershell
cd evcharging
.\mvnw.cmd spring-boot:run
```
*Backend runs on `http://localhost:8080`.*

### 2. Run the React Frontend
```powershell
cd frontend
npm install
npm run dev
```
*Open `http://localhost:5173` in your browser.*

### 3. Seed Sample Data (Optional)
If running on a fresh database, populate realistic sites, chargers, vehicles, and active sessions:
```powershell
cd frontend
node seed.cjs
```

### 4. Run the Python Simulator
```powershell
cd simulator
pip install -r requirements.txt
python simulator.py
```

### 5. Simulate Charger Fault
```powershell
cd simulator
python simulator.py --fail-session 1
```

---

## Default Accounts
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@evcharging.com` | `Password123!` |
| **Driver 1** | `alex@example.com` | `Password123!` |
| **Driver 2** | `sarah@example.com` | `Password123!` |
| **Driver 3** | `david@example.com` | `Password123!` |

