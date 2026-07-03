import React, { useEffect, useState } from 'react';
import { useAdminAuth } from '../context/AdminAuthContext';
import api from '../../api/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { DollarSign, ShoppingBag, Users, Activity } from 'lucide-react';
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

  if (loading) return <div className="admin-spinner"></div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1>Dashboard Overview</h1>
        <p>Welcome back, {admin?.role}</p>
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
                  <span className="details">{log.admin_email || 'System'} - {new Date(log.created_at + 'Z').toLocaleString()}</span>
                </div>
              </div>
            ))}
            {logs.length === 0 && <p className="no-logs">No recent activity.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
