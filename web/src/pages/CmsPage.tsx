import { useEffect, useState } from 'react';
import { Container, Card, Alert } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import { getCmsPage, getErrorMessage } from '../services/api';

interface CmsPageProps {
  slug: string;
  title: string;
}

export default function CmsPage({ slug, title }: CmsPageProps) {
  const [content, setContent] = useState('');
  const [pageTitle, setPageTitle] = useState(title);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getCmsPage(slug)
      .then((page) => {
        setPageTitle(page.title || title);
        setContent(page.content || '');
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [slug, title]);

  if (loading) return <Container className="page-container"><LoadingSpinner /></Container>;

  return (
    <Container className="page-container">
      <h4 className="section-title">{pageTitle}</h4>
      {error ? (
        <Alert variant="warning">{error}</Alert>
      ) : (
        <Card className="card-brand">
          <Card.Body
            className="cms-content"
            dangerouslySetInnerHTML={{ __html: content || '<p>Content coming soon.</p>' }}
          />
        </Card>
      )}
    </Container>
  );
}
