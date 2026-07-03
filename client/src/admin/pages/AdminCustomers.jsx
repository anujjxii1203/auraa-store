import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Search, Users, Trash2, ShieldBan } from 'lucide-react';
import '../assets/AdminProducts.css'; // Reusing table styles

const AdminCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/admin/users');
      setCustomers(res.data);
    } catch (err) {
      console.error('Failed to fetch customers', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this customer? This action is non-reversible from the UI.')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchCustomers();
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="admin-spinner"></div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1>Customers</h1>
          <p>View customer details, orders, and lifetime value</p>
        </div>
      </div>

      <div className="admin-table-container glass-panel">
        <div className="table-toolbar">
          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search customers..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Customer</th>
              <th>Joined Date</th>
              <th>Total Orders</th>
              <th>Lifetime Value (LTV)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map(customer => (
              <tr key={customer.id}>
                <td>
                  <div className="table-product-info">
                    <span className="name">{customer.name}</span>
                    <span className="sku">{customer.email}</span>
                  </div>
                </td>
                <td>{new Date(customer.created_at).toLocaleDateString()}</td>
                <td>
                  <span className="status-badge pending">
                    {customer.total_orders || 0} Orders
                  </span>
                </td>
                <td>₹{(customer.ltv || 0).toLocaleString()}</td>
                <td>
                  <div className="table-actions">
                    <button className="action-btn delete" onClick={() => handleDelete(customer.id)} title="Delete Customer">
                      <ShieldBan size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan="5" className="empty-state">
                  <Users size={24} />
                  <p>No customers found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminCustomers;
