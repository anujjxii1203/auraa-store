import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Search } from 'lucide-react';
import '../assets/AdminProducts.css';

const AdminReturns = () => {
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchReturns = async () => {
    try {
      const res = await api.get('/admin/stats');
      setReturns(res.data.returns || []);
    } catch (err) {
      console.error('Failed to fetch returns', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReturns();
  }, []);

  const filteredReturns = returns.filter(r => 
    r.order_id.toLowerCase().includes(search.toLowerCase()) || 
    (r.reason || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="admin-spinner"></div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1>Returns</h1>
          <p>Manage customer return requests</p>
        </div>
      </div>

      <div className="admin-table-container glass-panel">
        <div className="table-toolbar">
          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by Order ID or Reason..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Return ID</th>
              <th>Order ID</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredReturns.length > 0 ? filteredReturns.map(ret => (
              <tr key={ret.id}>
                <td>
                  <span className="name">#{ret.id}</span>
                </td>
                <td>
                  <span className="sku">{ret.order_id}</span>
                </td>
                <td>
                  <span style={{ fontSize: '13px', color: '#a0a0a0' }}>{ret.reason}</span>
                </td>
                <td>
                  <span className={`status-badge ${ret.status === 'pending' ? 'warning' : 'success'}`}>
                    {ret.status}
                  </span>
                </td>
                <td>
                  <span style={{ fontSize: '13px', color: '#a0a0a0' }}>
                    {new Date(ret.created_at).toLocaleDateString()}
                  </span>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
                  No returns found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminReturns;
