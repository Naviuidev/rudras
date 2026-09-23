import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import BtnIcon from '../components/BtnIcon';
import ConfirmDialog from '../components/ConfirmDialog';
import { useToast } from '../context/ToastContext';
import { getFaqs, createFaq, updateFaq, deleteFaq } from '../services/api';

interface FaqRow {
  id: number;
  question: string;
  answer: string;
  display_order: number;
  is_active: number;
}

const emptyForm = {
  question: '',
  answer: '',
  display_order: 0,
  is_active: 1,
};

export default function FaqsPage() {
  const { showToast } = useToast();
  const [faqs, setFaqs] = useState<FaqRow[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<FaqRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const load = () => {
    setPageLoading(true);
    getFaqs()
      .then((res) => setFaqs(res.data.data || []))
      .catch(() => setFaqs([]))
      .finally(() => setPageLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
  };

  const closeModal = () => {
    setShowModal(false);
    resetForm();
  };

  const openCreate = () => {
    resetForm();
    setForm({
      ...emptyForm,
      display_order: faqs.length > 0 ? Math.max(...faqs.map((f) => f.display_order ?? 0)) + 1 : 1,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.question.trim() || !form.answer.trim()) {
      showToast('Question and answer are required', 'error');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        question: form.question.trim(),
        answer: form.answer.trim(),
        display_order: form.display_order,
        is_active: form.is_active,
      };
      if (editing) await updateFaq(editing, payload);
      else await createFaq(payload);
      closeModal();
      load();
      showToast(editing ? 'FAQ updated!' : 'FAQ added!');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || 'Failed to save FAQ', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (f: FaqRow) => {
    setForm({
      question: f.question,
      answer: f.answer,
      display_order: f.display_order ?? 0,
      is_active: f.is_active ?? 1,
    });
    setEditing(f.id);
    setShowModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await deleteFaq(deleteTarget.id);
      setDeleteTarget(null);
      load();
      showToast('FAQ deleted');
    } catch {
      showToast('Failed to delete FAQ', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const sortedFaqs = [...faqs].sort(
    (a, b) => (a.display_order ?? 0) - (b.display_order ?? 0) || a.id - b.id
  );

  return (
    <Layout title="FAQ">
      <div className="alert alert-light border mb-3 small">
        Add questions here — active items appear on the website footer and on the public FAQs page.
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3">
        <button type="button" className="btn btn-accent" onClick={openCreate}>
          <BtnIcon name="add" /> Add FAQ
        </button>
      </div>

      <div className="page-card">
        {pageLoading ? (
          <p className="text-muted mb-0">Loading FAQs…</p>
        ) : sortedFaqs.length === 0 ? (
          <p className="text-muted mb-0">No FAQs yet. Click &ldquo;Add FAQ&rdquo; to create your first one.</p>
        ) : (
          sortedFaqs.map((f) => (
            <div key={f.id} className="faq-item mb-3 pb-3 border-bottom">
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-2 mb-2">
                <h6 className="fw-semibold mb-0 flex-grow-1">{f.question}</h6>
                <div className="d-flex flex-wrap gap-1">
                  <span className={`badge ${f.is_active ? 'bg-success' : 'bg-secondary'}`}>
                    {f.is_active ? 'Active' : 'Hidden'}
                  </span>
                  <span className="badge bg-light text-dark border">Order: {f.display_order ?? 0}</span>
                </div>
              </div>
              <p className="text-muted mb-2">{f.answer}</p>
              <button type="button" className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(f)}>
                <BtnIcon name="edit" /> Edit
              </button>
              <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => setDeleteTarget(f)}>
                <BtnIcon name="delete" /> Delete
              </button>
            </div>
          ))
        )}
      </div>

      <Modal open={showModal} title={editing ? 'Edit FAQ' : 'Add FAQ'} onClose={closeModal}>
        <form onSubmit={handleSubmit}>
          <label className="form-label small fw-semibold">Question</label>
          <input
            className="form-control mb-3"
            placeholder="e.g. How does milk subscription work?"
            value={form.question}
            onChange={(e) => setForm({ ...form, question: e.target.value })}
            required
          />

          <label className="form-label small fw-semibold">Answer</label>
          <textarea
            className="form-control mb-3"
            rows={4}
            placeholder="Write the answer customers will see on the website"
            value={form.answer}
            onChange={(e) => setForm({ ...form, answer: e.target.value })}
            required
          />

          <div className="row g-3 mb-3">
            <div className="col-sm-6">
              <label className="form-label small fw-semibold">Display order</label>
              <input
                type="number"
                min={0}
                className="form-control"
                value={form.display_order}
                onChange={(e) => setForm({ ...form, display_order: +e.target.value })}
              />
              <div className="form-text">Lower numbers appear first on the website.</div>
            </div>
            <div className="col-sm-6">
              <label className="form-label small fw-semibold">Status</label>
              <select
                className="form-select"
                value={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: +e.target.value })}
              >
                <option value={1}>Active — show on website</option>
                <option value={0}>Hidden — keep in admin only</option>
              </select>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" className="btn btn-outline-secondary" onClick={closeModal}>
              <BtnIcon name="cancel" /> Cancel
            </button>
            <button type="submit" className="btn btn-accent" disabled={loading}>
              <BtnIcon name={loading ? 'wait' : 'submit'} /> {loading ? 'Saving…' : 'Save FAQ'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete FAQ"
        message={`Delete "${deleteTarget?.question}"? This removes it from the website.`}
        confirmText={deleteLoading ? 'Deleting…' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </Layout>
  );
}
