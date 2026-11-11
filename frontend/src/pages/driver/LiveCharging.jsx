import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Battery, Thermometer, Activity, Clock, MapPin, Plus } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { getActiveSessions } from '../../api/sessions';
import { getRequestsByUser } from '../../api/requests';
import { getSessionTelemetry } from '../../api/telemetry';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const LiveCharging = () => {
  const { user } = useAuth();
  const [session, setSession] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);
  const [telemetry, setTelemetry] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSessionData = useCallback(async () => {
    try {
      // Get active sessions and find the one belonging to this user
      const [sessionsRes, requestsRes] = await Promise.all([
        getActiveSessions(),
        getRequestsByUser(user.userId),
      ]);

      const sessions = sessionsRes.data || [];
      const requests = requestsRes.data || [];

      // Find user's active request
      const userActiveRequest = requests.find(
        (r) => r.status === 'ASSIGNED' || r.status === 'CHARGING'
      );

      // Find matching session by driver name
      const userSession = sessions.find(
        (s) => s.driverName === user.name
      );

      setActiveRequest(userActiveRequest || null);
      setSession(userSession || null);

      // Fetch telemetry if we have a session
      if (userSession?.sessionId) {
        try {
          const telemetryRes = await getSessionTelemetry(userSession.sessionId);
          setTelemetry(telemetryRes.data || []);
        } catch (telErr) {
          console.error('Failed to fetch telemetry:', telErr);
        }
      }
    } catch (err) {
      setError('Failed to load charging session.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.userId, user.name]);

  useEffect(() => {
    fetchSessionData();
  }, [fetchSessionData]);

  // Auto-refresh every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchSessionData();
    }, 10000);
    return () => clearInterval(interval);
  }, [fetchSessionData]);

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatChartTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-12 text-[#C0392B]">{error}</div>;

  const hasActiveSession = session || activeRequest;

  if (!hasActiveSession) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-[#252B28]">Live Charging</h1>
          <p className="text-sm text-[#747D77] mt-1">
            Monitor your active charging session in real time.
          </p>
        </div>
        <EmptyState
          icon={Zap}
          title="No Active Charging Session"
          description="You don't have an active charging session right now. Book a charger to get started."
        />
        <div className="flex justify-center">
          <Link
            to="/driver/book"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#245C45] text-white text-sm font-medium rounded-lg hover:bg-[#1d4a37] transition-colors"
          >
            <Plus className="w-4 h-4" />
            Book Charging
          </Link>
        </div>
      </div>
    );
  }

  // Compute charging progress
  const energyDelivered = session
    ? parseFloat(session.energyDeliveredKwh || 0)
    : 0;
  const requestedEnergy = activeRequest
    ? parseFloat(activeRequest.requestedEnergyKwh || 0)
    : 0;
  const chargingProgress =
    requestedEnergy > 0
      ? Math.min((energyDelivered / requestedEnergy) * 100, 100)
      : 0;

  // Latest telemetry
  const latestTelemetry = telemetry.length > 0 ? telemetry[telemetry.length - 1] : null;

  // Chart data
  const chartData = telemetry.map((t) => ({
    time: formatChartTime(t.recordedAt),
    soc: parseFloat(t.socPercent || 0),
    power: parseFloat(t.powerConsumptionKw || 0),
  }));

  const currentStatus = session?.status || activeRequest?.status || 'ASSIGNED';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#252B28]">Live Charging</h1>
          <p className="text-sm text-[#747D77] mt-1">
            Monitor your active charging session in real time.
          </p>
        </div>
        <StatusBadge status={currentStatus} />
      </div>

      {/* Session Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {session && (
          <>
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-[#747D77]" />
                <span className="text-xs text-[#747D77]">Location</span>
              </div>
              <p className="text-sm font-semibold text-[#252B28]">
                {session.siteName}
              </p>
              <p className="text-xs text-[#747D77]">{session.chargerName}</p>
            </div>

            <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-[#747D77]" />
                <span className="text-xs text-[#747D77]">Allocated Power</span>
              </div>
              <p className="text-sm font-semibold text-[#252B28]">
                {parseFloat(session.allocatedPowerKw || 0).toFixed(1)} kW
              </p>
            </div>
          </>
        )}

        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
          <div className="flex items-center gap-2 mb-2">
            <Battery className="w-4 h-4 text-[#747D77]" />
            <span className="text-xs text-[#747D77]">Energy Delivered</span>
          </div>
          <p className="text-sm font-semibold text-[#252B28]">
            {energyDelivered.toFixed(1)} / {requestedEnergy.toFixed(1)} kWh
          </p>
        </div>

        {latestTelemetry && (
          <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Thermometer className="w-4 h-4 text-[#747D77]" />
              <span className="text-xs text-[#747D77]">Temperature</span>
            </div>
            <p className="text-sm font-semibold text-[#252B28]">
              {parseFloat(latestTelemetry.temperatureCelsius).toFixed(1)} °C
            </p>
          </div>
        )}
      </div>

      {/* Charging Progress */}
      <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#252B28] mb-4">Charging Progress</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#747D77]">Progress</span>
            <span className="text-sm font-semibold text-[#245C45]">
              {chargingProgress.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-4 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#245C45] rounded-full transition-all duration-500"
              style={{ width: `${chargingProgress}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-xs text-[#747D77]">
            <span>{energyDelivered.toFixed(1)} kWh delivered</span>
            <span>{requestedEnergy.toFixed(1)} kWh requested</span>
          </div>
        </div>

        {/* Live stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-gray-100">
          {latestTelemetry && (
            <>
              <div>
                <p className="text-xs text-[#747D77]">Current SOC</p>
                <p className="text-lg font-semibold text-[#245C45]">
                  {parseFloat(latestTelemetry.socPercent).toFixed(0)}%
                </p>
              </div>
              <div>
                <p className="text-xs text-[#747D77]">Charging Power</p>
                <p className="text-lg font-semibold text-[#252B28]">
                  {parseFloat(latestTelemetry.powerConsumptionKw).toFixed(1)} kW
                </p>
              </div>
              <div>
                <p className="text-xs text-[#747D77]">Energy (Telemetry)</p>
                <p className="text-lg font-semibold text-[#252B28]">
                  {parseFloat(latestTelemetry.energyKwh).toFixed(2)} kWh
                </p>
              </div>
              <div>
                <p className="text-xs text-[#747D77]">Temperature</p>
                <p className="text-lg font-semibold text-[#252B28]">
                  {parseFloat(latestTelemetry.temperatureCelsius).toFixed(1)} °C
                </p>
              </div>
            </>
          )}
          {session && (
            <div>
              <p className="text-xs text-[#747D77]">Session Started</p>
              <p className="text-sm font-medium text-[#252B28]">
                {formatTime(session.startTime)}
              </p>
            </div>
          )}
          {session?.currentSoc != null && !latestTelemetry && (
            <div>
              <p className="text-xs text-[#747D77]">Current SOC</p>
              <p className="text-lg font-semibold text-[#245C45]">
                {parseFloat(session.currentSoc).toFixed(0)}%
              </p>
            </div>
          )}
        </div>
      </div>

      {/* SOC Chart */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#252B28] mb-4">
            SOC Over Time
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12, fill: '#747D77' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: '#747D77' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                  unit="%"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [`${parseFloat(value).toFixed(1)}%`, 'SOC']}
                />
                <Line
                  type="monotone"
                  dataKey="soc"
                  stroke="#245C45"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#245C45' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Power Chart */}
      {chartData.length > 1 && (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#252B28] mb-4">
            Charging Power Over Time
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12, fill: '#747D77' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#747D77' }}
                  tickLine={false}
                  axisLine={{ stroke: '#E5E7EB' }}
                  unit=" kW"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value) => [
                    `${parseFloat(value).toFixed(1)} kW`,
                    'Power',
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="power"
                  stroke="#D4A843"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: '#D4A843' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Auto-refresh indicator */}
      <div className="flex items-center justify-center gap-2 text-xs text-[#747D77]">
        <Activity className="w-3 h-3 animate-pulse text-[#245C45]" />
        <span>Auto-refreshing every 10 seconds</span>
      </div>
    </div>
  );
};

export default LiveCharging;
