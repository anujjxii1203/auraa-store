import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Package, Heart, LogOut, MapPin, Settings as SettingsIcon, MonitorSmartphone } from 'lucide-react';
import { useUser } from '../context/UserContext';
import api from '../api/client';
import BackButton from './BackButton';
import PageTitle from './PageTitle';

const ProfileLayout = () => {
  const { user, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;

  const handleLogoutAll = async () => {
    try {
      await api.post('/api/auth/logout-all');
    } catch (err) {
      console.warn("Logout all failed", err);
    } finally {
      logout();
      navigate('/');
    }
  };

  return (
    <div className="container" style={{ padding: '20px' }}>
      <PageTitle title="My Account" />
      <BackButton />
      <div className="profile-wrapper" style={{ marginTop: '20px' }}>
        
        {/* Sidebar */}
        <div className="profile-sidebar" style={{ background: 'var(--ss-light-grey)', padding: '20px', borderRadius: '12px', height: 'fit-content' }}>
          <div className="profile-sidebar-header" style={{ textAlign: 'center', marginBottom: '30px' }}>
            <div className="avatar" style={{ width: '80px', height: '80px', background: '#008080', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '32px', fontWeight: '900', margin: '0 auto 15px' }}>
              {(user?.username || 'A').charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: '950', color: 'var(--text-primary)' }}>{(user?.username || 'Customer').toUpperCase()}</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{user?.email || ''}</p>
            </div>
            
            <div className="points-card" style={{ background: '#212121', color: '#fff', margin: '20px 0 10px', padding: '15px', borderRadius: '8px', border: '1px solid #333', textAlign: 'left' }}>
              <div style={{ fontSize: '11px', color: '#aaa', fontWeight: '800', letterSpacing: '1px', marginBottom: '5px' }}>AURA POINTS</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#ff4444' }}>{user?.points || 0}</div>
            </div>
          </div>
          
          <nav className="profile-sidebar-nav" style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <Link to="/profile" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: path === '/profile' ? 'var(--bg-primary)' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: path === '/profile' ? '#008080' : 'var(--text-primary)' }}>
                <Package size={18} /> MY ORDERS
              </div>
            </Link>
            <Link to="/wishlist" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: path === '/wishlist' ? 'var(--bg-primary)' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: path === '/wishlist' ? '#008080' : 'var(--text-primary)' }}>
                <Heart size={18} /> WISHLIST
              </div>
            </Link>
            <Link to="/addresses" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: path === '/addresses' ? 'var(--bg-primary)' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: path === '/addresses' ? '#008080' : 'var(--text-primary)' }}>
                <MapPin size={18} /> ADDRESSES
              </div>
            </Link>
            <Link to="/settings" style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: path === '/settings' ? 'var(--bg-primary)' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: path === '/settings' ? '#008080' : 'var(--text-primary)' }}>
                <SettingsIcon size={18} /> SETTINGS
              </div>
            </Link>
            
            <div onClick={() => { logout(); navigate('/'); }} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: 'var(--text-primary)', marginTop: '20px', borderTop: '1px solid var(--border-color)' }}>
              <LogOut size={18} /> LOGOUT
            </div>
            <div onClick={handleLogoutAll} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: '#e11b23' }}>
              <LogOut size={18} /> LOGOUT ALL DEVICES
            </div>
          </nav>
        </div>

        {/* Main Content Area */}
        <div style={{ width: '100%', minWidth: 0 }}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;
