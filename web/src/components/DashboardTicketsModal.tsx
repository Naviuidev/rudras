import { useMemo, useState } from 'react';
import type { PaymentSupportTicket } from '../types';

export type DashboardTicketFilter = 'all' | 'answered' | 'pending';

interface DashboardTicketsModalProps {
  show: boolean;
  onClose: () => void;
  tickets: PaymentSupportTicket[];
  filter: DashboardTicketFilter;
  onReply: (ticketId: number, message: string) => Promise<void>;
  onCloseTicket: (ticketId: number) => Promise<void>;
  actionLoading: boolean;
}

function filterLabel(filter: DashboardTicketFilter): string {
  if (filter === 'answered') return 'Answered Tickets';
  if (filter === 'pending') return 'Pending Tickets';
  return 'Your Tickets';
}

function statusLabel(status: PaymentSupportTicket['status']): string {
  if (status === 'closed') return 'Closed';
  if (status === 'in_progress') return 'In progress';
  if (status === 'resolved') return 'Answered';
  return 'Pending';
}

function matchesFilter(ticket: PaymentSupportTicket, filter: DashboardTicketFilter): boolean {
  if (filter === 'answered') return ticket.status === 'resolved';
  if (filter === 'pending') {
    return ticket.status === 'pending' || ticket.status === 'in_progress';
  }
  return true;
}

export default function DashboardTicketsModal({
  show,
  onClose,
  tickets,
  filter,
  onReply,
  onCloseTicket,
  actionLoading,
}: DashboardTicketsModalProps) {
  const [selectedTicket, setSelectedTicket] = useState<PaymentSupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');

  const filtered = useMemo(
    () => tickets.filter((ticket) => matchesFilter(ticket, filter)),
    [tickets, filter]
  );

  const activeTicket = selectedTicket
    ? tickets.find((ticket) => ticket.id === selectedTicket.id) || selectedTicket
    : null;

  if (!show) return null;

  const handleClose = () => {
    setSelectedTicket(null);
    setReplyText('');
    onClose();
  };

  const handleBackdropClick = () => {
    if (selectedTicket) {
      setSelectedTicket(null);
      setReplyText('');
      return;
    }
    handleClose();
  };

  const handleReplySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTicket || !replyText.trim()) return;
    await onReply(activeTicket.id, replyText.trim());
    setReplyText('');
  };

  const handleCloseTicket = async () => {
    if (!activeTicket) return;
    await onCloseTicket(activeTicket.id);
  };

  return (
    <div className="auth-popup-backdrop" onClick={handleBackdropClick} role="presentation">
      <div
        className="auth-popup dashboard-tickets-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="dashboard-tickets-title"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="dashboard-tickets-popup-close"
          aria-label="Close"
          onClick={handleClose}
        >
          ×
        </button>

        {activeTicket ? (
          <>
            <button
              type="button"
              className="dashboard-tickets-back-btn"
              onClick={() => {
                setSelectedTicket(null);
                setReplyText('');
              }}
            >
              ← Back to tickets
            </button>
            <h3 id="dashboard-tickets-title" className="auth-popup-title">
              {activeTicket.ticket_number}
            </h3>
            <div className="dashboard-ticket-detail">
              <div className="dashboard-ticket-detail-row">
                <span className="dashboard-ticket-detail-label">Status</span>
                <span className={`dashboard-ticket-status dashboard-ticket-status--${activeTicket.status}`}>
                  {statusLabel(activeTicket.status)}
                </span>
              </div>
              <div className="dashboard-ticket-detail-row">
                <span className="dashboard-ticket-detail-label">Service</span>
                <span>{activeTicket.service_type}</span>
              </div>

              <div className="dashboard-ticket-thread">
                {(activeTicket.messages || []).map((entry) => (
                  <article
                    key={entry.id}
                    className={`dashboard-ticket-thread-item dashboard-ticket-thread-item--${entry.sender_type}`}
                  >
                    <span className="dashboard-ticket-thread-label">
                      {entry.sender_type === 'admin' ? 'Support team' : 'You'}
                    </span>
                    <p className="dashboard-ticket-thread-text mb-1">{entry.message}</p>
                    <span className="dashboard-ticket-date">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </article>
                ))}
              </div>

              {activeTicket.status === 'closed' && activeTicket.closed_at && (
                <p className="dashboard-ticket-date mb-0">
                  Closed by {activeTicket.closed_by} on {new Date(activeTicket.closed_at).toLocaleString()}
                </p>
              )}

              {activeTicket.can_user_reply && (
                <form className="dashboard-ticket-reply-form" onSubmit={handleReplySubmit}>
                  <label htmlFor="dashboard-ticket-reply" className="dashboard-ticket-detail-label">
                    Your reply
                  </label>
                  <textarea
                    id="dashboard-ticket-reply"
                    className="form-control"
                    rows={4}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write your reply to the latest support response…"
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-outline-success rounded-pill mt-2"
                    disabled={actionLoading || !replyText.trim()}
                  >
                    {actionLoading ? 'Sending…' : 'Send reply'}
                  </button>
                </form>
              )}

              {activeTicket.status !== 'closed' && (
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-pill mt-3"
                  disabled={actionLoading}
                  onClick={handleCloseTicket}
                >
                  Close ticket
                </button>
              )}
            </div>
          </>
        ) : (
          <>
            <h3 id="dashboard-tickets-title" className="auth-popup-title">
              {filterLabel(filter)}
            </h3>
            {filtered.length === 0 ? (
              <p className="auth-popup-message mb-0">
                No tickets in this section yet. Raise a new ticket from the homepage support form.
              </p>
            ) : (
              <div className="dashboard-tickets-popup-list">
                {filtered.map((ticket) => (
                  <button
                    key={ticket.id}
                    type="button"
                    className="dashboard-tickets-popup-item"
                    onClick={() => setSelectedTicket(ticket)}
                  >
                    <div className="dashboard-tickets-popup-item-head">
                      <strong>{ticket.ticket_number}</strong>
                      <span className={`dashboard-ticket-status dashboard-ticket-status--${ticket.status}`}>
                        {statusLabel(ticket.status)}
                      </span>
                    </div>
                    <p className="dashboard-tickets-popup-item-service mb-1">{ticket.service_type}</p>
                    <p className="dashboard-tickets-popup-item-message mb-0">{ticket.message}</p>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        <button type="button" className="btn btn-outline-success rounded-pill auth-popup-btn mt-3" onClick={handleClose}>
          Close
        </button>
      </div>
    </div>
  );
}
