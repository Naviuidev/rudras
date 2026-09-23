import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getCmsPages, updateCmsPage } from '../services/api';
import BtnIcon from '../components/BtnIcon';

export default function CmsPage() {
  const [pages, setPages] = useState<any[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ title: '', content: '' });

  const load = () => getCmsPages().then((res) => setPages(res.data.data || []));
  useEffect(() => { load(); }, []);

  const handleEdit = (page: any) => {
    setEditing(page.slug);
    setForm({ title: page.title, content: page.content });
  };

  const handleSave = async () => {
    if (!editing) return;
    await updateCmsPage(editing, form);
    setEditing(null);
    load();
  };

  return (
    <Layout title="CMS Management">
      <div className="row g-4">
        {pages.map((page) => (
          <div className="col-md-6" key={page.slug}>
            <div className="page-card">
              {editing === page.slug ? (
                <>
                  <input className="form-control mb-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                  <textarea className="form-control mb-2" rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
                  <button className="btn btn-accent me-2" onClick={handleSave}>
                    <BtnIcon name="save" /> Save
                  </button>
                  <button className="btn btn-outline-secondary" onClick={() => setEditing(null)}>
                    <BtnIcon name="cancel" /> Cancel
                  </button>
                </>
              ) : (
                <>
                  <h6 className="fw-semibold">{page.title}</h6>
                  <p className="text-muted small">Slug: {page.slug}</p>
                  <div className="mb-3" style={{ maxHeight: 120, overflow: 'hidden' }} dangerouslySetInnerHTML={{ __html: page.content }} />
                  <button className="btn btn-sm btn-outline-primary" onClick={() => handleEdit(page)}>
                    <BtnIcon name="edit" /> Edit
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </Layout>
  );
}
