import React, { useState, useEffect } from 'react';
import { History } from 'lucide-react';
import { getRequestsByUser } from '../../api/requests';
import { useAuth } from '../../context/AuthContext';
import DataTable from '../../components/ui/DataTable';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const ChargingHistory = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        setLoading(true);
        const res = await getRequestsByUser(user.userId);
        const allRequests = res.data || [];
        // Filter for completed/interrupted/cancelled requests
        const history = allRequests.filter((r) =>
          ['COMPLETED', 'INTERRUPTED', 'CANCELLED', 'REJECTED'].includes(
            r.status?.toUpperCase()
          )
        );
        setRequests(history);
      } catch (err) {
        setError('Failed to load charging history.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [user.userId]);

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

  const columns = [
    {
      header: 'Vehicle',
      accessor: 'vehicleRegistrationNumber',
      cell: (row) => (
        <span className="text-sm font-medium text-[#252B28]">
          {row.vehicleRegistrationNumber}
        </span>
      ),
    },
    {
      header: 'Site',
      accessor: 'siteName',
      cell: (row) => (
        <span className="text-sm text-[#252B28]">{row.siteName}</span>
      ),
    },
    {
      header: 'Requested Energy',
      accessor: 'requestedEnergyKwh',
      cell: (row) => (
        <span className="text-sm text-[#252B28]">
          {parseFloat(row.requestedEnergyKwh).toFixed(1)} kWh
        </span>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: (row) => <StatusBadge status={row.status} />,
    },
    {
      header: 'Joined At',
      accessor: 'joinedAt',
      cell: (row) => (
        <span className="text-sm text-[#747D77]">
          {formatDateTime(row.joinedAt)}
        </span>
      ),
    },
  ];

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-12 text-[#C0392B]">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#252B28]">Charging History</h1>
        <p className="text-sm text-[#747D77] mt-1">
          View your past charging sessions and requests.
        </p>
      </div>

      {requests.length === 0 ? (
        <EmptyState
          icon={History}
          title="No Charging History"
          description="Your completed and past charging requests will appear here."
        />
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
          <DataTable columns={columns} data={requests} />
        </div>
      )}
    </div>
  );
};

export default ChargingHistory;
