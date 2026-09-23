import { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import BtnIcon from '../components/BtnIcon';
import { useToast } from '../context/ToastContext';
import { getInventoryStock, adjustStock } from '../services/api';

export default function InventoryStockPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<any>({ products: [], movements: [] });
  const [adjust, setAdjust] = useState({ product_id: '', change_type: 'added', quantity: '', notes: '' });

  const load = () => getInventoryStock().then((res) => setData(res.data.data || { products: [], movements: [] }));
  useEffect(() => { load(); }, []);

  const handleAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await adjustStock({ ...adjust, product_id: +adjust.product_id, quantity: +adjust.quantity });
      showToast('Stock updated');
      setAdjust({ product_id: '', change_type: 'added', quantity: '', notes: '' });
      load();
    } catch { showToast('Failed to update stock', 'error'); }
  };

  return (
    <Layout title="Stock Management">
      <div className="page-card mb-4">
        <h6 className="fw-semibold mb-3">Stock Overview</h6>
        <table className="table table-hover">
          <thead><tr><th>Product</th><th>SKU</th><th>Opening</th><th>Current</th><th>Sold</th><th>Remaining</th><th>Alert</th></tr></thead>
          <tbody>
            {(data.products || []).map((p: any) => (
              <tr key={p.id} className={p.low_stock ? 'table-warning' : ''}>
                <td>{p.name}</td><td>{p.sku || '—'}</td><td>{p.stock}</td><td>{p.stock}</td><td>{p.sold_quantity}</td><td>{p.remaining_quantity}</td>
                <td>{p.low_stock ? <span className="badge bg-warning">Low Stock</span> : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="row g-4">
        <div className="col-md-5">
          <div className="page-card">
            <h6 className="fw-semibold mb-3">Stock Adjustment</h6>
            <form onSubmit={handleAdjust}>
              <select className="form-select mb-2" value={adjust.product_id} onChange={(e) => setAdjust({ ...adjust, product_id: e.target.value })} required>
                <option value="">Select product</option>
                {(data.products || []).map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select className="form-select mb-2" value={adjust.change_type} onChange={(e) => setAdjust({ ...adjust, change_type: e.target.value })}>
                <option value="added">Add Stock</option><option value="reduced">Reduce Stock</option><option value="correction">Correction</option>
              </select>
              <input type="number" className="form-control mb-2" placeholder="Quantity" value={adjust.quantity} onChange={(e) => setAdjust({ ...adjust, quantity: e.target.value })} required />
              <input className="form-control mb-3" placeholder="Notes" value={adjust.notes} onChange={(e) => setAdjust({ ...adjust, notes: e.target.value })} />
              <button type="submit" className="btn btn-accent"><BtnIcon name="save" /> Update Stock</button>
            </form>
          </div>
        </div>
        <div className="col-md-7">
          <div className="page-card">
            <h6 className="fw-semibold mb-3">Inventory Logs</h6>
            <table className="table table-sm">
              <thead><tr><th>Product</th><th>Type</th><th>Qty</th><th>Notes</th><th>Date</th></tr></thead>
              <tbody>
                {(data.movements || []).map((m: any) => (
                  <tr key={m.id}><td>{m.product_name}</td><td>{m.change_type}</td><td>{m.quantity}</td><td>{m.notes || '—'}</td><td>{new Date(m.created_at).toLocaleDateString()}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
