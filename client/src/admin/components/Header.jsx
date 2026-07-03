import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, Menu, User, LoaderCircle, Activity } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';
import api from '../../api/client';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const { admin } = useAdminAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/admin/audit-logs?limit=5');
      setNotifications(Array.isArray(response.data) ? response.data : (response.data.logs || []));
    } catch (error) {
      console.error('Failed to fetch notifications', error);
    }
  };

  useEffect(() => {
    // Fetch initial notifications
    fetchNotifications();
    // Poll every 10 seconds for real-time notifications
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleNotifications = async () => {
    setShowNotifications(!showNotifications);
    if (!showNotifications) {
      fetchNotifications();
    }
  };

  return (
    <header className="admin-header glass-panel">
      <div className="header-left">
        <button 
          className="icon-btn" 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          style={{ marginRight: '16px' }}
          title="Toggle Sidebar"
        >
          <Menu size={20} />
        </button>
        <div className="search-bar">
          <Search size={18} className="search-icon" />
          <input type="text" placeholder="Global Search (Ctrl+K)..." />
        </div>
      </div>
      
      <div className="header-right">
        <div className="notification-wrapper" ref={dropdownRef} style={{ position: 'relative' }}>
          <button className="icon-btn notification-btn" onClick={toggleNotifications}>
            <Bell size={20} />
            {notifications.length > 0 && <span className="badge">{notifications.length}</span>}
          </button>
          
          {showNotifications && (
            <div className="notification-dropdown" style={{
              position: 'absolute', top: '120%', right: 0, width: '300px', 
              padding: '16px', zIndex: 50, display: 'flex', flexDirection: 'column', gap: '12px',
              background: '#191c24', border: '1px solid #2c2f36', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
              <h4 style={{ margin: 0, fontSize: '14px', color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>Recent Activity</h4>
              {loading && notifications.length === 0 ? (
                <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
                  <LoaderCircle className="spinner" size={24} color="#e11b23" />
                </div>
              ) : notifications.length > 0 ? (
                notifications.map(log => (
                  <div key={log.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <div style={{ background: 'rgba(225,27,35,0.1)', padding: '6px', borderRadius: '50%' }}>
                      <Activity size={14} color="#e11b23" />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '13px', color: '#d1d5db', fontWeight: 500 }}>{log.action}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#8892b0' }}>
                        {log.admin_email} - {new Date(log.created_at + 'Z').toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ margin: 0, fontSize: '13px', color: '#8892b0', textAlign: 'center' }}>No recent notifications.</p>
              )}
            </div>
          )}
        </div>
        
        <div className="admin-profile-menu">
          <div className="avatar">
            <User size={20} />
          </div>
          <div className="admin-info">
            <span className="admin-email">{admin?.email}</span>
            <span className="admin-role">{admin?.role}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
