import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getUsers, getCustomerLedger } from '../services/api';

export default function CustomerLedgerPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [ledger, setLedger] = useState<any>(null);

  useEffect(() => { getUsers().then((res) => setUsers(res.data.data || [])); }, []);

  const loadLedger = (id: string) => {
    setSelectedId(id);
    if (id) getCustomerLedger(+id).then((res) => setLedger(res.data.data));
    else setLedger(null);
  };

  return (
    <Layout title="Customer Ledger">
      <select className="form-select w-auto rounded-pill mb-3" value={selectedId} onChange={(e) => loadLedger(e.target.value)}>
        <option value="">Select customer</option>
        {users.map((u) => <option key={u.id} value={u.id}>{u.name || u.email}</option>)}
      </select>
      {ledger && (
        <div className="page-card">
          <h6 className="fw-semibold mb-3">{ledger.user?.name || ledger.user?.email}</h6>
          <div className="profile-field"><span>Subscription Amount</span><strong>₹{ledger.subscription_amount}</strong></div>
          <div className="profile-field"><span>Paid</span><strong>₹{ledger.paid}</strong></div>
          <div className="profile-field"><span>Pending</span><strong>₹{ledger.pending}</strong></div>
          <div className="profile-field"><span>Wallet Balance</span><strong>₹{ledger.wallet_balance}</strong></div>
          <div className="profile-field"><span>Carry Forward Balance</span><strong>{ledger.carry_forward_balance} Days</strong></div>
        </div>
      )}
    </Layout>
  );
}
