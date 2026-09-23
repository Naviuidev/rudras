import { useMemo, useState } from 'react';
import { Modal } from 'react-bootstrap';
import AdminNavIcon from './AdminNavIcon';
import AdminHelpModal from './AdminHelpModal';

export interface SupportTicketMessage {
  id: number;
  ticket_id: number;
  sender_type: 'user' | 'admin';
  message: string;
  created_at: string;
}

export interface SupportTicketItem {
  id: number;
  ticket_number: string;
  full_name: string;
  email: string;
  phone: string;
  service_type: string;
  message: string;
  status: 'pending' | 'in_progress' | 'resolved' | 'closed';
  closed_by?: 'user' | 'admin' | null;
  closed_at?: string | null;
  messages?: SupportTicketMessage[];
  can_admin_reply?: boolean;
  created_at: string;
  updated_at: string;
}

export type SupportTicketFilter = 'all' | 'answered' | 'pending';

interface SupportTicketsListModalProps {
  show: boolean;
  onHide: () => void;
  tickets: SupportTicketItem[];
  filter: SupportTicketFilter;
  onStatusChange: (ticket: SupportTicketItem, status: SupportTicketItem['status']) => void;
  onReply: (ticket: SupportTicketItem) => void;
  onCloseTicket: (ticket: SupportTicketItem) => void;
  statusLoadingId: number | null;
}

function filterLabel(filter: SupportTicketFilter): string {
  if (filter === 'answered') return 'Answered Queries';
  if (filter === 'pending') return 'Pending Queries';
  return 'All Support Queries';
}

function statusLabel(status: SupportTicketItem['status']): string {
  if (status === 'closed') return 'Closed';
  if (status === 'in_progress') return 'In progress';
  if (status === 'resolved') return 'Answered';
  return 'Pending';
}

function matchesFilter(ticket: SupportTicketItem, filter: SupportTicketFilter): boolean {
  if (filter === 'answered') return ticket.status === 'resolved';
  if (filter === 'pending') return ticket.status === 'pending' || ticket.status === 'in_progress';
  return true;
}

export default function SupportTicketsListModal({
  show,
  onHide,
  tickets,
  filter,
  onStatusChange,
  onReply,
  onCloseTicket,
  statusLoadingId,
}: SupportTicketsListModalProps) {
  const [query, setQuery] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return tickets.filter((ticket) => {
      if (!matchesFilter(ticket, filter)) return false;
      if (!q) return true;
      return (
        ticket.ticket_number.toLowerCase().includes(q) ||
        ticket.full_name.toLowerCase().includes(q) ||
        ticket.email.toLowerCase().includes(q) ||
        ticket.phone.toLowerCase().includes(q) ||
        ticket.service_type.toLowerCase().includes(q) ||
        ticket.message.toLowerCase().includes(q)
      );
    });
  }, [tickets, filter, query]);

  const handleHide = () => {
    setQuery('');
    onHide();
  };

  return (
    <>
      <Modal
        show={show}
        onHide={handleHide}
        size="lg"
        centered
        scrollable
        className="categories-list-modal support-tickets-list-modal"
        contentClassName="categories-list-modal-content"
      >
        <Modal.Header closeButton className="categories-list-modal-header">
          <Modal.Title className="categories-list-modal-title">{filterLabel(filter)}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="categories-list-modal-body">
          <div className="categories-list-modal-toolbar">
            <div className="categories-list-modal-search">
              <svg
                className="categories-list-modal-search-icon"
                viewBox="0 0 24 24"
                aria-hidden
                width="16"
                height="16"
              >
                <path
                  fill="currentColor"
                  d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C8.01 14 6 11.99 6 9.5S8.01 5 10.5 5 15 7.01 15 9.5 12.99 14 10.5 14z"
                />
              </svg>
              <input
                type="text"
                role="searchbox"
                className="categories-list-modal-search-input"
                placeholder="Search tickets…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                aria-label="Search support tickets"
              />
              {query && (
                <button
                  type="button"
                  className="categories-list-modal-search-clear"
                  aria-label="Clear search"
                  onClick={() => setQuery('')}
                >
                  ×
                </button>
              )}
            </div>
            <button
              type="button"
              className="categories-list-modal-help-btn rounded-pill"
              aria-label="Help"
              onClick={() => setShowHelp(true)}
            >
              Help
              <svg
                className="categories-list-modal-help-icon"
                viewBox="0 0 24 24"
                aria-hidden
                width="16"
                height="16"
              >
                <path
                  fill="currentColor"
                  d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"
                />
              </svg>
            </button>
          </div>

          {tickets.filter((t) => matchesFilter(t, filter)).length === 0 ? (
            <p className="categories-list-modal-empty">
              No support queries yet. Customer submissions from the homepage form will appear here.
            </p>
          ) : filtered.length === 0 ? (
            <p className="categories-list-modal-empty">No tickets match your search.</p>
          ) : (
            <div className="support-tickets-list">
              {filtered.map((ticket) => (
                <article key={ticket.id} className="support-ticket-card">
                  <div className="support-ticket-card-head">
                    <div className="support-ticket-card-icon">
                      <AdminNavIcon name="support" />
                    </div>
                    <div className="support-ticket-card-meta">
                      <div className="support-ticket-card-title-row">
                        <strong>{ticket.ticket_number}</strong>
                        <span className={`support-ticket-status support-ticket-status--${ticket.status}`}>
                          {statusLabel(ticket.status)}
                        </span>
                      </div>
                      <p className="support-ticket-card-service mb-1">{ticket.service_type}</p>
                      <p className="support-ticket-card-contact mb-0">
                        {ticket.full_name} · {ticket.email} · {ticket.phone}
                      </p>
                    </div>
                  </div>

                  <div className="support-ticket-thread">
                    {(ticket.messages || []).map((entry) => (
                      <div
                        key={entry.id}
                        className={`support-ticket-thread-item support-ticket-thread-item--${entry.sender_type}`}
                      >
                        <span className="support-ticket-thread-label">
                          {entry.sender_type === 'admin' ? 'Admin' : 'Customer'}
                        </span>
                        <p className="support-ticket-thread-text mb-1">{entry.message}</p>
                        <span className="support-ticket-card-date">
                          {new Date(entry.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="support-ticket-card-foot">
                    <span className="support-ticket-card-date">
                      Opened {new Date(ticket.created_at).toLocaleString()}
                    </span>
                    {ticket.status !== 'closed' && (
                      <div className="support-ticket-card-actions">
                        {ticket.status === 'pending' && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary rounded-pill"
                            disabled={statusLoadingId === ticket.id}
                            onClick={() => onStatusChange(ticket, 'in_progress')}
                          >
                            Mark in progress
                          </button>
                        )}
                        {ticket.can_admin_reply && (
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success rounded-pill"
                            disabled={statusLoadingId === ticket.id}
                            onClick={() => onReply(ticket)}
                          >
                            Reply to customer
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-dark rounded-pill"
                          disabled={statusLoadingId === ticket.id}
                          onClick={() => onCloseTicket(ticket)}
                        >
                          Close ticket
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </Modal.Body>
      </Modal>

      <AdminHelpModal show={showHelp} onHide={() => setShowHelp(false)} />
    </>
  );
}
