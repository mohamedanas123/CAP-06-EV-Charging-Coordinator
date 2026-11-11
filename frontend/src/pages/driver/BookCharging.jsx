import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Zap, Car, MapPin, Battery, Clock, CheckCircle } from 'lucide-react';
import { getUserVehicles } from '../../api/vehicles';
import { getAllSites } from '../../api/sites';
import { createRequest } from '../../api/requests';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const BookCharging = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedSiteId = searchParams.get('siteId');

  const [vehicles, setVehicles] = useState([]);
  const [sites, setSites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    vehicleId: '',
    siteId: preselectedSiteId || '',
    requestedEnergyKwh: '',
    requestedTime: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [vehiclesRes, sitesRes] = await Promise.all([
          getUserVehicles(user.userId),
          getAllSites(),
        ]);
        setVehicles(vehiclesRes.data || []);
        setSites(sitesRes.data || []);
      } catch (err) {
        setError('Failed to load data.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user.userId]);

  const selectedVehicle = vehicles.find(
    (v) => String(v.vehicleId) === String(formData.vehicleId)
  );
  const selectedSite = sites.find(
    (s) => String(s.siteId) === String(formData.siteId)
  );

  const maxEnergy = selectedVehicle
    ? parseFloat(selectedVehicle.batteryCapacityKwh)
    : 0;

  const isReservation = formData.requestedTime.trim() !== '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!formData.vehicleId) {
      setError('Please select a vehicle.');
      return;
    }
    if (!formData.siteId) {
      setError('Please select a charging site.');
      return;
    }
    const energy = parseFloat(formData.requestedEnergyKwh);
    if (isNaN(energy) || energy <= 0) {
      setError('Please enter a valid energy amount.');
      return;
    }
    if (maxEnergy > 0 && energy > maxEnergy) {
      setError(`Energy cannot exceed vehicle battery capacity (${maxEnergy.toFixed(1)} kWh).`);
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        vehicleId: parseInt(formData.vehicleId),
        siteId: parseInt(formData.siteId),
        requestedEnergyKwh: energy,
      };
      if (isReservation) {
        payload.requestedTime = formData.requestedTime;
      }

      await createRequest(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate('/driver/queue');
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message || 'Failed to submit charging request.'
      );
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  if (success) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-[#E8F0EB] flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-[#245C45]" />
          </div>
          <h2 className="text-lg font-semibold text-[#252B28]">
            {isReservation ? 'Reservation Created!' : 'Joined Queue Successfully!'}
          </h2>
          <p className="text-sm text-[#747D77]">Redirecting to your queue...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-[#252B28]">Book Charging</h1>
        <p className="text-sm text-[#747D77] mt-1">
          Select your vehicle and preferred charging site to join the queue.
        </p>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#FDF0EF] text-[#C0392B] text-sm">{error}</div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Select Vehicle */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Car className="w-5 h-5 text-[#245C45]" />
            <h2 className="text-base font-semibold text-[#252B28]">Select Vehicle</h2>
          </div>
          <select
            value={formData.vehicleId}
            onChange={(e) =>
              setFormData({ ...formData, vehicleId: e.target.value, requestedEnergyKwh: '' })
            }
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-[#252B28] bg-white focus:outline-none focus:ring-2 focus:ring-[#245C45] focus:border-transparent"
          >
            <option value="">Choose a vehicle...</option>
            {vehicles.map((v) => (
              <option key={v.vehicleId} value={v.vehicleId}>
                {v.registrationNumber} — {parseFloat(v.batteryCapacityKwh).toFixed(1)} kWh (SOC: {parseFloat(v.currentSoc).toFixed(0)}%)
              </option>
            ))}
          </select>
          {selectedVehicle && (
            <div className="mt-3 flex items-center gap-4 p-3 rounded-lg bg-[#F7F8F6]">
              <div className="flex items-center gap-1.5">
                <Battery className="w-4 h-4 text-[#245C45]" />
                <span className="text-sm text-[#252B28]">
                  {parseFloat(selectedVehicle.batteryCapacityKwh).toFixed(1)} kWh
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-[#245C45]" />
                <span className="text-sm text-[#252B28]">
                  SOC: {parseFloat(selectedVehicle.currentSoc).toFixed(0)}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Select Site */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="w-5 h-5 text-[#245C45]" />
            <h2 className="text-base font-semibold text-[#252B28]">Select Charging Site</h2>
          </div>
          <select
            value={formData.siteId}
            onChange={(e) => setFormData({ ...formData, siteId: e.target.value })}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-[#252B28] bg-white focus:outline-none focus:ring-2 focus:ring-[#245C45] focus:border-transparent"
          >
            <option value="">Choose a charging site...</option>
            {sites.map((s) => (
              <option key={s.siteId} value={s.siteId}>
                {s.siteName} — {s.availableChargers}/{s.totalChargers} available
              </option>
            ))}
          </select>
          {selectedSite && (
            <div className="mt-3 flex items-center gap-4 p-3 rounded-lg bg-[#F7F8F6]">
              <div>
                <p className="text-sm font-medium text-[#252B28]">{selectedSite.location}</p>
                <p className="text-xs text-[#747D77]">
                  {selectedSite.availableChargers} chargers available •{' '}
                  {parseFloat(selectedSite.capacityUtilizationPercent).toFixed(0)}% utilized
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Energy */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-5 h-5 text-[#245C45]" />
            <h2 className="text-base font-semibold text-[#252B28]">Required Energy</h2>
          </div>
          <div className="relative">
            <input
              type="number"
              step="0.1"
              min="0.1"
              max={maxEnergy > 0 ? maxEnergy : undefined}
              value={formData.requestedEnergyKwh}
              onChange={(e) =>
                setFormData({ ...formData, requestedEnergyKwh: e.target.value })
              }
              className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-[#252B28] focus:outline-none focus:ring-2 focus:ring-[#245C45] focus:border-transparent pr-16"
              placeholder="Enter energy required"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#747D77]">
              kWh
            </span>
          </div>
          {maxEnergy > 0 && (
            <p className="mt-1.5 text-xs text-[#747D77]">
              Maximum: {maxEnergy.toFixed(1)} kWh (vehicle battery capacity)
            </p>
          )}
        </div>

        {/* Preferred Time */}
        <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-5 h-5 text-[#245C45]" />
            <h2 className="text-base font-semibold text-[#252B28]">
              Preferred Time{' '}
              <span className="text-xs font-normal text-[#747D77]">(optional)</span>
            </h2>
          </div>
          <p className="text-xs text-[#747D77] mb-3">
            Leave empty to join the queue immediately, or pick a time to reserve a slot.
          </p>
          <input
            type="datetime-local"
            value={formData.requestedTime}
            onChange={(e) =>
              setFormData({ ...formData, requestedTime: e.target.value })
            }
            className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm text-[#252B28] focus:outline-none focus:ring-2 focus:ring-[#245C45] focus:border-transparent"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-[#245C45] text-white text-sm font-medium rounded-lg hover:bg-[#1d4a37] transition-colors disabled:opacity-50"
        >
          <Zap className="w-4 h-4" />
          {submitting
            ? 'Submitting...'
            : isReservation
            ? 'Reserve Slot'
            : 'Join Queue'}
        </button>
      </form>
    </div>
  );
};

export default BookCharging;
