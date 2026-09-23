import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col } from 'react-bootstrap';
import { getFaqsPublic } from '../services/api';
import type { Faq } from '../types';

function splitColumns<T>(items: T[]): [T[], T[]] {
  const midpoint = Math.ceil(items.length / 2);
  return [items.slice(0, midpoint), items.slice(midpoint)];
}

function FaqItem({
  id,
  question,
  answer,
  isOpen,
  onToggle,
  index,
}: {
  id: string;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
}) {
  return (
    <div
      id={id}
      className={`footer-faq-item${isOpen ? ' is-open' : ''}`}
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <button
        type="button"
        className="footer-faq-question"
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-controls={`${id}-answer`}
      >
        <span className="footer-faq-question-text">{question}</span>
        <span className="footer-faq-chevron-wrap" aria-hidden>
          <svg className="footer-faq-chevron" viewBox="0 0 24 24">
            <path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      <div id={`${id}-answer`} className="footer-faq-answer-wrap" aria-hidden={!isOpen}>
        <div className="footer-faq-answer">
          <p>{answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function FooterFaq() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [openId, setOpenId] = useState<number | null>(null);

  useEffect(() => {
    getFaqsPublic()
      .then((list) => {
        setFaqs(list);
        setOpenId(null);
      })
      .catch(() => setFaqs([]))
      .finally(() => setLoaded(true));
  }, []);

  const toggle = (index: number) => {
    setOpenId((prev) => (prev === index ? null : index));
  };

  if (loaded && faqs.length === 0) {
    return null;
  }

  const [leftFaqs, rightFaqs] = splitColumns(faqs);
  const rightOffset = leftFaqs.length;

  const renderColumn = (columnFaqs: Faq[], offset: number) =>
    columnFaqs.map((faq, i) => {
      const index = offset + i;
      return (
        <FaqItem
          key={faq.id}
          id={`footer-faq-${faq.id}`}
          question={faq.question}
          answer={faq.answer}
          isOpen={openId === index}
          onToggle={() => toggle(index)}
          index={index}
        />
      );
    });

  return (
    <section className="footer-faq-section" aria-labelledby="footer-faq-heading">
      <Row className="justify-content-center">
        <Col xs={12} lg={10}>
          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
            <h2 id="footer-faq-heading" className="footer-faq-title mb-0">
              Frequently Asked Questions
            </h2>
            <Link to="/faqs" className="btn btn-sm btn-outline-success rounded-pill">
              View all
            </Link>
          </div>

          <div className="footer-faq-panel">
            {!loaded ? (
              <p className="text-muted small mb-0 px-2 py-3">Loading FAQs…</p>
            ) : (
              <div className="footer-faq-grid">
                <div className="footer-faq-col">{renderColumn(leftFaqs, 0)}</div>
                <div className="footer-faq-col">{renderColumn(rightFaqs, rightOffset)}</div>
              </div>
            )}
          </div>
        </Col>
      </Row>
    </section>
  );
}
