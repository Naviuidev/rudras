import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import SupportTicketsListModal, {
  type SupportTicketFilter,
  type SupportTicketItem,
} from '../components/SupportTicketsListModal';
import SupportTicketReplyModal from '../components/SupportTicketReplyModal';
import { useToast } from '../context/ToastContext';
import {
  getPaymentSupportTickets,
  replyPaymentSupportTicket,
  updatePaymentSupportTicketStatus,
  closePaymentSupportTicket,
} from '../services/api';

interface SupportStats {
  total: number;
  answered: number;
  pending: number;
}

export default function SupportPage() {
  const { showToast } = useToast();
  const [tickets, setTickets] = useState<SupportTicketItem[]>([]);
  const [stats, setStats] = useState<SupportStats>({ total: 0, answered: 0, pending: 0 });
  const [pageLoading, setPageLoading] = useState(true);
  const [showListModal, setShowListModal] = useState(false);
  const [listFilter, setListFilter] = useState<SupportTicketFilter>('all');
  const [statusLoadingId, setStatusLoadingId] = useState<number | null>(null);
  const [replyTarget, setReplyTarget] = useState<SupportTicketItem | null>(null);
  const [replyLoading, setReplyLoading] = useState(false);

  const loadTickets = () => {
    setPageLoading(true);
    getPaymentSupportTickets()
      .then((res) => {
        const data = res.data.data || {};
        setTickets(data.tickets || []);
        setStats(data.stats || { total: 0, answered: 0, pending: 0 });
      })
      .catch(() => {
        setTickets([]);
        setStats({ total: 0, answered: 0, pending: 0 });
      })
      .finally(() => setPageLoading(false));
  };

  useEffect(() => {
    loadTickets();
  }, []);

  const openList = (filter: SupportTicketFilter) => {
    setListFilter(filter);
    setShowListModal(true);
  };

  const updateTicketInState = (ticket: SupportTicketItem) => {
    setTickets((prev) => prev.map((item) => (item.id === ticket.id ? ticket : item)));
  };

  const handleStatusChange = async (
    ticket: SupportTicketItem,
    status: SupportTicketItem['status']
  ) => {
    setStatusLoadingId(ticket.id);
    try {
      const res = await updatePaymentSupportTicketStatus(ticket.id, { status });
      const nextStats = res.data.data?.stats;
      if (nextStats) setStats(nextStats);
      if (res.data.data?.ticket) updateTicketInState(res.data.data.ticket);
      showToast('Ticket status updated successfully!');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || 'Failed to update ticket status', 'error');
    } finally {
      setStatusLoadingId(null);
    }
  };

  const handleReplySubmit = async (ticket: SupportTicketItem, adminReply: string) => {
    setReplyLoading(true);
    setStatusLoadingId(ticket.id);
    try {
      const res = await replyPaymentSupportTicket(ticket.id, adminReply);
      const nextStats = res.data.data?.stats;
      if (nextStats) setStats(nextStats);
      if (res.data.data?.ticket) updateTicketInState(res.data.data.ticket);
      setReplyTarget(null);
      showToast('Reply sent to customer!');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || 'Failed to send reply', 'error');
    } finally {
      setReplyLoading(false);
      setStatusLoadingId(null);
    }
  };

  const handleCloseTicket = async (ticket: SupportTicketItem) => {
    setStatusLoadingId(ticket.id);
    try {
      const res = await closePaymentSupportTicket(ticket.id);
      const nextStats = res.data.data?.stats;
      if (nextStats) setStats(nextStats);
      if (res.data.data?.ticket) updateTicketInState(res.data.data.ticket);
      showToast('Ticket closed successfully!');
    } catch (err: unknown) {
      const message =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(message || 'Failed to close ticket', 'error');
    } finally {
      setStatusLoadingId(null);
    }
  };

  return (
    <Layout title="Support">
      <div className="categories-page">
        {pageLoading ? (
          <div className="categories-loading">
            <div className="spinner-border text-success" role="status" />
            <span>Loading support queries…</span>
          </div>
        ) : (
          <div className="categories-tile-row">
            <button type="button" className="categories-tile" onClick={() => openList('all')}>
              <span className="categories-tile-label">Total Queries</span>
              <span className="categories-tile-count">{stats.total}</span>
            </button>

            <button type="button" className="categories-tile" onClick={() => openList('answered')}>
              <span className="categories-tile-label">Answered</span>
              <span className="categories-tile-count">{stats.answered}</span>
            </button>

            <button type="button" className="categories-tile" onClick={() => openList('pending')}>
              <span className="categories-tile-label">Pending</span>
              <span className="categories-tile-count">{stats.pending}</span>
            </button>
          </div>
        )}
      </div>

      <SupportTicketsListModal
        show={showListModal}
        onHide={() => setShowListModal(false)}
        tickets={tickets}
        filter={listFilter}
        onStatusChange={handleStatusChange}
        onReply={setReplyTarget}
        onCloseTicket={handleCloseTicket}
        statusLoadingId={statusLoadingId}
      />

      <SupportTicketReplyModal
        show={!!replyTarget}
        ticket={replyTarget}
        loading={replyLoading}
        onHide={() => setReplyTarget(null)}
        onSubmit={handleReplySubmit}
      />
    </Layout>
  );
}
