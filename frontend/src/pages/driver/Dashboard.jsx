import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Battery, Zap, Clock, Car, MapPin, ChevronRight, Activity } from 'lucide-react';
import { getUserVehicles } from '../../api/vehicles';
import { getAllSites } from '../../api/sites';
import { getRequestsByUser } from '../../api/requests';
import { useAuth } from '../../context/AuthContext';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const Dashboard = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [requests, setRequests] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vehiclesRes, requestsRes, sitesRes] = await Promise.all([
          getUserVehicles(user.userId),
          getRequestsByUser(user.userId),
          getAllSites(),
        ]);
        setVehicles(vehiclesRes.data || []);
        setRequests(requestsRes.data || []);
        setSites(sitesRes.data || []);
      } catch (err) {
        setError('Failed to load dashboard data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.userId]);

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-12 text-[#C0392B]">{error}</div>;

  const activeSessions = requests.filter(
    (r) => r.status === 'CHARGING' || r.status === 'ASSIGNED'
  );
  const waitingRequests = requests.filter(
    (r) => r.status === 'WAITING' || r.status === 'RESERVED'
  );
  const recentRequests = [...requests].slice(0, 5);
  const displayVehicles = vehicles.slice(0, 3);
  const nearbySites = sites.slice(0, 3);

  const getSocColor = (soc) => {
    const val = parseFloat(soc);
    if (val > 50) return 'text-[#245C45]';
    if (val >= 20) return 'text-[#D4A843]';
    return 'text-[#C0392B]';
  };

  const getSocBarColor = (soc) => {
    const val = parseFloat(soc);
    if (val > 50) return 'bg-[#245C45]';
    if (val >= 20) return 'bg-[#D4A843]';
    return 'bg-[#C0392B]';
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-semibold text-[#252B28]">
          Welcome back, {user.name}
        </h1>
        <p className="text-sm text-[#747D77] mt-1">
          Here's an overview of your charging activity.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <StatCard
          title="My Vehicles"
          value={vehicles.length}
          icon={Car}
          iconColor="#245C45"
          iconBg="#E8F0EB"
        />
        <StatCard
          title="Active Sessions"
          value={activeSessions.length}
          icon={Zap}
          iconColor="#245C45"
          iconBg="#E8F0EB"
        />
        <StatCard
          title="Waiting Requests"
          value={waitingRequests.length}
          icon={Clock}
          iconColor="#D4A843"
          iconBg="#FFF8E7"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* My Vehicles */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#252B28]">My Vehicles</h2>
            <Link
              to="/driver/vehicles"
              className="text-sm text-[#245C45] hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {displayVehicles.length === 0 ? (
            <EmptyState
              icon={Car}
              title="No Vehicles"
              description="Add your first vehicle to get started."
            />
          ) : (
            <div className="space-y-3">
              {displayVehicles.map((v) => (
                <div
                  key={v.vehicleId}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#F7F8F6] border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#E8F0EB] flex items-center justify-center">
                      <Car className="w-4 h-4 text-[#245C45]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#252B28]">
                        {v.registrationNumber}
                      </p>
                      <p className="text-xs text-[#747D77]">
                        {parseFloat(v.batteryCapacityKwh).toFixed(1)} kWh
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Battery className={`w-4 h-4 ${getSocColor(v.currentSoc)}`} />
                    <span className={`text-sm font-medium ${getSocColor(v.currentSoc)}`}>
                      {parseFloat(v.currentSoc).toFixed(0)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Active Session */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <h2 className="text-base font-semibold text-[#252B28] mb-4">Active Session</h2>
          {activeSessions.length === 0 ? (
            <EmptyState
              icon={Zap}
              title="No Active Charging Session"
              description="You don't have an active charging session right now."
            />
          ) : (
            <div className="space-y-3">
              {activeSessions.slice(0, 1).map((session) => (
                <div
                  key={session.requestId}
                  className="p-4 rounded-lg bg-[#F7F8F6] border border-gray-100 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-[#252B28]">
                      {session.vehicleRegistrationNumber}
                    </p>
                    <StatusBadge status={session.status} />
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-[#747D77]">Site</p>
                      <p className="font-medium text-[#252B28]">{session.siteName}</p>
                    </div>
                    <div>
                      <p className="text-[#747D77]">Requested Energy</p>
                      <p className="font-medium text-[#252B28]">
                        {parseFloat(session.requestedEnergyKwh).toFixed(1)} kWh
                      </p>
                    </div>
                    {session.queuePosition != null && (
                      <div>
                        <p className="text-[#747D77]">Queue Position</p>
                        <p className="font-medium text-[#252B28]">#{session.queuePosition}</p>
                      </div>
                    )}
                    {session.estimatedWaitingTimeMinutes != null && (
                      <div>
                        <p className="text-[#747D77]">Est. Wait</p>
                        <p className="font-medium text-[#252B28]">
                          {parseFloat(session.estimatedWaitingTimeMinutes).toFixed(0)} min
                        </p>
                      </div>
                    )}
                  </div>
                  <Link
                    to="/driver/charging"
                    className="inline-flex items-center gap-1 text-sm text-[#245C45] font-medium hover:underline"
                  >
                    View live session <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Two-column: Recent Activity + Nearby Stations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#252B28]">Recent Activity</h2>
            <Link
              to="/driver/queue"
              className="text-sm text-[#245C45] hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {recentRequests.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No Recent Activity"
              description="Your charging requests will appear here."
            />
          ) : (
            <div className="space-y-3">
              {recentRequests.map((req) => (
                <div
                  key={req.requestId}
                  className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#E8F0EB] flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-[#245C45]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#252B28]">{req.siteName}</p>
                      <p className="text-xs text-[#747D77]">{formatTime(req.joinedAt)}</p>
                    </div>
                  </div>
                  <StatusBadge status={req.status} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nearby Stations */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-[#252B28]">Nearby Stations</h2>
            <Link
              to="/driver/stations"
              className="text-sm text-[#245C45] hover:underline flex items-center gap-1"
            >
              View all <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {nearbySites.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No Stations Found"
              description="No charging stations are currently available."
            />
          ) : (
            <div className="space-y-3">
              {nearbySites.map((site) => (
                <div
                  key={site.siteId}
                  className="flex items-center justify-between p-3 rounded-lg bg-[#F7F8F6] border border-gray-100"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#E8F0EB] flex items-center justify-center">
                      <MapPin className="w-4 h-4 text-[#245C45]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#252B28]">{site.siteName}</p>
                      <p className="text-xs text-[#747D77]">{site.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-[#245C45]">
                      {site.availableChargers}/{site.totalChargers}
                    </p>
                    <p className="text-xs text-[#747D77]">available</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
