import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import BtnIcon from '../components/BtnIcon';
import { CONTENT_SLUGS } from '../config/adminNav';
import { getCmsPages, updateCmsPage } from '../services/api';
import { useToast } from '../context/ToastContext';

const PAGE_TITLES: Record<string, string> = {
  'about-us': 'About Us',
  'privacy-policy': 'Privacy Policy',
  terms: 'Terms & Conditions',
  faqs: 'FAQs',
};

export default function ContentPage() {
  const { slug = 'about-us' } = useParams<{ slug: string }>();
  const { showToast } = useToast();
  const cmsSlug = CONTENT_SLUGS[slug] || slug;
  const [page, setPage] = useState<any | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', content: '' });
  const [loading, setLoading] = useState(false);

  const load = () => {
    getCmsPages()
      .then((res) => {
        const found = (res.data.data || []).find((p: any) => p.slug === cmsSlug);
        setPage(found || null);
        if (found) setForm({ title: found.title, content: found.content });
      })
      .catch(() => setPage(null));
  };

  useEffect(() => {
    setEditing(false);
    load();
  }, [slug, cmsSlug]);

  const handleSave = async () => {
    if (!page) return;
    setLoading(true);
    try {
      await updateCmsPage(cmsSlug, form);
      setEditing(false);
      load();
      showToast('Content saved!');
    } catch {
      showToast('Failed to save content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const title = PAGE_TITLES[slug] || 'Content';

  return (
    <Layout title={title}>
      <div className="page-card">
        {!page ? (
          <p className="text-muted mb-0">
            No content found for this page yet. Add a CMS entry with slug <code>{cmsSlug}</code> in the database.
          </p>
        ) : editing ? (
          <>
            <input
              className="form-control mb-3"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
            />
            <textarea
              className="form-control mb-3"
              rows={12}
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
            />
            <button className="btn btn-accent me-2" onClick={handleSave} disabled={loading}>
              <BtnIcon name={loading ? 'wait' : 'save'} /> {loading ? 'Saving...' : 'Save'}
            </button>
            <button className="btn btn-outline-secondary" onClick={() => setEditing(false)}>
              <BtnIcon name="cancel" /> Cancel
            </button>
          </>
        ) : (
          <>
            <h6 className="fw-semibold mb-3">{page.title}</h6>
            <div className="content-preview mb-3" dangerouslySetInnerHTML={{ __html: page.content }} />
            <button className="btn btn-sm btn-outline-primary" onClick={() => setEditing(true)}>
              <BtnIcon name="edit" /> Edit
            </button>
          </>
        )}
      </div>
    </Layout>
  );
}
