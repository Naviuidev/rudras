import { useEffect, useState, FormEvent } from 'react';
import { Container, Card, Form, Button, Alert } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import api, { getErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { User } from '../types';

interface ProfileData {
  user: User;
}

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api
      .get<{ data: ProfileData }>('/profile')
      .then((res) => {
        const u = res.data.data.user;
        setName(u.name || '');
        setMobile(u.mobile || '');
        setEmail(u.email);
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.put<{ data: User }>('/profile', { name, mobile });
      updateUser(res.data.data);
      setSuccess('Profile updated successfully');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="user-account-content">
      <h4 className="section-title">My Profile</h4>
      {error && <Alert variant="danger">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      <Card className="card-brand mx-auto" style={{ maxWidth: 520 }}>
        <Card.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Full Name</Form.Label>
              <Form.Control value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control value={email || user?.email || ''} readOnly disabled />
              <Form.Text className="text-muted">Email cannot be changed</Form.Text>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Mobile</Form.Label>
              <Form.Control
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                maxLength={10}
              />
            </Form.Group>
            <Button type="submit" className="btn-accent w-100" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  );
}
