import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import { getDailyRequirement } from '../services/api';

export default function DailyRequirementPage() {
  const [data, setData] = useState<any>({ date: '', requirements: [] });
  const [date, setDate] = useState('');

  const load = (d?: string) => {
    getDailyRequirement(d).then((res) => setData(res.data.data || { requirements: [] }));
  };

  useEffect(() => { load(); }, []);

  return (
    <Layout title="Daily Requirement Report">
      <div className="d-flex gap-2 mb-3 align-items-center">
        <input type="date" className="form-control w-auto rounded-pill" value={date} onChange={(e) => setDate(e.target.value)} />
        <button className="btn btn-accent" onClick={() => load(date || undefined)}>Generate Report</button>
      </div>
      <div className="page-card">
        <h6 className="fw-semibold mb-3">Tomorrow's Requirement — {data.date || 'Next day'}</h6>
        {(data.requirements || []).map((r: any, i: number) => (
          <div key={i} className="requirement-row">
            <strong>{r.product}:</strong> {r.quantity} {r.unit}
            <small className="text-muted ms-2">({r.source})</small>
          </div>
        ))}
        {!data.requirements?.length && <p className="text-muted mb-0">No requirements calculated. Active subscriptions and pending orders will appear here.</p>}
      </div>
    </Layout>
  );
}
