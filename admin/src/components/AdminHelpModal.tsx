import { FormEvent, useState } from 'react';
import { Modal } from 'react-bootstrap';
import AuthPopup from './AuthPopup';
import BtnIcon from './BtnIcon';
import { useToast } from '../context/ToastContext';
import { sendAdminHelp } from '../services/api';

export const MESSAGE_QUERY_TYPE = 'Message Query';

export const ADMIN_HELP_ISSUE_TYPES = [
  'User interface issue',
  'Functionality issue',
  'Payment integration Issue',
  'Admin portal login Issue',
  'Forgot admin password ?',
  MESSAGE_QUERY_TYPE,
] as const;

interface AdminHelpModalProps {
  show: boolean;
  onHide: () => void;
}

export default function AdminHelpModal({ show, onHide }: AdminHelpModalProps) {
  const { showToast } = useToast();
  const [issueType, setIssueType] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  const isMessageQuery = issueType === MESSAGE_QUERY_TYPE;

  const resetForm = () => {
    setIssueType('');
    setMessage('');
  };

  const handleHide = () => {
    if (submitting) return;
    resetForm();
    onHide();
  };

  const handleSuccessClose = () => {
    setShowSuccessPopup(false);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!issueType || !message.trim()) return;

    setSubmitting(true);
    try {
      await sendAdminHelp({ issue_type: issueType, message: message.trim() });
      resetForm();
      onHide();
      showToast('Help request sent successfully!');
      setShowSuccessPopup(true);
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === 'object' && 'response' in err
          ? (err as { response?: { data?: { message?: string } } }).response?.data?.message
          : undefined;
      showToast(errorMessage || 'Failed to send help request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <Modal
      show={show}
      onHide={handleHide}
      centered
      className="admin-help-modal"
      contentClassName="categories-list-modal-content"
    >
      <Modal.Header closeButton className="categories-list-modal-header">
        <Modal.Title className="categories-list-modal-title">Help & Support</Modal.Title>
      </Modal.Header>
      <Modal.Body className="categories-create-modal-body">
        <form className="categories-form admin-help-form" onSubmit={handleSubmit}>
          {isMessageQuery ? (
            <div className="categories-form-field">
              <textarea
                id="admin-help-message"
                className="form-control admin-help-message"
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message…"
                required
                autoFocus
                aria-label="Message"
              />
            </div>
          ) : (
            <>
              <div className="categories-form-field">
                <label htmlFor="admin-help-issue" className="form-label">
                  Issues with
                </label>
                <select
                  id="admin-help-issue"
                  className="form-select admin-help-select"
                  value={issueType}
                  onChange={(e) => setIssueType(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select an issue type
                  </option>
                  {ADMIN_HELP_ISSUE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              {issueType && (
                <div className="categories-form-field">
                  <label htmlFor="admin-help-message" className="form-label">
                    Message
                  </label>
                  <textarea
                    id="admin-help-message"
                    className="form-control admin-help-message"
                    rows={4}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe the issue you are facing…"
                    required
                  />
                </div>
              )}
            </>
          )}

          <button
            type="submit"
            className="btn btn-outline-success rounded-pill w-100 admin-help-submit"
            disabled={submitting || !issueType || !message.trim()}
          >
            <BtnIcon name={submitting ? 'wait' : 'send'} />{' '}
            {submitting ? 'Sending…' : 'Submit'}
          </button>
        </form>
      </Modal.Body>
    </Modal>

    <AuthPopup
      show={showSuccessPopup}
      title="Request Submitted"
      message="Request submitted to the developer. Will contact you soon."
      confirmLabel="OK"
      onClose={handleSuccessClose}
    />
    </>
  );
}
