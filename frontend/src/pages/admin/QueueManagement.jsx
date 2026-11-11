import React, { useState, useEffect } from 'react';
import { 
  ListOrdered, 
  Play, 
  Clock, 
  Car, 
  Filter, 
  RefreshCw, 
  Check, 
  User, 
  Zap, 
  Ban 
} from 'lucide-react';
import { getAllRequests, cancelRequest } from '../../api/requests';
import { getAllSites, triggerScheduler } from '../../api/sites';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import StatCard from '../../components/ui/StatCard';

export default function QueueManagement() {
  const [requests, setRequests] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [selectedSiteFilter, setSelectedSiteFilter] = useState('ALL');
  const [statusTab, setStatusTab] = useState('WAITING');
  const [schedulingSiteId, setSchedulingSiteId] = useState(null);
  const [scheduleFeedback, setScheduleFeedback] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reqRes, siteRes] = await Promise.all([
        getAllRequests(),
        getAllSites()
      ]);
      setRequests(reqRes.data || reqRes || []);
      setSites(siteRes.data || siteRes || []);
    } catch (err) {
      console.error('Failed to load queue data:', err);
      setError('Failed to fetch queue requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 15000); // 15s polling
    return () => clearInterval(interval);
  }, []);

  const handleRunScheduler = async (siteId) => {
    if (!siteId) return;
    try {
      setSchedulingSiteId(siteId);
      const res = await triggerScheduler(siteId);
      const siteName = sites.find(s => String(s.siteId) === String(siteId))?.siteName || `Site #${siteId}`;
      setScheduleFeedback(`Successfully scheduled ${res.data?.scheduledSessionsCount ?? 0} request(s) for ${siteName}.`);
      fetchData();
      setTimeout(() => setScheduleFeedback(null), 5000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Scheduler failed');
    } finally {
      setSchedulingSiteId(null);
    }
  };

  const handleCancelRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to cancel this charging request?')) {
      return;
    }
    try {
      await cancelRequest(requestId);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to cancel request');
    }
  };

  if (loading && requests.length === 0) return <LoadingSpinner />;
  if (error && requests.length === 0) return <div className="text-center py-12 text-[#C0392B]">{error}</div>;

  // Compute counts
  const totalWaiting = requests.filter(r => r.status === 'WAITING').length;
  const totalReserved = requests.filter(r => r.status === 'RESERVED').length;
  const totalAssigned = requests.filter(r => r.status === 'ASSIGNED').length;
  const totalCompleted = requests.filter(r => r.status === 'COMPLETED').length;

  // Filter requests
  const filteredRequests = requests.filter(r => {
    const matchesSite = selectedSiteFilter === 'ALL' || String(r.siteId || '') === String(selectedSiteFilter) || (r.siteName && sites.find(s => String(s.siteId) === String(selectedSiteFilter))?.siteName === r.siteName);
    const matchesStatus = statusTab === 'ALL' || r.status === statusTab;
    return matchesSite && matchesStatus;
  });

  // Sort: For WAITING, sort by priorityScore descending, then joinedAt ascending
  const sortedRequests = [...filteredRequests].sort((a, b) => {
    if (a.status === 'WAITING' && b.status === 'WAITING') {
      const pA = parseFloat(a.priorityScore || 0);
      const pB = parseFloat(b.priorityScore || 0);
      if (pB !== pA) return pB - pA;
      return new Date(a.joinedAt) - new Date(b.joinedAt);
    }
    return new Date(b.joinedAt) - new Date(a.joinedAt);
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252B28]">Queue Management & Fair Dispatch</h1>
          <p className="text-sm text-[#747D77] mt-1">
            Priority-based scheduling algorithm view. Preserves queue wait times during bay reassignments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium border border-gray-200 bg-white hover:bg-gray-50 rounded-lg text-[#252B28] shadow-sm transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {scheduleFeedback && (
        <div className="p-3 bg-[#E8F0EB] border border-[#245C45]/20 text-[#245C45] rounded-lg text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          {scheduleFeedback}
        </div>
      )}

      {/* Top Stat Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Waiting Queue"
          value={totalWaiting}
          subtitle="Vehicles in line"
          icon={ListOrdered}
          variant={totalWaiting > 5 ? "warning" : "default"}
        />
        <StatCard
          title="Scheduled Reservations"
          value={totalReserved}
          subtitle="Time-slotted bookings"
          icon={Clock}
        />
        <StatCard
          title="Currently Assigned"
          value={totalAssigned}
          subtitle="Dispatched to chargers"
          icon={Zap}
        />
        <StatCard
          title="Fulfilled / Completed"
          value={totalCompleted}
          subtitle="Session finished"
          icon={Check}
        />
      </div>

      {/* Dispatch Controls & Filtering */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Status Tabs */}
        <div className="flex items-center overflow-x-auto space-x-1 pb-1 md:pb-0">
          {[
            { id: 'WAITING', label: `Waiting (${totalWaiting})` },
            { id: 'RESERVED', label: `Reserved (${totalReserved})` },
            { id: 'ASSIGNED', label: `Assigned (${totalAssigned})` },
            { id: 'COMPLETED', label: `Completed (${totalCompleted})` },
            { id: 'ALL', label: `All (${requests.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                statusTab === tab.id
                  ? 'bg-[#245C45] text-white shadow-sm'
                  : 'text-[#747D77] hover:bg-gray-100 hover:text-[#252B28]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Site Filter & Manual Dispatch Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-[#747D77]" />
            <span className="text-xs font-medium text-[#747D77]">Site:</span>
            <select
              value={selectedSiteFilter}
              onChange={(e) => setSelectedSiteFilter(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 bg-white text-[#252B28] focus:outline-none focus:border-[#245C45]"
            >
              <option value="ALL">All Hubs</option>
              {sites.map(s => (
                <option key={s.siteId} value={s.siteId}>{s.siteName}</option>
              ))}
            </select>
          </div>

          {selectedSiteFilter !== 'ALL' && (
            <button
              onClick={() => handleRunScheduler(selectedSiteFilter)}
              disabled={schedulingSiteId !== null}
              className="flex items-center gap-1 bg-[#245C45] hover:bg-[#1A4533] text-white text-xs px-3 py-1.5 rounded-lg font-medium transition-colors shadow-sm disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5" />
              {schedulingSiteId === selectedSiteFilter ? 'Scheduling...' : 'Run Dispatch on Site'}
            </button>
          )}
        </div>
      </div>

      {/* Queue Table */}
      {sortedRequests.length === 0 ? (
        <EmptyState
          icon={ListOrdered}
          title="No Requests in this View"
          description={`There are currently no requests with status '${statusTab}' matching the selected filters.`}
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-gray-100 text-xs text-[#747D77] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Queue Pos</th>
                  <th className="px-5 py-3">Driver / Contact</th>
                  <th className="px-5 py-3">Vehicle Plate</th>
                  <th className="px-5 py-3">Site Destination</th>
                  <th className="px-5 py-3">Energy Req</th>
                  <th className="px-5 py-3">Priority Score</th>
                  <th className="px-5 py-3">Wait Time</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedRequests.map((req) => {
                  const isWaiting = req.status === 'WAITING';
                  const priority = parseFloat(req.priorityScore || 0);

                  return (
                    <tr 
                      key={req.requestId}
                      className={`hover:bg-gray-50 transition-colors ${
                        isWaiting && req.queuePosition === 1 ? 'bg-[#E8F0EB]/30' : ''
                      }`}
                    >
                      <td className="px-5 py-3.5">
                        {req.queuePosition ? (
                          <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                            req.queuePosition === 1 
                              ? 'bg-[#245C45] text-white' 
                              : 'bg-gray-100 text-[#252B28]'
                          }`}>
                            #{req.queuePosition}
                          </span>
                        ) : (
                          <span className="text-xs text-[#747D77] font-mono">--</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-[#747D77]" />
                          <div>
                            <span className="font-semibold text-[#252B28] block">{req.driverName || 'Driver'}</span>
                            <span className="text-[11px] text-[#747D77]">Req #{req.requestId}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono font-medium text-xs bg-gray-100 px-2 py-1 rounded text-[#252B28]">
                          {req.vehicleRegistrationNumber || 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="text-sm font-medium text-[#252B28]">{req.siteName || 'Hub'}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-mono text-sm font-semibold text-[#252B28]">
                          {parseFloat(req.requestedEnergyKwh || 0).toFixed(1)} kWh
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                            priority > 50 
                              ? 'bg-amber-100 text-amber-800' 
                              : 'bg-gray-100 text-[#252B28]'
                          }`}>
                            {priority.toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="text-xs">
                          <span className="font-medium text-[#252B28]">{req.waitingTimeMinutes ?? 0} min</span>
                          {req.estimatedWaitingTimeMinutes && (
                            <span className="block text-[10px] text-[#747D77]">Est: ~{req.estimatedWaitingTimeMinutes}m</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <StatusBadge status={req.status} />
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        {(req.status === 'WAITING' || req.status === 'RESERVED') && (
                          <button
                            onClick={() => handleCancelRequest(req.requestId)}
                            className="p-1.5 text-gray-400 hover:text-[#C0392B] hover:bg-red-50 rounded transition-colors"
                            title="Cancel Request"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

