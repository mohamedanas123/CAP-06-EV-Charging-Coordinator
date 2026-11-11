import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Zap, XCircle, ChevronRight } from 'lucide-react';
import { getRequestsByUser, cancelRequest } from '../../api/requests';
import { useAuth } from '../../context/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

const TABS = ['All', 'Waiting', 'Reserved', 'Assigned', 'Completed', 'Cancelled'];

const MyQueue = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('All');
  const [cancelConfirm, setCancelConfirm] = useState(null);
  const [cancelling, setCancelling] = useState(false);

  const fetchRequests = useCallback(async () => {
    try {
      const res = await getRequestsByUser(user.userId);
      setRequests(res.data || []);
    } catch (err) {
      setError('Failed to load requests.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user.userId]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Auto-refresh every 15 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchRequests();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleCancel = async (requestId) => {
    try {
      setCancelling(true);
      await cancelRequest(requestId);
      setCancelConfirm(null);
      await fetchRequests();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel request.');
      console.error(err);
    } finally {
      setCancelling(false);
    }
  };

  const formatWaitTime = (minutes) => {
    if (minutes == null) return '—';
    const m = parseFloat(minutes);
    if (m < 60) return `${m.toFixed(0)} min`;
    const hrs = Math.floor(m / 60);
    const mins = Math.round(m % 60);
    return mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`;
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredRequests =
    activeTab === 'All'
      ? requests
      : requests.filter(
          (r) => r.status?.toUpperCase() === activeTab.toUpperCase()
        );

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#252B28]">My Queue</h1>
        <p className="text-sm text-[#747D77] mt-1">
          Track your charging requests and queue positions.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#FDF0EF] text-[#C0392B] text-sm">{error}</div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-gray-200">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-[#245C45] text-[#245C45]'
                : 'border-transparent text-[#747D77] hover:text-[#252B28]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Requests */}
      {filteredRequests.length === 0 ? (
        <EmptyState
          icon={Clock}
          title="No Requests"
          description={
            activeTab === 'All'
              ? 'You have no charging requests yet.'
              : `No ${activeTab.toLowerCase()} requests found.`
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredRequests.map((req) => {
            const isActive =
              req.status === 'WAITING' || req.status === 'RESERVED';
            const isAssigned = req.status === 'ASSIGNED' || req.status === 'CHARGING';

            return (
              <div
                key={req.requestId}
                className="bg-white rounded-lg border border-gray-200 shadow-sm p-5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    {/* Top row */}
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm font-semibold text-[#252B28]">
                        {req.vehicleRegistrationNumber}
                      </span>
                      <StatusBadge status={req.status} />
                      {req.queuePosition != null && req.status === 'WAITING' && (
                        <span className="text-xs bg-[#E8F0EB] text-[#245C45] px-2 py-0.5 rounded-full font-medium">
                          Position #{req.queuePosition}
                        </span>
                      )}
                    </div>

                    {/* Details grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div>
                        <p className="text-[#747D77] text-xs">Site</p>
                        <p className="font-medium text-[#252B28]">{req.siteName}</p>
                      </div>
                      <div>
                        <p className="text-[#747D77] text-xs">Energy</p>
                        <p className="font-medium text-[#252B28]">
                          {parseFloat(req.requestedEnergyKwh).toFixed(1)} kWh
                        </p>
                      </div>
                      <div>
                        <p className="text-[#747D77] text-xs">Waiting Time</p>
                        <p className="font-medium text-[#252B28]">
                          {formatWaitTime(req.waitingTimeMinutes)}
                        </p>
                      </div>
                      <div>
                        <p className="text-[#747D77] text-xs">Joined At</p>
                        <p className="font-medium text-[#252B28]">
                          {formatDateTime(req.joinedAt)}
                        </p>
                      </div>
                    </div>

                    {/* Extra details */}
                    <div className="flex items-center gap-4 text-xs text-[#747D77]">
                      {req.priorityScore != null && (
                        <span>
                          Priority Score:{' '}
                          <span className="font-medium text-[#252B28]">
                            {parseFloat(req.priorityScore).toFixed(1)}
                          </span>
                        </span>
                      )}
                      {req.estimatedWaitingTimeMinutes != null && (
                        <span>
                          Est. Wait:{' '}
                          <span className="font-medium text-[#252B28]">
                            {formatWaitTime(req.estimatedWaitingTimeMinutes)}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isActive && (
                      <button
                        onClick={() => setCancelConfirm(req)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 border border-gray-200 text-sm font-medium text-[#C0392B] rounded-lg hover:bg-[#FDF0EF] transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                        Cancel
                      </button>
                    )}
                    {isAssigned && (
                      <Link
                        to="/driver/charging"
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#245C45] text-white text-sm font-medium rounded-lg hover:bg-[#1d4a37] transition-colors"
                      >
                        <Zap className="w-4 h-4" />
                        View Session
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={!!cancelConfirm}
        onClose={() => setCancelConfirm(null)}
        title="Cancel Request"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#747D77]">
            Are you sure you want to cancel the charging request for{' '}
            <span className="font-medium text-[#252B28]">
              {cancelConfirm?.vehicleRegistrationNumber}
            </span>{' '}
            at{' '}
            <span className="font-medium text-[#252B28]">
              {cancelConfirm?.siteName}
            </span>
            ?
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCancelConfirm(null)}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-sm font-medium text-[#252B28] rounded-lg hover:bg-gray-50 transition-colors"
            >
              Keep Request
            </button>
            <button
              onClick={() => handleCancel(cancelConfirm.requestId)}
              disabled={cancelling}
              className="flex-1 px-4 py-2.5 bg-[#C0392B] text-white text-sm font-medium rounded-lg hover:bg-[#a93226] transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Cancelling...' : 'Cancel Request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default MyQueue;
