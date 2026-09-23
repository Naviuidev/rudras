import { useEffect, useState, FormEvent } from 'react';
import { Container, Card, Form, Button, Alert, Badge, Modal } from 'react-bootstrap';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import { getAddresses, createAddress, updateAddress, deleteAddress, getErrorMessage } from '../services/api';
import type { Address, AddressInput } from '../types';

const emptyForm = {
  name: '',
  mobile: '',
  address_line: '',
  area: '',
  city: '',
  state: '',
  pincode: '',
  is_default: false,
};

export default function AddressesPage() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Address | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = () => {
    getAddresses()
      .then(setAddresses)
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (addr: Address) => {
    setEditing(addr);
    setForm({
      name: addr.name,
      mobile: addr.mobile,
      address_line: addr.address_line,
      area: addr.area || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      is_default: !!addr.is_default,
    });
    setShowModal(true);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      if (editing) {
        await updateAddress(editing.id, form);
      } else {
        await createAddress(form);
      }
      setShowModal(false);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Delete this address?')) return;
    try {
      await deleteAddress(id);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const toggleDefault = async (addr: Address) => {
    try {
      const data: Partial<AddressInput> = {
        name: addr.name,
        mobile: addr.mobile,
        address_line: addr.address_line,
        area: addr.area || '',
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        is_default: true,
      };
      await updateAddress(addr.id, data);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <LoadingSpinner />;

  return (
    <div className="user-account-content">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="section-title mb-0">My Addresses</h4>
        <Button size="sm" className="btn-accent" onClick={openAdd}>
          + Add Address
        </Button>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {addresses.length === 0 ? (
        <EmptyState
          title="No addresses saved"
          message="Add a delivery address for faster checkout"
          actionLabel="Add Address"
          onAction={openAdd}
        />
      ) : (
        addresses.map((addr) => (
          <Card key={addr.id} className="card-brand mb-3">
            <Card.Body>
              <div className="d-flex justify-content-between align-items-start">
                <div>
                  {!!addr.is_default && (
                    <Badge bg="success" className="badge-status mb-2">Default</Badge>
                  )}
                  <h6 className="mb-1">{addr.name}</h6>
                  <p className="text-muted small mb-1">
                    {addr.address_line}
                    {addr.area ? `, ${addr.area}` : ''}, {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <p className="small mb-0">{addr.mobile}</p>
                </div>
                <div className="d-flex flex-column gap-1">
                  {!addr.is_default && (
                    <Button size="sm" variant="outline-success" onClick={() => toggleDefault(addr)}>
                      Set Default
                    </Button>
                  )}
                  <Button size="sm" variant="outline-secondary" onClick={() => openEdit(addr)}>
                    Edit
                  </Button>
                  <Button size="sm" variant="outline-danger" onClick={() => handleDelete(addr.id)}>
                    Delete
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        ))
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editing ? 'Edit Address' : 'Add Address'}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSave}>
          <Modal.Body>
            {(['name', 'mobile', 'address_line', 'area', 'city', 'state', 'pincode'] as const).map((field) => (
              <Form.Group key={field} className="mb-2">
                <Form.Label className="text-capitalize">{field.replace('_', ' ')}</Form.Label>
                <Form.Control
                  value={form[field] || ''}
                  onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                  required={field !== 'area'}
                />
              </Form.Group>
            ))}
            <Form.Check
              type="checkbox"
              label="Set as default address"
              checked={form.is_default}
              onChange={(e) => setForm({ ...form, is_default: e.target.checked })}
            />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
            <Button type="submit" className="btn-accent" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
}
