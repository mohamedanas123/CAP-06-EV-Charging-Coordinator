import React, { useState, useEffect } from 'react';
import { Car, Plus, Edit, Trash2, Battery } from 'lucide-react';
import { getUserVehicles, addVehicle, updateVehicle, deleteVehicle } from '../../api/vehicles';
import { useAuth } from '../../context/AuthContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';
import Modal from '../../components/ui/Modal';

const Vehicles = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    batteryCapacityKwh: '',
    currentSoc: '',
  });

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      const res = await getUserVehicles(user.userId);
      setVehicles(res.data || []);
    } catch (err) {
      setError('Failed to load vehicles.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, [user.userId]);

  const openAddModal = () => {
    setEditingVehicle(null);
    setFormData({ registrationNumber: '', batteryCapacityKwh: '', currentSoc: '' });
    setFormError(null);
    setModalOpen(true);
  };

  const openEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      registrationNumber: vehicle.registrationNumber,
      batteryCapacityKwh: String(vehicle.batteryCapacityKwh),
      currentSoc: String(vehicle.currentSoc),
    });
    setFormError(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingVehicle(null);
    setFormError(null);
  };

  const validateForm = () => {
    if (!formData.registrationNumber.trim()) {
      setFormError('Registration number is required.');
      return false;
    }
    const capacity = parseFloat(formData.batteryCapacityKwh);
    if (isNaN(capacity) || capacity <= 0) {
      setFormError('Battery capacity must be greater than 0.');
      return false;
    }
    const soc = parseFloat(formData.currentSoc);
    if (isNaN(soc) || soc < 0 || soc > 100) {
      setFormError('Current SOC must be between 0 and 100.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setFormError(null);
      const payload = {
        registrationNumber: formData.registrationNumber.trim(),
        batteryCapacityKwh: parseFloat(formData.batteryCapacityKwh),
        currentSoc: parseFloat(formData.currentSoc),
      };

      if (editingVehicle) {
        await updateVehicle(editingVehicle.vehicleId, payload);
      } else {
        await addVehicle(user.userId, payload);
      }

      closeModal();
      await fetchVehicles();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to save vehicle.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    try {
      setSubmitting(true);
      await deleteVehicle(vehicleId);
      setDeleteConfirm(null);
      await fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete vehicle.');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const getSocBarColor = (soc) => {
    const val = parseFloat(soc);
    if (val > 50) return 'bg-[#245C45]';
    if (val >= 20) return 'bg-[#D4A843]';
    return 'bg-[#C0392B]';
  };

  const getSocTextColor = (soc) => {
    const val = parseFloat(soc);
    if (val > 50) return 'text-[#245C45]';
    if (val >= 20) return 'text-[#D4A843]';
    return 'text-[#C0392B]';
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-[#252B28]">My Vehicles</h1>
          <p className="text-sm text-[#747D77] mt-1">
            Manage your registered electric vehicles.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#245C45] text-white text-sm font-medium rounded-lg hover:bg-[#1d4a37] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Vehicle
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-[#FDF0EF] text-[#C0392B] text-sm">{error}</div>
      )}

      {vehicles.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No Vehicles"
          description="You haven't registered any vehicles yet. Add your first vehicle to start booking chargers."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => {
            const soc = parseFloat(vehicle.currentSoc);
            return (
              <div
                key={vehicle.vehicleId}
                className="bg-white rounded-lg border border-gray-200 shadow-sm p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#E8F0EB] flex items-center justify-center">
                      <Car className="w-5 h-5 text-[#245C45]" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-[#252B28]">
                        {vehicle.registrationNumber}
                      </h3>
                      <p className="text-xs text-[#747D77]">
                        {parseFloat(vehicle.batteryCapacityKwh).toFixed(1)} kWh battery
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEditModal(vehicle)}
                      className="p-1.5 rounded-md hover:bg-gray-100 text-[#747D77] hover:text-[#252B28] transition-colors"
                      title="Edit"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(vehicle)}
                      className="p-1.5 rounded-md hover:bg-[#FDF0EF] text-[#747D77] hover:text-[#C0392B] transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Battery SOC bar */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-[#747D77] flex items-center gap-1">
                      <Battery className="w-3.5 h-3.5" /> Current SOC
                    </span>
                    <span className={`text-sm font-semibold ${getSocTextColor(vehicle.currentSoc)}`}>
                      {soc.toFixed(0)}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${getSocBarColor(
                        vehicle.currentSoc
                      )}`}
                      style={{ width: `${Math.min(soc, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={closeModal}
        title={editingVehicle ? 'Edit Vehicle' : 'Add Vehicle'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-[#FDF0EF] text-[#C0392B] text-sm">
              {formError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[#252B28] mb-1">
              Registration Number <span className="text-[#C0392B]">*</span>
            </label>
            <input
              type="text"
              value={formData.registrationNumber}
              onChange={(e) =>
                setFormData({ ...formData, registrationNumber: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#252B28] focus:outline-none focus:ring-2 focus:ring-[#245C45] focus:border-transparent"
              placeholder="e.g., ABC-1234"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#252B28] mb-1">
              Battery Capacity (kWh) <span className="text-[#C0392B]">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0.1"
              value={formData.batteryCapacityKwh}
              onChange={(e) =>
                setFormData({ ...formData, batteryCapacityKwh: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#252B28] focus:outline-none focus:ring-2 focus:ring-[#245C45] focus:border-transparent"
              placeholder="e.g., 75"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#252B28] mb-1">
              Current SOC (%) <span className="text-[#C0392B]">*</span>
            </label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              value={formData.currentSoc}
              onChange={(e) =>
                setFormData({ ...formData, currentSoc: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-[#252B28] focus:outline-none focus:ring-2 focus:ring-[#245C45] focus:border-transparent"
              placeholder="e.g., 45"
            />
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-sm font-medium text-[#252B28] rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-[#245C45] text-white text-sm font-medium rounded-lg hover:bg-[#1d4a37] transition-colors disabled:opacity-50"
            >
              {submitting
                ? 'Saving...'
                : editingVehicle
                ? 'Update Vehicle'
                : 'Add Vehicle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Delete Vehicle"
      >
        <div className="space-y-4">
          <p className="text-sm text-[#747D77]">
            Are you sure you want to delete{' '}
            <span className="font-medium text-[#252B28]">
              {deleteConfirm?.registrationNumber}
            </span>
            ? This action cannot be undone.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDeleteConfirm(null)}
              className="flex-1 px-4 py-2.5 border border-gray-200 text-sm font-medium text-[#252B28] rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteConfirm.vehicleId)}
              disabled={submitting}
              className="flex-1 px-4 py-2.5 bg-[#C0392B] text-white text-sm font-medium rounded-lg hover:bg-[#a93226] transition-colors disabled:opacity-50"
            >
              {submitting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Vehicles;
