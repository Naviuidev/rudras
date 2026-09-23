import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import ConfirmDialog from '../components/ConfirmDialog';
import CategoriesListModal from '../components/CategoriesListModal';
import CategoriesCreateModal from '../components/CategoriesCreateModal';
import { useToast } from '../context/ToastContext';
import { getCategories, createCategory, deleteCategory, uploadFile } from '../services/api';

interface Category {
  id: number;
  name: string;
  slug: string;
  image?: string | null;
  display_order?: number;
  created_at: string;
}

export default function CategoriesPage() {
  const { showToast } = useToast();
  const [categories, setCategories] = useState<Category[]>([]);
  const [showListModal, setShowListModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [name, setName] = useState('');
  const [image, setImage] = useState('');
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const loadCategories = () => {
    setPageLoading(true);
    getCategories()
      .then((res) => setCategories(res.data.data || []))
      .catch(() => setCategories([]))
      .finally(() => setPageLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadFile(file);
      setImage(res.data.data.url);
    } catch {
      showToast('Failed to upload image', 'error');
    }
  };

  const resetForm = () => {
    setName('');
    setImage('');
  };

  const closeCreateModal = () => {
    setShowCreateModal(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    try {
      await createCategory({ name: name.trim(), image: image || undefined });
      closeCreateModal();
      loadCategories();
      showToast('Category added successfully!');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || 'Failed to add category', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRequest = (category: Category) => {
    setDeleteTarget(category);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteCategory(deleteTarget.id);
      loadCategories();
      showToast('Category deleted successfully!');
      setDeleteTarget(null);
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || 'Failed to delete category', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <Layout title="Categories">
      <div className="categories-page">
        {pageLoading ? (
          <div className="categories-loading">
            <div className="spinner-border text-success" role="status" />
            <span>Loading categories…</span>
          </div>
        ) : (
          <div className="categories-tile-row">
            <button
              type="button"
              className="categories-tile"
              onClick={() => setShowListModal(true)}
            >
              <span className="categories-tile-label">Total Categories</span>
              <span className="categories-tile-count">{categories.length}</span>
            </button>

            <button
              type="button"
              className="categories-tile categories-tile--action"
              onClick={() => setShowCreateModal(true)}
            >
              <span className="categories-tile-label">Create Category</span>
            </button>
          </div>
        )}
      </div>

      <CategoriesListModal
        show={showListModal}
        onHide={() => setShowListModal(false)}
        categories={categories}
        onDelete={handleDeleteRequest}
      />

      <CategoriesCreateModal
        show={showCreateModal}
        onHide={closeCreateModal}
        name={name}
        image={image}
        loading={loading}
        onNameChange={setName}
        onImageUpload={handleImageUpload}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Category"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Categories with products cannot be deleted.`}
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
        loading={deleteLoading}
      />
    </Layout>
  );
}
