const axios = require('axios');

const BASE_URL = 'http://localhost:8080/api';

async function seed() {
  console.log('--- Starting EV Charging Database Seeding ---');

  try {
    // 1. Register Drivers
    console.log('1. Registering Users...');
    
    async function registerOrLogin(name, email, password) {
      try {
        const res = await axios.post(`${BASE_URL}/auth/register`, { name, email, password });
        return res.data;
      } catch (err) {
        // If already exists, log in
        const res = await axios.post(`${BASE_URL}/auth/login`, { email, password });
        return res.data;
      }
    }

    const admin = await registerOrLogin('Admin Operator', 'admin@evcharging.com', 'Password123!');
    const driver1 = await registerOrLogin('Alex Chen', 'alex@example.com', 'Password123!');
    const driver2 = await registerOrLogin('Sarah Miller', 'sarah@example.com', 'Password123!');
    const driver3 = await registerOrLogin('David Kumar', 'david@example.com', 'Password123!');

    const token = admin.token;
    const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

    console.log(`✓ Authenticated with JWT token.`);

    // 2. Add Vehicles
    console.log('2. Adding Vehicles...');
    const v1 = (await axios.post(`${BASE_URL}/vehicles/user/${driver1.userId}`, {
      registrationNumber: 'KA-01-EV-1024',
      batteryCapacityKwh: 60.0,
      currentSoc: 22.0
    }, authHeaders)).data;

    const v2 = (await axios.post(`${BASE_URL}/vehicles/user/${driver1.userId}`, {
      registrationNumber: 'KA-05-EV-4412',
      batteryCapacityKwh: 40.5,
      currentSoc: 68.0
    }, authHeaders)).data;

    const v3 = (await axios.post(`${BASE_URL}/vehicles/user/${driver2.userId}`, {
      registrationNumber: 'MH-02-EV-7890',
      batteryCapacityKwh: 72.6,
      currentSoc: 14.0
    }, authHeaders)).data;

    const v4 = (await axios.post(`${BASE_URL}/vehicles/user/${driver3.userId}`, {
      registrationNumber: 'DL-03-EV-3341',
      batteryCapacityKwh: 50.3,
      currentSoc: 30.0
    }, authHeaders)).data;

    console.log(`✓ 4 Vehicles registered.`);

    // 3. Create Charging Sites
    console.log('3. Creating Charging Sites...');
    const s1 = (await axios.post(`${BASE_URL}/sites`, {
      siteName: 'Downtown Central Hub',
      location: 'Sector 4, Commercial District',
      maxCapacityKw: 180.0,
      warningThresholdPercent: 80.0
    }, authHeaders)).data;

    const s2 = (await axios.post(`${BASE_URL}/sites`, {
      siteName: 'Tech Park Metro Station',
      location: 'Electronic City Phase 1',
      maxCapacityKw: 120.0,
      warningThresholdPercent: 75.0
    }, authHeaders)).data;

    const s3 = (await axios.post(`${BASE_URL}/sites`, {
      siteName: 'Airport Expressway Terminal',
      location: 'Highway Exit 12B',
      maxCapacityKw: 250.0,
      warningThresholdPercent: 85.0
    }, authHeaders)).data;

    console.log(`✓ 3 Charging Sites created.`);

    // 4. Add Chargers to Sites
    console.log('4. Adding Chargers to Sites...');
    const c1 = (await axios.post(`${BASE_URL}/chargers/site/${s1.siteId}`, {
      chargerName: 'Bay-A1 (Ultra-Fast)',
      maxPowerKw: 60.0
    }, authHeaders)).data;

    const c2 = (await axios.post(`${BASE_URL}/chargers/site/${s1.siteId}`, {
      chargerName: 'Bay-A2 (Fast)',
      maxPowerKw: 50.0
    }, authHeaders)).data;

    const c3 = (await axios.post(`${BASE_URL}/chargers/site/${s1.siteId}`, {
      chargerName: 'Bay-A3 (Standard)',
      maxPowerKw: 30.0
    }, authHeaders)).data;

    const c4 = (await axios.post(`${BASE_URL}/chargers/site/${s1.siteId}`, {
      chargerName: 'Bay-A4 (Standard)',
      maxPowerKw: 30.0
    }, authHeaders)).data;

    // Site 2 Chargers
    const c5 = (await axios.post(`${BASE_URL}/chargers/site/${s2.siteId}`, {
      chargerName: 'Bay-B1 (Fast)',
      maxPowerKw: 50.0
    }, authHeaders)).data;

    const c6 = (await axios.post(`${BASE_URL}/chargers/site/${s2.siteId}`, {
      chargerName: 'Bay-B2 (Fast)',
      maxPowerKw: 50.0
    }, authHeaders)).data;

    // Site 3 Chargers
    await axios.post(`${BASE_URL}/chargers/site/${s3.siteId}`, {
      chargerName: 'Bay-C1 (HyperCharger)',
      maxPowerKw: 120.0
    }, authHeaders);

    await axios.post(`${BASE_URL}/chargers/site/${s3.siteId}`, {
      chargerName: 'Bay-C2 (Ultra-Fast)',
      maxPowerKw: 80.0
    }, authHeaders);

    console.log(`✓ 8 Chargers added across 3 sites.`);

    // Mark c6 on Site 2 as FAILED to demonstrate fault reporting
    await axios.patch(`${BASE_URL}/chargers/${c6.chargerId}/status`, { status: 'FAILED' }, authHeaders);
    console.log(`✓ Marked Charger #${c6.chargerId} (${c6.chargerName}) as FAILED.`);

    // 5. Submit Queue Requests
    console.log('5. Submitting EV Queue Requests...');
    const r1 = (await axios.post(`${BASE_URL}/requests`, {
      vehicleId: v1.vehicleId,
      siteId: s1.siteId,
      requestedEnergyKwh: 35.0
    }, authHeaders)).data;

    const r2 = (await axios.post(`${BASE_URL}/requests`, {
      vehicleId: v3.vehicleId,
      siteId: s1.siteId,
      requestedEnergyKwh: 50.0
    }, authHeaders)).data;

    const r3 = (await axios.post(`${BASE_URL}/requests`, {
      vehicleId: v4.vehicleId,
      siteId: s1.siteId,
      requestedEnergyKwh: 25.0
    }, authHeaders)).data;

    // A reservation for later today
    const reservationTime = new Date(Date.now() + 3 * 3600 * 1000).toISOString();
    await axios.post(`${BASE_URL}/requests`, {
      vehicleId: v2.vehicleId,
      siteId: s1.siteId,
      requestedEnergyKwh: 20.0,
      requestedTime: reservationTime
    }, authHeaders);

    console.log(`✓ 4 Charging Requests submitted (3 waiting, 1 reserved).`);

    // 6. Trigger Scheduling Algorithm on Site 1
    console.log('6. Executing Priority-Based Dispatch on Site 1...');
    const scheduleRes = (await axios.post(`${BASE_URL}/sites/${s1.siteId}/schedule`, {}, authHeaders)).data;
    console.log(`✓ Dispatch algorithm assigned: ${scheduleRes.scheduledSessionsCount} bays.`);

    // 7. Inspect Active Sessions and Start One
    console.log('7. Starting active charging session...');
    const activeSessions = (await axios.get(`${BASE_URL}/sessions/active`, authHeaders)).data;
    if (activeSessions.length > 0) {
      const targetSession = activeSessions[0];
      await axios.post(`${BASE_URL}/sessions/${targetSession.sessionId}/start`, {}, authHeaders);
      console.log(`✓ Started session #${targetSession.sessionId} for vehicle ${targetSession.vehicleRegistrationNumber}.`);

      // 8. Stream initial telemetry
      console.log('8. Sending initial telemetry...');
      await axios.post(`${BASE_URL}/telemetry`, {
        chargerId: c1.chargerId,
        sessionId: targetSession.sessionId,
        powerConsumptionKw: 58.4,
        energyKwh: 8.5,
        socPercent: 32.5,
        temperatureCelsius: 35.2,
        recordedAt: new Date().toISOString()
      });
      console.log(`✓ Telemetry recorded.`);
    }

    console.log('\n=== Database Seeding Completed Successfully! ===');
  } catch (err) {
    console.error('Seeding error:', err.response?.data || err.message);
  }
}

seed();

