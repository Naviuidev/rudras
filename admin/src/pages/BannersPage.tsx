import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import BannerFormModal, { type BannerFormValues } from '../components/BannerFormModal';
import BannersListModal, { type BannerItem } from '../components/BannersListModal';
import { useToast } from '../context/ToastContext';
import { getBanners, createBanner, updateBanner, deleteBanner, uploadFile } from '../services/api';

const emptyForm: BannerFormValues = {
  title: '',
  image: '',
  sort_order: 0,
  is_active: 1,
};

export default function BannersPage() {
  const { showToast } = useToast();
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [form, setForm] = useState<BannerFormValues>(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<BannerItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const load = () => {
    setPageLoading(true);
    getBanners()
      .then((res) => setBanners(res.data.data || []))
      .catch(() => setBanners([]))
      .finally(() => setPageLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const openCreate = () => {
    resetForm();
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadFile(file);
      setForm((prev) => ({ ...prev, image: res.data.data.url }));
    } catch {
      showToast('Failed to upload image', 'error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.image.trim()) {
      showToast('Banner image is required', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...form,
        title: form.title.trim(),
      };
      if (editing) await updateBanner(editing, payload);
      else await createBanner(payload);
      closeForm();
      load();
      showToast(editing ? 'Banner updated!' : 'Banner added!');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || 'Failed to save banner', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (banner: BannerItem) => {
    setForm({
      title: banner.title || '',
      image: banner.image,
      sort_order: banner.sort_order ?? 0,
      is_active: banner.is_active ?? 1,
    });
    setEditing(banner.id);
    setShowListModal(false);
    setShowForm(true);
  };

  const handleDeleteRequest = (banner: BannerItem) => {
    setDeleteTarget(banner);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteBanner(deleteTarget.id);
      load();
      showToast('Banner deleted!');
      setDeleteTarget(null);
    } catch {
      showToast('Failed to delete banner', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const displayTitle = (title: string) => title.trim() || 'Untitled banner';

  return (
    <Layout title="Banner Management">
      <div className="banners-page">
        {pageLoading ? (
          <div className="categories-loading">
            <div className="spinner-border text-success" role="status" />
            <span>Loading banners…</span>
          </div>
        ) : (
          <div className="categories-tile-row">
            <button
              type="button"
              className="categories-tile"
              onClick={() => setShowListModal(true)}
            >
              <span className="categories-tile-label">Total Banners</span>
              <span className="categories-tile-count">{banners.length}</span>
            </button>

            <button type="button" className="categories-tile categories-tile--action" onClick={openCreate}>
              <span className="categories-tile-label">Add Banner</span>
            </button>
          </div>
        )}
      </div>

      <BannersListModal
        show={showListModal}
        onHide={() => setShowListModal(false)}
        banners={banners}
        onEdit={handleEdit}
        onDelete={handleDeleteRequest}
      />

      <BannerFormModal
        show={showForm}
        editing={Boolean(editing)}
        loading={loading}
        form={form}
        onHide={closeForm}
        onChange={(patch) => setForm((prev) => ({ ...prev, ...patch }))}
        onImageUpload={handleImageUpload}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Banner"
        message={`Are you sure you want to delete "${deleteTarget ? displayTitle(deleteTarget.title) : ''}"?`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </Layout>
  );
}
