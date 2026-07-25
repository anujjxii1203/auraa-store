import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Bell, Shield, Save, Eye, EyeOff, MonitorSmartphone, LogOut, Trash2 } from 'lucide-react';
import BackButton from '../components/BackButton';
import PageTitle from '../components/PageTitle';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';
import api from '../api/client';

const Settings = () => {
  const { user, updateUser, logout } = useUser();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [localUser, setLocalUser] = useState(() => ({
    username: user?.username || '',
    email: user?.email || '',
  }));
  const [activeTab, setActiveTab] = useState('profile');

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');

  // Sessions state
  const [sessions, setSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch sessions', err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'devices') {
      fetchSessions();
    }
  }, [activeTab]);

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
        navigate('/');
      }
    }
  };

  const handleUpdateProfile = (e) => {
    e.preventDefault();
    updateUser(localUser);
    showToast("Profile updated successfully!", "success");
  };

  const handleDeleteAccount = async () => {
    try {
      await api.delete('/users/me');
      if (user?.email) {
        localStorage.removeItem(`orders_${user.email}`);
        localStorage.removeItem(`addresses_${user.email}`);
      }
      logout();
      navigate('/');
      showToast("Account deleted successfully.", "info");
    } catch (err) {
      showToast(err.userMessage || "Failed to delete account. Please try again.", "error");
    }
  };

  const handleInitPasswordChange = async (e) => {
    e.preventDefault();
    if (!currentPassword) return showToast("Please enter your current password.", "error");
    if (newPassword.length < 6) return showToast("New password must be at least 6 characters.", "error");
    try {
      await api.post('/users/change-password-init', { currentPassword });
      setOtpSent(true);
      showToast("OTP sent to your email. Please check your inbox.", "info");
    } catch (err) {
      showToast(err.response?.data?.message || err.userMessage || "Failed to initiate password change.", "error");
    }
  };

  const handleVerifyPasswordChange = async (e) => {
    e.preventDefault();
    if (!otp) return showToast("Please enter the OTP.", "error");
    try {
      await api.post('/users/change-password-verify', { newPassword, otp });
      showToast("Password updated successfully!", "success");
      setCurrentPassword('');
      setNewPassword('');
      setOtp('');
      setOtpSent(false);
    } catch (err) {
      showToast(err.response?.data?.message || err.userMessage || "Failed to update password.", "error");
    }
  };

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '950', color: 'var(--text-primary)' }}>ACCOUNT SETTINGS</h1>
      </div>
      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '30px' }}>
        {/* Settings Tabs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <button 
            onClick={() => setActiveTab('profile')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: activeTab === 'profile' ? '#f0fcfc' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: activeTab === 'profile' ? 'var(--yaperz-green)' : '#555', textAlign: 'left' }}
          >
            <User size={18} /> PROFILE
          </button>
          <button 
            onClick={() => setActiveTab('security')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: activeTab === 'security' ? '#f0fcfc' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: activeTab === 'security' ? 'var(--yaperz-green)' : '#555', textAlign: 'left' }}
          >
            <Shield size={18} /> SECURITY & PASSWORD
          </button>
          <button 
            onClick={() => setActiveTab('devices')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: activeTab === 'devices' ? '#f0fcfc' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: activeTab === 'devices' ? 'var(--yaperz-green)' : '#555', textAlign: 'left' }}
          >
            <MonitorSmartphone size={18} /> LOGGED IN DEVICES
          </button>
          <button 
            onClick={() => setActiveTab('account-actions')}
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px', background: activeTab === 'account-actions' ? '#fff0f0' : 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: activeTab === 'account-actions' ? '#e11b23' : '#555', textAlign: 'left' }}
          >
            <LogOut size={18} /> LOGOUT OPTIONS
          </button>
        </div>

        {/* Settings Content */}
        <div style={{ background: '#f9f9f9', padding: '40px', borderRadius: '12px', border: '1.5px solid #eee' }}>
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '25px' }}>PUBLIC PROFILE</h2>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', marginBottom: '8px' }}>FULL NAME</label>
                <div style={{ position: 'relative' }}>
                  <User size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                  <input 
                    type="text" 
                    value={localUser.username} 
                    onChange={(e) => setLocalUser({...localUser, username: e.target.value})}
                    style={{ width: '100%', padding: '12px 12px 12px 40px', border: '1.5px solid #eee', borderRadius: '6px' }} 
                  />
                </div>
              </div>
              <div style={{ marginBottom: '30px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', marginBottom: '8px' }}>EMAIL ADDRESS</label>
                <div style={{ position: 'relative' }}>
                  <Mail size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                  <input 
                    type="email" 
                    value={localUser.email} 
                    onChange={(e) => setLocalUser({...localUser, email: e.target.value})}
                    style={{ width: '100%', padding: '12px 12px 12px 40px', border: '1.5px solid #eee', borderRadius: '6px' }} 
                  />
                </div>
              </div>
              <button type="submit" className="btn-red" style={{ padding: '12px 30px', borderRadius: '6px', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Save size={18} /> SAVE CHANGES
              </button>
            </form>
          )}

          {activeTab === 'security' && (
            <form onSubmit={otpSent ? handleVerifyPasswordChange : handleInitPasswordChange}>
              <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '25px' }}>SECURITY & PASSWORD</h2>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', marginBottom: '8px' }}>CURRENT PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showCurrentPassword ? "text" : "password"} 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    disabled={otpSent}
                    autoComplete="current-password" 
                    style={{ width: '100%', padding: '12px', paddingRight: '40px', border: '1.5px solid #eee', borderRadius: '6px' }} 
                  />
                  <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', marginBottom: '8px' }}>NEW PASSWORD</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showNewPassword ? "text" : "password"} 
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={otpSent}
                    autoComplete="new-password" 
                    style={{ width: '100%', padding: '12px', paddingRight: '40px', border: '1.5px solid #eee', borderRadius: '6px' }} 
                  />
                  <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#888' }}>
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {otpSent && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: '800', marginBottom: '8px', color: 'var(--yaperz-green)' }}>ENTER OTP (Sent to {user?.email || ''})</label>
                  <input 
                    type="text" 
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter 6-digit OTP"
                    style={{ width: '100%', padding: '12px', border: '1.5px solid var(--yaperz-green)', borderRadius: '6px' }} 
                  />
                </div>
              )}

              <div style={{ marginTop: '40px', paddingTop: '30px', borderTop: '1px solid #eee' }}>
                <h3 style={{ fontSize: '16px', fontWeight: '900', color: '#e11b23', marginBottom: '10px' }}>DANGER ZONE</h3>
                <p style={{ fontSize: '13px', color: '#666', marginBottom: '15px' }}>Once you delete your account, there is no going back. Please be certain.</p>
                <button type="button" onClick={handleDeleteAccount} style={{ padding: '10px 20px', border: '1.5px solid #e11b23', color: '#e11b23', background: 'white', borderRadius: '6px', fontSize: '13px', fontWeight: '800', cursor: 'pointer' }}>
                  DELETE ACCOUNT
                </button>
              </div>
            </form>
          )}
          {activeTab === 'devices' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '10px' }}>LOGGED IN DEVICES</h2>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '25px' }}>Active sessions currently logged into your account.</p>

              {loadingSessions ? (
                <p style={{ fontSize: '13px', color: '#888' }}>Loading devices...</p>
              ) : sessions.length === 0 ? (
                <p style={{ fontSize: '13px', color: '#888' }}>No active devices found.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {sessions.map((session) => (
                    <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'white', borderRadius: '8px', border: '1px solid #eee', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <MonitorSmartphone size={20} color="#008080" />
                        <div>
                          <p style={{ fontSize: '14px', fontWeight: '800', margin: 0 }}>
                            {session.device_name || 'Unknown Device'} - {session.browser || 'Browser'}
                            {session.isCurrent && <span style={{ marginLeft: '8px', fontSize: '10px', background: '#008080', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>This Device</span>}
                          </p>
                          <p style={{ fontSize: '11px', color: '#888', margin: '2px 0 0 0' }}>
                            {session.os || ''} • {session.country || 'Location N/A'}
                          </p>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <button onClick={() => revokeSession(session.id)} style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', background: 'transparent', border: '1px solid #e11b23', color: '#e11b23', cursor: 'pointer' }}>
                          LOGOUT
                        </button>
                      )}
                    </div>
                  ))}

                  <div style={{ marginTop: '20px' }}>
                    <button onClick={handleLogoutAll} style={{ padding: '10px 20px', background: '#e11b23', color: 'white', border: 'none', borderRadius: '6px', fontSize: '13px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <LogOut size={16} /> LOGOUT ALL OTHER DEVICES
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'account-actions' && (
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '10px' }}>LOGOUT OPTIONS</h2>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '25px' }}>Manage your active login sessions and sign out securely.</p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '400px' }}>
                <div style={{ padding: '20px', background: 'white', borderRadius: '10px', border: '1px solid #eee' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '900' }}>Logout This Device</h4>
                  <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#666' }}>Sign out of Aura Store on this browser session.</p>
                  <button onClick={() => { logout(); navigate('/'); }} style={{ width: '100%', padding: '12px', background: 'var(--text-primary)', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <LogOut size={16} /> LOGOUT THIS DEVICE
                  </button>
                </div>

                <div style={{ padding: '20px', background: '#fff0f0', borderRadius: '10px', border: '1px solid #ffcdd2' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '15px', fontWeight: '900', color: '#e11b23' }}>Logout All Devices</h4>
                  <p style={{ margin: '0 0 15px 0', fontSize: '12px', color: '#666' }}>Terminate all logged-in sessions across all browsers and devices.</p>
                  <button onClick={handleLogoutAll} style={{ width: '100%', padding: '12px', background: '#e11b23', color: 'white', border: 'none', borderRadius: '6px', fontWeight: '800', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <LogOut size={16} /> LOGOUT ALL DEVICES
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
