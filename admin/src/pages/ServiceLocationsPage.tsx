import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import ServiceLocationsListModal from '../components/ServiceLocationsListModal';
import ServiceLocationsCreateModal from '../components/ServiceLocationsCreateModal';
import { useToast } from '../context/ToastContext';
import {
  getServiceLocations,
  createServiceLocation,
  deleteServiceLocation,
} from '../services/api';

interface ServiceLocation {
  id: number;
  name: string;
  map_url: string;
  is_active?: number;
  display_order?: number;
  created_at: string;
}

export default function ServiceLocationsPage() {
  const { showToast } = useToast();
  const [locations, setLocations] = useState<ServiceLocation[]>([]);
  const [showListModal, setShowListModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [mapUrl, setMapUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<ServiceLocation | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadLocations = () => {
    setPageLoading(true);
    getServiceLocations()
      .then((res) => setLocations(res.data.data || []))
      .catch(() => setLocations([]))
      .finally(() => setPageLoading(false));
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const resetForm = () => {
    setName('');
    setMapUrl('');
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mapUrl.trim()) return;

    setLoading(true);
    try {
      await createServiceLocation({
        map_url: mapUrl.trim(),
        name: name.trim() || undefined,
      });
      closeCreateModal();
      loadLocations();
      showToast('Service location added successfully!');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || 'Failed to add service location', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteServiceLocation(deleteTarget.id);
      loadLocations();
      showToast('Service location deleted successfully!');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || 'Failed to delete service location', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Layout title="Service Map">
      <div className="categories-page">
        {pageLoading ? (
          <div className="categories-loading">
            <div className="spinner-border text-success" role="status" />
            <span>Loading service locations…</span>
          </div>
        ) : (
          <div className="categories-tile-row">
            <button
              type="button"
              className="categories-tile"
              onClick={() => setShowListModal(true)}
            >
              <span className="categories-tile-label">Service Locations</span>
              <span className="categories-tile-count">{locations.length}</span>
            </button>

            <button
              type="button"
              className="categories-tile categories-tile--action"
              onClick={() => setShowCreateModal(true)}
            >
              <span className="categories-tile-label">Add Service Location</span>
            </button>
          </div>
        )}
      </div>

      <ServiceLocationsListModal
        show={showListModal}
        onHide={() => setShowListModal(false)}
        locations={locations}
        onDelete={setDeleteTarget}
      />

      <ServiceLocationsCreateModal
        show={showCreateModal}
        onHide={closeCreateModal}
        name={name}
        mapUrl={mapUrl}
        loading={loading}
        onNameChange={setName}
        onMapUrlChange={setMapUrl}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Service Location"
        message={`Are you sure you want to delete "${deleteTarget?.name}"?`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </Layout>
  );
}
