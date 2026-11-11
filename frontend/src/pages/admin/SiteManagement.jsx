import React, { useState, useEffect } from 'react';
import {
  Building2,
  Plus,
  Play,
  Edit2,
  Trash2,
  MapPin,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Check,
  ArrowLeft,
  Plug,
  Car,
  User,
  Clock,
  BatteryCharging,
  AlertOctagon,
  Wrench,
  ChevronRight
} from 'lucide-react';
import {
  getAllSites,
  createSite,
  updateSite,
  deleteSite,
  triggerScheduler
} from '../../api/sites';
import {
  getChargersBySite,
  addCharger,
  updateChargerStatus,
  deleteCharger
} from '../../api/chargers';
import {
  getActiveSessions,
  startSession,
  completeSession
} from '../../api/sessions';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import StatCard from '../../components/ui/StatCard';

export default function SiteManagement() {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected site for drill-down view
  const [selectedSite, setSelectedSite] = useState(null);
  const [chargers, setChargers] = useState([]);
  const [activeSessions, setActiveSessions] = useState([]);
  const [siteDetailsLoading, setSiteDetailsLoading] = useState(false);

  // Modals
  const [isSiteModalOpen, setIsSiteModalOpen] = useState(false);
  const [editingSite, setEditingSite] = useState(null);
  const [siteFormData, setSiteFormData] = useState({
    siteName: '',
    location: '',
    maxCapacityKw: '',
    warningThresholdPercent: '80.0'
  });

  const [isChargerModalOpen, setIsChargerModalOpen] = useState(false);
  const [chargerFormData, setChargerFormData] = useState({
    chargerName: '',
    maxPowerKw: '50.0'
  });

  const [actionLoading, setActionLoading] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState(null);

  // Fetch all sites
  const fetchSites = async () => {
    try {
      setLoading(true);
      const res = await getAllSites();
      const siteList = res.data || [];
      setSites(siteList);

      // If a site is currently selected, refresh its reference
      if (selectedSite) {
        const updated = siteList.find(s => s.siteId === selectedSite.siteId);
        if (updated) setSelectedSite(updated);
      }
    } catch (err) {
      console.error('Failed to load sites:', err);
      setError('Failed to fetch charging sites.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  // Auto-refresh selected site chargers & active sessions every 5 seconds
  useEffect(() => {
    if (!selectedSite) return;
    const interval = setInterval(() => {
      fetchSiteChargersAndSessions(selectedSite.siteId, false);
    }, 5000);
    return () => clearInterval(interval);
  }, [selectedSite?.siteId]);

  // Fetch chargers and active sessions when drill-down into a site
  const fetchSiteChargersAndSessions = async (siteId, isInitial = false) => {
    try {
      if (isInitial) setSiteDetailsLoading(true);
      const [chargersRes, sessionsRes] = await Promise.all([
        getChargersBySite(siteId),
        getActiveSessions()
      ]);
      setChargers(chargersRes.data || chargersRes || []);
      setActiveSessions(sessionsRes.data || sessionsRes || []);
    } catch (err) {
      console.error('Failed to load site chargers/sessions:', err);
    } finally {
      if (isInitial) setSiteDetailsLoading(false);
    }
  };

  const handleSelectSite = (site) => {
    setSelectedSite(site);
    fetchSiteChargersAndSessions(site.siteId, true);
  };

  const handleBackToSites = () => {
    setSelectedSite(null);
    setChargers([]);
    setActiveSessions([]);
    fetchSites();
  };

  // Site modal handlers
  const handleOpenAddSite = () => {
    setEditingSite(null);
    setSiteFormData({
      siteName: '',
      location: '',
      maxCapacityKw: '',
      warningThresholdPercent: '80.0'
    });
    setIsSiteModalOpen(true);
  };

  const handleOpenEditSite = (site, e) => {
    if (e) e.stopPropagation();
    setEditingSite(site);
    setSiteFormData({
      siteName: site.siteName,
      location: site.location || '',
      maxCapacityKw: site.maxCapacityKw,
      warningThresholdPercent: site.warningThresholdPercent || '80.0'
    });
    setIsSiteModalOpen(true);
  };

  const handleSiteSubmit = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const payload = {
        siteName: siteFormData.siteName,
        location: siteFormData.location,
        maxCapacityKw: parseFloat(siteFormData.maxCapacityKw),
        warningThresholdPercent: parseFloat(siteFormData.warningThresholdPercent)
      };

      if (editingSite) {
        await updateSite(editingSite.siteId, payload);
      } else {
        await createSite(payload);
      }
      setIsSiteModalOpen(false);
      fetchSites();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSite = async (siteId, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this charging site?')) {
      return;
    }
    try {
      await deleteSite(siteId);
      if (selectedSite && selectedSite.siteId === siteId) {
        handleBackToSites();
      } else {
        fetchSites();
      }
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Delete failed.');
    }
  };

  // Charger handlers
  const handleOpenAddCharger = () => {
    setChargerFormData({
      chargerName: `Bay-${chargers.length + 1} (Fast)`,
      maxPowerKw: '50.0'
    });
    setIsChargerModalOpen(true);
  };

  const handleChargerSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSite) return;
    setActionLoading(true);
    try {
      await addCharger(selectedSite.siteId, {
        chargerName: chargerFormData.chargerName,
        maxPowerKw: parseFloat(chargerFormData.maxPowerKw)
      });
      setIsChargerModalOpen(false);
      fetchSiteChargersAndSessions(selectedSite.siteId);
      fetchSites();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to add charger');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChargerStatusChange = async (chargerId, newStatus) => {
    try {
      await updateChargerStatus(chargerId, newStatus);
      if (selectedSite) fetchSiteChargersAndSessions(selectedSite.siteId);
      fetchSites();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to update charger status');
    }
  };

  const handleDeleteCharger = async (chargerId) => {
    if (!window.confirm('Are you sure you want to delete this charger hardware?')) return;
    try {
      await deleteCharger(chargerId);
      if (selectedSite) fetchSiteChargersAndSessions(selectedSite.siteId);
      fetchSites();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to delete charger');
    }
  };

  // Scheduler & session handlers
  const handleRunScheduler = async (siteId, siteName) => {
    try {
      const res = await triggerScheduler(siteId);
      const count = res.data?.scheduledSessionsCount ?? 0;
      setFeedbackMessage(`${count} vehicle session(s) scheduled for ${siteName}.`);
      if (selectedSite) fetchSiteChargersAndSessions(selectedSite.siteId);
      fetchSites();
      setTimeout(() => setFeedbackMessage(null), 5000);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Scheduler failed.');
    }
  };

  const handleStartSession = async (sessionId) => {
    try {
      await startSession(sessionId);
      if (selectedSite) fetchSiteChargersAndSessions(selectedSite.siteId);
      fetchSites();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to start session');
    }
  };

  const handleCompleteSession = async (sessionId) => {
    try {
      await completeSession(sessionId);
      if (selectedSite) fetchSiteChargersAndSessions(selectedSite.siteId);
      fetchSites();
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Failed to complete session');
    }
  };

  if (loading && sites.length === 0) return <LoadingSpinner />;
  if (error && sites.length === 0) return <div className="text-center py-12 text-[#C0392B]">{error}</div>;

  // ==========================================
  // VIEW 2: DRILL-DOWN INTO A SPECIFIC SITE
  // ==========================================
  if (selectedSite) {
    const currentDemand = parseFloat(selectedSite.currentDemandKw || 0);
    const maxCap = parseFloat(selectedSite.maxCapacityKw || 0);
    const utilPercent = parseFloat(selectedSite.capacityUtilizationPercent || 0);
    const warningThreshold = parseFloat(selectedSite.warningThresholdPercent || 80);
    const isWarning = utilPercent >= warningThreshold;

    const availableCount = chargers.filter(c => c.status === 'AVAILABLE').length;
    const takenCount = chargers.filter(c => c.status === 'CHARGING' || c.status === 'ASSIGNED').length;
    const failedCount = chargers.filter(c => c.status === 'FAILED').length;

    return (
      <div className="space-y-6">
        {/* Navigation / Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToSites}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#245C45] bg-[#E8F0EB] hover:bg-[#245C45] hover:text-white rounded-lg transition-colors shadow-sm"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              All Sites
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#252B28]">{selectedSite.siteName}</h1>
                {isWarning && (
                  <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    High Grid Load
                  </span>
                )}
              </div>
              <p className="text-xs text-[#747D77] flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                {selectedSite.location || 'Location unspecified'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleRunScheduler(selectedSite.siteId, selectedSite.siteName)}
              className="flex items-center gap-1.5 bg-[#245C45] hover:bg-[#1A4533] text-white px-3.5 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors"
            >
              <Play className="w-3.5 h-3.5" />
              Dispatch Queue
            </button>
            <button
              onClick={handleOpenAddCharger}
              className="flex items-center gap-1.5 border border-[#245C45] text-[#245C45] hover:bg-[#E8F0EB] px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Charger
            </button>
          </div>
        </div>

        {feedbackMessage && (
          <div className="p-3 bg-[#E8F0EB] border border-[#245C45]/20 text-[#245C45] rounded-lg text-xs flex items-center gap-2">
            <Check className="w-4 h-4" />
            {feedbackMessage}
          </div>
        )}

        {/* Clean, Compact Site Capacity Bar */}
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-3.5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex-1 max-w-md">
            <div className="flex justify-between text-xs text-[#747D77] mb-1">
              <span>Grid Load: <strong className="text-[#252B28]">{currentDemand.toFixed(1)} / {maxCap.toFixed(1)} kW</strong></span>
              <span className={`font-semibold ${isWarning ? 'text-amber-700' : 'text-[#245C45]'}`}>{utilPercent.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${utilPercent >= 80 ? 'bg-[#C0392B]' : utilPercent >= 60 ? 'bg-[#D4A843]' : 'bg-[#245C45]'}`}
                style={{ width: `${Math.min(utilPercent, 100)}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <span className="text-[#245C45] font-medium bg-[#E8F0EB] px-2.5 py-1 rounded-md">
              {availableCount} Available
            </span>
            <span className="text-blue-700 font-medium bg-blue-50 px-2.5 py-1 rounded-md">
              {takenCount} Charging
            </span>
            {failedCount > 0 && (
              <span className="text-red-700 font-medium bg-red-50 px-2.5 py-1 rounded-md">
                {failedCount} Outage
              </span>
            )}
          </div>
        </div>

        {/* Chargers Grid */}
        <div>
          {siteDetailsLoading ? (
            <LoadingSpinner />
          ) : chargers.length === 0 ? (
            <EmptyState
              icon={Plug}
              title="No Chargers Found"
              description="Add a charging bay to begin taking EV traffic."
              action={
                <button
                  onClick={handleOpenAddCharger}
                  className="bg-[#245C45] text-white px-3.5 py-2 rounded-lg text-xs font-semibold"
                >
                  Add Charger Now
                </button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {chargers.map((c) => {
                const session = activeSessions.find(
                  s => s.chargerName === c.chargerName || (s.chargerId && s.chargerId === c.chargerId)
                );
                const isTaken = c.status === 'CHARGING' || c.status === 'ASSIGNED' || !!session;
                const isFailed = c.status === 'FAILED';
                const isAvailable = c.status === 'AVAILABLE' && !session;

                return (
                  <div
                    key={c.chargerId}
                    className={`bg-white rounded-lg border p-4 shadow-sm flex flex-col justify-between transition-all ${
                      isFailed
                        ? 'border-red-200 bg-red-50/10'
                        : isTaken
                          ? 'border-blue-200 bg-blue-50/10'
                          : 'border-gray-200'
                    }`}
                  >
                    <div>
                      {/* Top Bar: Name, kW & Status Badge */}
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-bold text-sm text-[#252B28]">{c.chargerName}</h3>
                          <span className="text-[11px] text-[#747D77]">{parseFloat(c.maxPowerKw).toFixed(0)} kW max</span>
                        </div>
                        <StatusBadge status={isTaken && session ? session.status : c.status} />
                      </div>

                      {/* Content: Taken vs Available vs Failed */}
                      {isTaken && session ? (
                        <div className="mt-3 p-3 bg-blue-50/70 rounded-lg border border-blue-100 text-xs space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-[#747D77]">Vehicle:</span>
                            <strong className="font-mono text-xs text-[#252B28] bg-white px-1.5 py-0.5 rounded border border-blue-200">
                              {session.vehicleRegistrationNumber || 'N/A'}
                            </strong>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-[#747D77]">Driver:</span>
                            <span className="font-medium text-[#252B28]">{session.driverName || 'Driver'}</span>
                          </div>
                          <div className="flex items-center justify-between pt-1 border-t border-blue-100/60 text-[11px]">
                            <span className="text-[#747D77]">Power:</span>
                            <span className="font-mono text-[#252B28] font-semibold">{parseFloat(session.allocatedPowerKw || 0).toFixed(1)} kW</span>
                          </div>
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-[#747D77]">Energy:</span>
                            <span className="font-mono text-[#245C45] font-semibold">{parseFloat(session.energyDeliveredKwh || 0).toFixed(2)} kWh</span>
                          </div>
                        </div>
                      ) : isAvailable ? (
                        <div className="mt-3 py-2 px-3 bg-[#E8F0EB]/40 rounded-lg text-xs text-[#245C45] flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Ready for vehicle</span>
                        </div>
                      ) : isFailed ? (
                        <div className="mt-3 py-2 px-3 bg-red-50 rounded-lg text-xs text-red-700 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Unavailable / Out of Service</span>
                        </div>
                      ) : (
                        <div className="mt-3 py-2 px-3 bg-gray-50 rounded-lg text-xs text-[#747D77]">
                          Offline
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions */}
                    <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {isTaken && session && session.status === 'ASSIGNED' && (
                          <button
                            onClick={() => handleStartSession(session.sessionId)}
                            className="bg-[#245C45] hover:bg-[#1A4533] text-white px-2.5 py-1 rounded text-xs font-semibold"
                          >
                            Start
                          </button>
                        )}
                        {isTaken && session && session.status === 'CHARGING' && (
                          <button
                            onClick={() => handleCompleteSession(session.sessionId)}
                            className="bg-gray-100 hover:bg-gray-200 text-[#252B28] px-2.5 py-1 rounded text-xs font-semibold"
                          >
                            Complete
                          </button>
                        )}
                        {isAvailable && (
                          <button
                            onClick={() => handleChargerStatusChange(c.chargerId, 'FAILED')}
                            className="text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-2 py-1 rounded text-xs font-medium transition-colors"
                            title="Mark charger as failed / under maintenance"
                          >
                            Mark Unavailable
                          </button>
                        )}
                        {isFailed && (
                          <button
                            onClick={() => handleChargerStatusChange(c.chargerId, 'AVAILABLE')}
                            className="bg-[#E8F0EB] hover:bg-[#245C45] text-[#245C45] hover:text-white px-2.5 py-1 rounded text-xs font-semibold transition-colors"
                            title="Restore charger to available rotation"
                          >
                            Mark Available
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => handleDeleteCharger(c.chargerId)}
                        disabled={isTaken}
                        className="text-gray-400 hover:text-red-600 p-1 rounded disabled:opacity-20"
                        title="Delete charger"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal for Adding Charger */}
        <Modal
          isOpen={isChargerModalOpen}
          onClose={() => setIsChargerModalOpen(false)}
          title={`Add Charger to ${selectedSite.siteName}`}
        >
          <form onSubmit={handleChargerSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#252B28] mb-1">Charger Bay Name *</label>
              <input
                type="text"
                required
                value={chargerFormData.chargerName}
                onChange={(e) => setChargerFormData({ ...chargerFormData, chargerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45]/20 focus:border-[#245C45]"
                placeholder="e.g. Bay-A5 (Fast)"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#252B28] mb-1">Max Power Rating (kW) *</label>
              <input
                type="number"
                step="0.1"
                min="1"
                required
                value={chargerFormData.maxPowerKw}
                onChange={(e) => setChargerFormData({ ...chargerFormData, maxPowerKw: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45]/20 focus:border-[#245C45]"
                placeholder="50.0"
              />
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsChargerModalOpen(false)}
                className="px-4 py-2 border border-gray-200 text-[#747D77] hover:bg-gray-50 rounded-lg text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-4 py-2 bg-[#245C45] hover:bg-[#1A4533] text-white rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Adding...' : 'Add Charger'}
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  // ==========================================
  // VIEW 1: ALL SITES OVERVIEW GRID
  // ==========================================
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#252B28]">Charging Sites</h1>
          <p className="text-sm text-[#747D77] mt-1">
            Select a site to view its chargers and see which vehicle is currently charging.
          </p>
        </div>
        <button
          onClick={handleOpenAddSite}
          className="flex items-center gap-2 bg-[#245C45] hover:bg-[#1A4533] text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Site
        </button>
      </div>

      {feedbackMessage && (
        <div className="p-3 bg-[#E8F0EB] border border-[#245C45]/20 text-[#245C45] rounded-lg text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          {feedbackMessage}
        </div>
      )}

      {sites.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="No Charging Sites Found"
          description="Create your first location to get started."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {sites.map((site) => {
            const currentDemand = parseFloat(site.currentDemandKw || 0);
            const maxCap = parseFloat(site.maxCapacityKw || 0);
            const utilPercent = parseFloat(site.capacityUtilizationPercent || 0);
            const warningThreshold = parseFloat(site.warningThresholdPercent || 80);
            const isWarning = utilPercent >= warningThreshold;

            return (
              <div
                key={site.siteId}
                onClick={() => handleSelectSite(site)}
                className={`bg-white rounded-lg border shadow-sm p-5 flex flex-col justify-between transition-all cursor-pointer hover:shadow-md hover:border-[#245C45] group ${
                  isWarning ? 'border-amber-300' : 'border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-base font-bold text-[#252B28] group-hover:text-[#245C45] transition-colors flex items-center gap-1.5">
                        {site.siteName}
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#245C45] group-hover:translate-x-0.5 transition-all" />
                      </h3>
                      <p className="text-xs text-[#747D77] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        {site.location || 'Location unspecified'}
                      </p>
                    </div>
                    {isWarning && (
                      <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                        High Load
                      </span>
                    )}
                  </div>

                  {/* Clean Grid Load Bar */}
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="flex justify-between items-center text-xs text-[#747D77] mb-1">
                      <span>Load: <strong className="text-[#252B28]">{currentDemand.toFixed(0)} / {maxCap.toFixed(0)} kW</strong></span>
                      <span className={isWarning ? 'text-amber-700 font-semibold' : ''}>{utilPercent.toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          utilPercent >= 80 ? 'bg-[#C0392B]' : utilPercent >= 60 ? 'bg-[#D4A843]' : 'bg-[#245C45]'
                        }`}
                        style={{ width: `${Math.min(utilPercent, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Clean Charger Summary line */}
                  <div className="mt-3 text-xs text-[#747D77] flex items-center gap-2">
                    <Plug className="w-3.5 h-3.5 text-[#245C45]" />
                    <span>
                      <strong className="text-[#252B28]">{site.totalChargers || 0} Chargers</strong> ({site.availableChargers || 0} available, {site.chargingChargers || 0} in use)
                    </span>
                  </div>
                </div>

                {/* Edit / Delete Footer */}
                <div
                  className="mt-4 pt-2.5 border-t border-gray-100 flex items-center justify-between text-xs"
                  onClick={(e) => e.stopPropagation()}
                >
                  <span className="text-[#245C45] font-semibold group-hover:underline">
                    View Chargers →
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleOpenEditSite(site, e)}
                      className="p-1 text-gray-400 hover:text-[#252B28] rounded"
                      title="Edit site"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteSite(site.siteId, e)}
                      className="p-1 text-gray-400 hover:text-red-600 rounded"
                      title="Delete site"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Add / Edit Site */}
      <Modal
        isOpen={isSiteModalOpen}
        onClose={() => setIsSiteModalOpen(false)}
        title={editingSite ? 'Edit Charging Site' : 'Add New Charging Site'}
      >
        <form onSubmit={handleSiteSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#252B28] mb-1">Site Name *</label>
            <input
              type="text"
              required
              value={siteFormData.siteName}
              onChange={(e) => setSiteFormData({ ...siteFormData, siteName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45]/20 focus:border-[#245C45]"
              placeholder="e.g. Downtown Central Hub"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#252B28] mb-1">Physical Location</label>
            <input
              type="text"
              value={siteFormData.location}
              onChange={(e) => setSiteFormData({ ...siteFormData, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45]/20 focus:border-[#245C45]"
              placeholder="e.g. Sector 4, Commercial District"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#252B28] mb-1">Max Capacity (kW) *</label>
              <input
                type="number"
                step="0.1"
                min="1"
                required
                value={siteFormData.maxCapacityKw}
                onChange={(e) => setSiteFormData({ ...siteFormData, maxCapacityKw: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45]/20 focus:border-[#245C45]"
                placeholder="e.g. 150.0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#252B28] mb-1">Warning Threshold (%)</label>
              <input
                type="number"
                step="1"
                min="10"
                max="100"
                required
                value={siteFormData.warningThresholdPercent}
                onChange={(e) => setSiteFormData({ ...siteFormData, warningThresholdPercent: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#245C45]/20 focus:border-[#245C45]"
                placeholder="80.0"
              />
            </div>
          </div>

          <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsSiteModalOpen(false)}
              className="px-4 py-2 border border-gray-200 text-[#747D77] hover:bg-gray-50 rounded-lg text-sm font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={actionLoading}
              className="px-4 py-2 bg-[#245C45] hover:bg-[#1A4533] text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              {actionLoading ? 'Saving...' : editingSite ? 'Update Site' : 'Create Site'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
