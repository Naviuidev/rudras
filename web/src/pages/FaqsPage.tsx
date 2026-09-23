import { useEffect, useState } from 'react';
import { Container, Accordion, Alert } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { getFaqsPublic, getErrorMessage } from '../services/api';
import type { Faq } from '../types';

export default function FaqsPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getFaqsPublic()
      .then(setFaqs)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Container className="page-container"><LoadingSpinner /></Container>;

  return (
    <Container className="page-container">
      <h4 className="section-title">Frequently Asked Questions</h4>
      {error && <Alert variant="danger">{error}</Alert>}

      {faqs.length === 0 ? (
        <EmptyState title="No FAQs available" message="Check back later for updates" />
      ) : (
        <Accordion defaultActiveKey="0" className="faq-accordion">
          {faqs.map((faq, index) => (
            <Accordion.Item eventKey={String(index)} key={faq.id} className="card-brand mb-2 border-0">
              <Accordion.Header>{faq.question}</Accordion.Header>
              <Accordion.Body className="text-muted">{faq.answer}</Accordion.Body>
            </Accordion.Item>
          ))}
        </Accordion>
      )}
    </Container>
  );
}
