import React, { useEffect, useState } from 'react';
import { MonitorSmartphone, ShieldCheck, Trash2, LogOut } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';

const Sessions = () => {
  const { user, logout } = useUser();
  const { showToast } = useToast();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const revokeSession = async (id) => {
    try {
      await api.delete(`/auth/sessions/${id}`);
      showToast("Device logged out successfully", "success");
      fetchSessions();
    } catch (err) {
      showToast("Failed to logout device", "error");
    }
  };

  const handleLogoutAll = async () => {
    if (window.confirm("Are you sure you want to log out of all devices?")) {
      try {
        await api.post('/api/auth/logout-all');
      } catch (err) {
        console.warn("Logout all failed", err);
      } finally {
        logout();
      }
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading active devices...</div>;
  }

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', flexWrap: 'wrap', gap: '15px' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: '950', color: 'var(--text-primary)', margin: 0 }}>ACTIVE DEVICES</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
            Manage devices where your Aura Store account is currently logged in.
          </p>
        </div>
        {sessions.length > 1 && (
          <button 
            onClick={handleLogoutAll} 
            style={{ 
              padding: '10px 18px', 
              borderRadius: '8px', 
              fontSize: '13px', 
              fontWeight: '800', 
              background: '#e11b23', 
              color: '#fff', 
              border: 'none', 
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <LogOut size={16} /> LOGOUT ALL OTHER DEVICES
          </button>
        )}
      </div>

      {sessions.length === 0 ? (
        <div style={{ padding: '40px', background: 'var(--ss-light-grey)', borderRadius: '12px', textAlign: 'center', border: '1.5px dashed var(--border-color)' }}>
          <p style={{ color: 'var(--text-secondary)', fontWeight: '700' }}>No active sessions found.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          {sessions.map((session) => (
            <div 
              key={session.id} 
              style={{ 
                display: 'flex', 
                justify: 'space-between', 
                alignItems: 'center', 
                padding: '20px', 
                border: '1.5px solid var(--border-color)', 
                borderRadius: '12px', 
                background: 'var(--bg-primary)',
                flexWrap: 'wrap',
                gap: '15px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <div style={{ width: '46px', height: '46px', background: session.isCurrent ? '#e6f7f7' : 'var(--ss-light-grey)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: session.isCurrent ? '#008080' : 'var(--text-primary)', flexShrink: 0 }}>
                  <MonitorSmartphone size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <p style={{ fontSize: '15px', fontWeight: '900', color: 'var(--text-primary)', margin: 0 }}>
                      {session.device_name || 'Web Browser'} ({session.browser || 'Browser'})
                    </p>
                    {session.isCurrent && (
                      <span style={{ fontSize: '11px', background: '#008080', color: 'white', padding: '3px 8px', borderRadius: '4px', fontWeight: '800' }}>
                        THIS DEVICE (ACTIVE)
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                    {session.os || 'Unknown OS'} • {session.ip || 'Unknown IP'} {session.country ? `• ${session.country}` : ''} • Last Active: {new Date(session.last_active || session.created_at).toLocaleString()}
                  </p>
                </div>
              </div>

              {!session.isCurrent && (
                <button 
                  onClick={() => revokeSession(session.id)} 
                  style={{ 
                    padding: '8px 16px', 
                    borderRadius: '6px', 
                    fontSize: '12px', 
                    fontWeight: '800', 
                    background: 'transparent', 
                    border: '1px solid #e11b23', 
                    color: '#e11b23', 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <Trash2 size={14} /> LOGOUT DEVICE
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Sessions;
