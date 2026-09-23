import { useEffect, useState } from 'react';
import { Modal } from 'react-bootstrap';
import type { SupportTicketItem } from './SupportTicketsListModal';

interface SupportTicketReplyModalProps {
  show: boolean;
  ticket: SupportTicketItem | null;
  loading: boolean;
  onHide: () => void;
  onSubmit: (ticket: SupportTicketItem, adminReply: string) => void;
}

export default function SupportTicketReplyModal({
  show,
  ticket,
  loading,
  onHide,
  onSubmit,
}: SupportTicketReplyModalProps) {
  const [reply, setReply] = useState('');

  useEffect(() => {
    if (show) {
      setReply('');
    }
  }, [show, ticket?.id]);

  const handleHide = () => {
    setReply('');
    onHide();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket || !reply.trim()) return;
    onSubmit(ticket, reply.trim());
  };

  return (
    <Modal
      show={show}
      onHide={handleHide}
      centered
      className="categories-create-modal"
      contentClassName="categories-list-modal-content"
    >
      <Modal.Header closeButton className="categories-list-modal-header">
        <Modal.Title className="categories-list-modal-title">
          Reply to {ticket?.ticket_number || 'ticket'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="categories-create-modal-body">
        {ticket && (
          <>
            <p className="support-reply-modal-meta mb-2">
              <strong>{ticket.full_name}</strong> · {ticket.email}
            </p>
            <p className="support-reply-modal-message mb-3">{ticket.message}</p>
            <form className="categories-form" onSubmit={handleSubmit}>
              <div className="categories-form-field">
                <label htmlFor="support-admin-reply" className="form-label">
                  Admin reply
                </label>
                <textarea
                  id="support-admin-reply"
                  className="form-control"
                  rows={5}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder="Write your reply to the customer…"
                  required
                />
              </div>
              <div className="categories-form-actions">
                <button type="button" className="btn btn-outline-secondary rounded-pill" onClick={handleHide}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-outline-success rounded-pill" disabled={loading || !reply.trim()}>
                  {loading ? 'Sending…' : 'Send reply'}
                </button>
              </div>
            </form>
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}
