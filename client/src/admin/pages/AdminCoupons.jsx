import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Search, Tag, Trash2, Plus } from 'lucide-react';
import '../assets/AdminProducts.css';

const AdminCoupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // New Coupon State
  const [showAdd, setShowAdd] = useState(false);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_type: 'percentage', discount_value: '' });

  const fetchCoupons = async () => {
    try {
      const res = await api.get('/admin/coupons');
      setCoupons(res.data);
    } catch (err) {
      console.error('Failed to fetch coupons', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await api.delete(`/admin/coupons/${id}`);
      fetchCoupons();
    } catch (err) {
      console.error('Failed to delete coupon', err);
    }
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await api.post('/admin/coupons', newCoupon);
      setShowAdd(false);
      setNewCoupon({ code: '', discount_type: 'percentage', discount_value: '' });
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add coupon');
    }
  };

  const filteredCoupons = coupons.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="admin-spinner"></div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1>Coupons</h1>
          <p>Create and manage discount codes</p>
        </div>
        <div className="admin-page-actions">
          <button className="btn-primary" onClick={() => setShowAdd(!showAdd)}>
            <Plus size={18} /> {showAdd ? 'Cancel' : 'Add Coupon'}
          </button>
        </div>
      </div>

      {showAdd && (
        <div className="glass-panel" style={{ padding: '20px', marginBottom: '20px' }}>
          <form onSubmit={handleAdd} style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
            <label className="field-group" style={{ flex: 1 }}>
              <span style={{ color: '#a8b2d1', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Code</span>
              <input 
                type="text" 
                value={newCoupon.code} 
                onChange={e => setNewCoupon({...newCoupon, code: e.target.value.toUpperCase()})}
                placeholder="e.g. SUMMER50"
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                required 
              />
            </label>
            <label className="field-group" style={{ flex: 1 }}>
              <span style={{ color: '#a8b2d1', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Type</span>
              <select 
                value={newCoupon.discount_type} 
                onChange={e => setNewCoupon({...newCoupon, discount_type: e.target.value})}
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (₹)</option>
              </select>
            </label>
            <label className="field-group" style={{ flex: 1 }}>
              <span style={{ color: '#a8b2d1', fontSize: '13px', display: 'block', marginBottom: '8px' }}>Value</span>
              <input 
                type="number" 
                value={newCoupon.discount_value} 
                onChange={e => setNewCoupon({...newCoupon, discount_value: e.target.value})}
                placeholder="e.g. 50"
                style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                required 
              />
            </label>
            <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>Save</button>
          </form>
        </div>
      )}

      <div className="admin-table-container glass-panel">
        <div className="table-toolbar">
          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search coupons..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Code</th>
              <th>Discount</th>
              <th>Status</th>
              <th>Created</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCoupons.map(coupon => (
              <tr key={coupon.id}>
                <td>
                  <span style={{ fontWeight: 'bold', color: '#fff', letterSpacing: '1px' }}>{coupon.code}</span>
                </td>
                <td>
                  {coupon.discount_type === 'percentage' 
                    ? `${coupon.discount_value}% OFF` 
                    : `₹${coupon.discount_value} OFF`}
                </td>
                <td>
                  <span className={`status-badge ${coupon.active ? 'success' : 'danger'}`}>
                    {coupon.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td>{new Date(coupon.created_at).toLocaleDateString()}</td>
                <td>
                  <div className="table-actions">
                    <button className="action-btn delete" onClick={() => handleDelete(coupon.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCoupons.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-state">
                  <Tag size={24} />
                  <p>No coupons found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCoupons;
