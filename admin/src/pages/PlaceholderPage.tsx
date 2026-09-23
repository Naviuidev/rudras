import Layout from '../components/Layout';

interface PlaceholderPageProps {
  title: string;
  description?: string;
}

export default function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <Layout title={title}>
      <div className="page-card placeholder-page">
        <div className="placeholder-icon">🚧</div>
        <h5 className="fw-semibold mb-2">{title}</h5>
        <p className="text-muted mb-0">
          {description || 'This section is coming soon. It will be available in a future update.'}
        </p>
      </div>
    </Layout>
  );
}
