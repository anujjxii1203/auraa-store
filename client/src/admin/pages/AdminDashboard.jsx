import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import api from '../../api/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { DollarSign, ShoppingBag, Users, Activity, Download, AlertTriangle } from 'lucide-react';
import '../assets/AdminDashboard.css';

const AdminDashboard = () => {
  const { admin } = useAdminAuth();
  const [data, setData] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [analyticsRes, logsRes] = await Promise.all([
          api.get('/admin/analytics'),
          api.get('/admin/audit-logs?limit=10')
        ]);
        setData(analyticsRes.data);
        setLogs(Array.isArray(logsRes.data) ? logsRes.data : []);
      } catch (err) {
        console.error('Failed to fetch dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleExportCSV = async () => {
    try {
      const response = await api.get('/admin/reports/sales-csv', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales_report_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error('Failed to export CSV', err);
      alert('Failed to export sales report');
    }
  };

  if (loading) return <div className="admin-spinner"></div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>Dashboard Overview</h1>
          <p>Welcome back, {admin?.role}</p>
        </div>
        <button 
          onClick={handleExportCSV} 
          className="admin-btn"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px', 
            padding: '10px 18px', 
            background: '#e11b23', 
            color: '#fff', 
            border: 'none', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontWeight: '800',
            fontSize: '13px'
          }}
        >
          <Download size={16} /> EXPORT SALES CSV
        </button>
      </div>

      <div className="stats-grid">
        <div className="stat-card glass-panel">
          <div className="stat-icon revenue"><DollarSign size={24} /></div>
          <div className="stat-info">
            <h3>Total Revenue</h3>
            <p>₹{data?.totalRevenue?.toLocaleString() || 0}</p>
          </div>
        </div>
        
        <div className="stat-card glass-panel">
          <div className="stat-icon orders"><ShoppingBag size={24} /></div>
          <div className="stat-info">
            <h3>Total Orders</h3>
            <p>{data?.totalOrders || 0}</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon customers"><Users size={24} /></div>
          <div className="stat-info">
            <h3>Total Customers</h3>
            <p>{data?.totalCustomers || 0}</p>
          </div>
        </div>

        <div className="stat-card glass-panel">
          <div className="stat-icon carts"><Activity size={24} /></div>
          <div className="stat-info">
            <h3>Active Carts</h3>
            <p>{data?.activeCarts || 0}</p>
          </div>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="chart-section glass-panel">
          <h2>Sales Overview</h2>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.salesGraph || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                <XAxis dataKey="name" stroke="#8892b0" axisLine={false} tickLine={false} />
                <YAxis stroke="#8892b0" axisLine={false} tickLine={false} tickFormatter={(value) => `₹${value}`} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{ background: '#191c24', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                  itemStyle={{ color: '#e11b23' }}
                />
                <Bar dataKey="sales" name="Revenue" fill="#e11b23" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="timeline-section glass-panel">
          <h2>Activity Timeline</h2>
          <div className="timeline-list">
            {logs.map(log => (
              <div key={log.id} className="timeline-item">
                <div className="timeline-dot"></div>
                <div className="timeline-content">
                  <span className="action">{log.action}</span>
                  <span className="details">{log.admin_email || 'System'} - {new Date(log.created_at + (log.created_at.includes('Z') ? '' : 'Z')).toLocaleString()}</span>
                </div>
              </div>
            ))}
            {logs.length === 0 && <p className="no-logs">No recent activity.</p>}
          </div>
        </div>
      </div>

      {/* Low Stock Alerts Section */}
      {data?.lowStockProducts && data.lowStockProducts.length > 0 && (
        <div className="glass-panel" style={{ marginTop: '30px', padding: '25px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <AlertTriangle color="#ffc107" size={22} />
            <h2 style={{ margin: 0, fontSize: '18px', color: '#ffc107' }}>Low Stock Inventory Alerts ({data.lowStockProducts.length})</h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '15px' }}>
            {data.lowStockProducts.map((prod) => (
              <div 
                key={prod.id} 
                style={{ 
                  background: 'rgba(255, 193, 7, 0.08)', 
                  border: '1px solid rgba(255, 193, 7, 0.3)', 
                  padding: '15px', 
                  borderRadius: '8px',
                  display: 'flex',
                  justify: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#fff' }}>{prod.name}</h4>
                  <p style={{ margin: 0, fontSize: '12px', color: '#888' }}>{prod.category}</p>
                </div>
                <span style={{ background: '#ffc107', color: '#000', padding: '4px 10px', borderRadius: '4px', fontWeight: '900', fontSize: '12px' }}>
                  {prod.stock} left
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
