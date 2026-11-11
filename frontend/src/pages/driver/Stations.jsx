import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Zap, AlertTriangle, ChevronRight } from 'lucide-react';
import { getAllSites } from '../../api/sites';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const Stations = () => {
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        setLoading(true);
        const res = await getAllSites();
        setSites(res.data || []);
      } catch (err) {
        setError('Failed to load charging stations.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchSites();
  }, []);

  const getUtilizationColor = (percent) => {
    const val = parseFloat(percent);
    if (val >= 80) return 'bg-[#C0392B]';
    if (val >= 60) return 'bg-[#D4A843]';
    return 'bg-[#245C45]';
  };

  const getUtilizationTextColor = (percent) => {
    const val = parseFloat(percent);
    if (val >= 80) return 'text-[#C0392B]';
    if (val >= 60) return 'text-[#D4A843]';
    return 'text-[#245C45]';
  };

  if (loading) return <LoadingSpinner />;
  if (error) return <div className="text-center py-12 text-[#C0392B]">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#252B28]">Charging Stations</h1>
        <p className="text-sm text-[#747D77] mt-1">
          Browse available charging sites and book a charger.
        </p>
      </div>

      {sites.length === 0 ? (
        <EmptyState
          icon={MapPin}
          title="No Stations Available"
          description="There are no charging stations available at the moment."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sites.map((site) => {
            const utilization = parseFloat(site.capacityUtilizationPercent);
            const isWarning = utilization >= parseFloat(site.warningThresholdPercent);

            return (
              <div
                key={site.siteId}
                className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[#E8F0EB] flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-[#245C45]" />
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-[#252B28]">
                          {site.siteName}
                        </h3>
                        <p className="text-xs text-[#747D77] mt-0.5">{site.location}</p>
                      </div>
                    </div>
                    {isWarning && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-[#FFF8E7] text-[#D4A843]">
                        <AlertTriangle className="w-3 h-3" />
                        <span className="text-xs font-medium">High Load</span>
                      </div>
                    )}
                  </div>

                  {/* Available Chargers */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-[#747D77]">Available Chargers</span>
                      <span className="text-sm font-medium text-[#252B28]">
                        {site.availableChargers} / {site.totalChargers}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#245C45] rounded-full transition-all"
                        style={{
                          width: site.totalChargers > 0
                            ? `${(site.availableChargers / site.totalChargers) * 100}%`
                            : '0%',
                        }}
                      />
                    </div>
                  </div>

                  {/* Current Demand */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-[#747D77]">Current Demand</span>
                      <span className="text-sm font-medium text-[#252B28]">
                        {parseFloat(site.currentDemandKw).toFixed(1)} /{' '}
                        {parseFloat(site.maxCapacityKw).toFixed(1)} kW
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${getUtilizationColor(
                          site.capacityUtilizationPercent
                        )}`}
                        style={{ width: `${Math.min(utilization, 100)}%` }}
                      />
                    </div>
                    <p
                      className={`text-xs mt-1 font-medium ${getUtilizationTextColor(
                        site.capacityUtilizationPercent
                      )}`}
                    >
                      {utilization.toFixed(1)}% capacity
                    </p>
                  </div>

                  {/* Charger Stats */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100">
                    <div className="text-center">
                      <p className="text-xs text-[#747D77]">Charging</p>
                      <p className="text-sm font-medium text-[#245C45]">
                        {site.chargingChargers}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[#747D77]">Available</p>
                      <p className="text-sm font-medium text-[#252B28]">
                        {site.availableChargers}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-[#747D77]">Failed</p>
                      <p className="text-sm font-medium text-[#C0392B]">
                        {site.failedChargers}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Book Button */}
                <Link
                  to={`/driver/book?siteId=${site.siteId}`}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#245C45] text-white text-sm font-medium rounded-lg hover:bg-[#1d4a37] transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Book Charger
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Stations;
