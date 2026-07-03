import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Search, ShoppingCart, Truck, CheckCircle, XCircle } from 'lucide-react';
import '../assets/AdminProducts.css';

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchOrders = async () => {
    try {
      const res = await api.get('/admin/orders');
      setOrders(res.data);
    } catch (err) {
      console.error('Failed to fetch orders', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`/admin/orders/${id}`, { status_track: newStatus });
      fetchOrders();
    } catch (err) {
      console.error('Failed to update order status', err);
    }
  };

  const filteredOrders = orders.filter(o => 
    o.id.toString().includes(search) || 
    (o.user_name || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.user_email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="admin-spinner"></div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1>Orders</h1>
          <p>Manage and track customer orders</p>
        </div>
      </div>

      <div className="admin-table-container glass-panel">
        <div className="table-toolbar">
          <div className="search-bar">
            <Search size={18} />
            <input 
              type="text" 
              placeholder="Search by Order ID, Name, or Email..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <table className="admin-table">
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Customer</th>
              <th>Amount</th>
              <th>Payment Status</th>
              <th>Order Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map(order => (
              <tr key={order.id}>
                <td>
                  <span className="name">#{order.id}</span>
                  <div className="sku">{new Date(order.created_at).toLocaleDateString()}</div>
                </td>
                <td>
                  <div className="table-product-info">
                    <span className="name">{order.user_name || 'Guest'}</span>
                    <span className="sku">{order.user_email}</span>
                  </div>
                </td>
                <td>₹{order.amount?.toLocaleString()}</td>
                <td>
                  <span className={`status-badge ${order.status === 'paid' ? 'success' : 'pending'}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${
                    order.status_track === 'Delivered' ? 'success' : 
                    order.status_track === 'Cancelled' ? 'danger' : 'warning'
                  }`}>
                    {order.status_track || 'Processing'}
                  </span>
                </td>
                <td>
                  <select 
                    className="status-select" 
                    value={order.status_track || 'Processing'} 
                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  >
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </td>
              </tr>
            ))}
            {filteredOrders.length === 0 && (
              <tr>
                <td colSpan="6" className="empty-state">
                  <ShoppingCart size={24} />
                  <p>No orders found.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminOrders;
