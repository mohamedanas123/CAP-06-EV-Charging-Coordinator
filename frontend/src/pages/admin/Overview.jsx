import React, { useState, useEffect } from 'react';
import { 
  Plug, 
  CheckCircle2, 
  BatteryCharging, 
  AlertTriangle, 
  ListOrdered, 
  Activity, 
  Zap, 
  Gauge, 
  CheckCheck, 
  AlertOctagon, 
  Hourglass, 
  Bell 
} from 'lucide-react';
import { getDashboardSummary, getDashboardAlerts } from '../../api/dashboard';
import StatCard from '../../components/ui/StatCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function Overview() {
  const [summary, setSummary] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [sumRes, alertRes] = await Promise.all([
        getDashboardSummary(),
        getDashboardAlerts()
      ]);
      setSummary(sumRes.data);
      setAlerts(alertRes.data || []);
    } catch (err) {
      console.error('Failed to load admin summary:', err);
      setError('Failed to fetch dashboard metrics. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, []);

  if (loading && !summary) return <LoadingSpinner />;
  if (error && !summary) return <div className="text-center py-12 text-[#C0392B]">{error}</div>;

  const totalChargers = summary?.totalChargers ?? 0;
  const availableChargers = summary?.availableChargers ?? 0;
  const chargingChargers = summary?.chargingChargers ?? 0;
  const failedChargers = summary?.failedChargers ?? 0;

  const waitingRequests = summary?.waitingRequests ?? 0;
  const activeSessions = summary?.activeSessions ?? 0;
  const currentDemand = parseFloat(summary?.currentDemandKw ?? 0).toFixed(1);
  const maxCapacity = parseFloat(summary?.maxCapacityKw ?? 0).toFixed(1);
  const utilization = parseFloat(summary?.capacityUtilizationPercent ?? 0).toFixed(1);

  const completedSessions = summary?.completedSessions ?? 0;
  const interruptedSessions = summary?.interruptedSessions ?? 0;
  const totalEnergy = parseFloat(summary?.totalEnergyDeliveredKwh ?? 0).toFixed(1);
  const avgWaitTime = parseFloat(summary?.averageWaitingTimeMinutes ?? 0).toFixed(0);

  return (
    <div className="space-y-6">
      {/* Top Header / Welcome */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252B28]">Grid & Charging Overview</h1>
          <p className="text-sm text-[#747D77] mt-1">
            Real-time telemetry and resource allocation across all registered charging sites.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="text-xs font-medium px-3 py-1.5 border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-[#252B28] shadow-sm"
        >
          Refresh Data
        </button>
      </div>

      {/* Row 1: Hardware Status */}
      <div>
        <h2 className="text-sm font-semibold text-[#747D77] uppercase tracking-wider mb-3">Charger Hardware Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Chargers"
            value={totalChargers}
            subtitle="Across all sites"
            icon={Plug}
          />
          <StatCard
            title="Available"
            value={availableChargers}
            subtitle="Ready for assignment"
            icon={CheckCircle2}
          />
          <StatCard
            title="Currently Charging"
            value={chargingChargers}
            subtitle="Delivering power"
            icon={BatteryCharging}
          />
          <StatCard
            title="Failed Chargers"
            value={failedChargers}
            subtitle="Hardware faults"
            icon={AlertTriangle}
            variant={failedChargers > 0 ? "error" : "default"}
          />
        </div>
      </div>

      {/* Row 2: Queue & Grid Status */}
      <div>
        <h2 className="text-sm font-semibold text-[#747D77] uppercase tracking-wider mb-3">Queue & Demand Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Waiting Requests"
            value={waitingRequests}
            subtitle="Vehicles in queue"
            icon={ListOrdered}
            variant={waitingRequests > 5 ? "warning" : "default"}
          />
          <StatCard
            title="Active Sessions"
            value={activeSessions}
            subtitle="Assigned or charging"
            icon={Activity}
          />
          <StatCard
            title="Current Demand"
            value={`${currentDemand} kW`}
            subtitle={`of ${maxCapacity} kW max`}
            icon={Zap}
          />
          <StatCard
            title="Capacity Utilization"
            value={`${utilization}%`}
            subtitle="Grid load threshold"
            icon={Gauge}
            variant={parseFloat(utilization) >= 80 ? "error" : parseFloat(utilization) >= 60 ? "warning" : "default"}
          />
        </div>
      </div>

      {/* Row 3: Performance & Energy Totals */}
      <div>
        <h2 className="text-sm font-semibold text-[#747D77] uppercase tracking-wider mb-3">Session Metrics & Energy</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Completed Sessions"
            value={completedSessions}
            subtitle="Successfully charged"
            icon={CheckCheck}
          />
          <StatCard
            title="Interrupted Sessions"
            value={interruptedSessions}
            subtitle="Hardware or safety cutoffs"
            icon={AlertOctagon}
            variant={interruptedSessions > 0 ? "warning" : "default"}
          />
          <StatCard
            title="Total Energy Delivered"
            value={`${totalEnergy} kWh`}
            subtitle="Historical throughput"
            icon={BatteryCharging}
          />
          <StatCard
            title="Average Wait Time"
            value={`${avgWaitTime} min`}
            subtitle="Queue turnaround"
            icon={Hourglass}
          />
        </div>
      </div>

      {/* Active System Alerts */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#252B28]" />
            <h2 className="text-lg font-semibold text-[#252B28]">Active Grid & Safety Alerts</h2>
          </div>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-gray-100 text-[#747D77] font-medium">
            {alerts.length} active
          </span>
        </div>

        {alerts.length === 0 ? (
          <div className="p-4 bg-[#E8F0EB]/50 border border-[#245C45]/20 rounded-lg text-sm text-[#245C45] flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#245C45]" />
            All charging sites operating within safe capacity and thermal parameters.
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, idx) => (
              <div
                key={idx}
                className={`p-4 rounded-lg border flex items-start gap-3 ${
                  alert.severity === 'HIGH'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-amber-50 border-amber-200 text-amber-800'
                }`}
              >
                <AlertTriangle className={`w-5 h-5 mt-0.5 shrink-0 ${
                  alert.severity === 'HIGH' ? 'text-red-600' : 'text-amber-600'
                }`} />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider">
                      {alert.alertType}
                    </span>
                    <span className="text-xs opacity-75">
                      {alert.createdAt ? new Date(alert.createdAt).toLocaleTimeString() : 'Just now'}
                    </span>
                  </div>
                  <p className="text-sm mt-1">{alert.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
