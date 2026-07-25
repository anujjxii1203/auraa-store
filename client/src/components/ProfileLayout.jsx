import { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Package, Heart, LogOut, MapPin, Settings as SettingsIcon, MonitorSmartphone, Menu, ChevronDown, User as UserIcon, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import api from '../api/client';
import BackButton from './BackButton';
import PageTitle from './PageTitle';

const ProfileLayout = () => {
  const { user, logout } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [isNavOpen, setIsNavOpen] = useState(false);

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

  const getActiveTabName = () => {
    if (path === '/profile') return 'MY ORDERS';
    if (path === '/about') return 'ABOUT ACCOUNT';
    if (path === '/wishlist') return 'WISHLIST';
    if (path === '/addresses') return 'ADDRESSES';
    if (path === '/settings') return 'SETTINGS';
    return 'MY ACCOUNT';
  };

  return (
    <div className="container" style={{ padding: '20px' }}>
      <PageTitle title="My Account" />
      <BackButton />
      <div className="profile-wrapper" style={{ marginTop: '20px' }}>
        {/* Sidebar */}
        <div className="profile-sidebar" style={{ background: 'var(--ss-light-grey)', padding: '20px', borderRadius: '12px', height: 'fit-content' }}>
          <div className="profile-sidebar-header">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px', textAlign: 'left' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
                <div className="avatar" style={{ width: '50px', height: '50px', background: '#008080', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '900', flexShrink: 0 }}>
                  {(user?.username || 'A').charAt(0).toUpperCase()}
                </div>
                <h2 style={{ fontSize: '18px', fontWeight: '950', color: 'var(--text-primary)', margin: 0, wordBreak: 'break-word' }}>
                  {(user?.username || 'Customer').toUpperCase()}
                </h2>
              </div>

              {/* Far-Right Aura Points Icon Pill */}
              <div 
                title="Aura Points Balance"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px', 
                  background: '#212121', 
                  color: '#fff', 
                  padding: '6px 14px', 
                  borderRadius: '20px', 
                  fontSize: '12px', 
                  fontWeight: '900',
                  marginLeft: 'auto',
                  flexShrink: 0
                }}
              >
                <Sparkles size={14} color="#ffd700" fill="#ffd700" />
                <span style={{ color: '#ff4444', fontWeight: '950' }}>{user?.points || 0}</span>
              </div>
            </div>

            {/* Mobile Hamburger Toggle Bar */}
            <button 
              className="profile-mobile-toggle"
              onClick={() => setIsNavOpen(!isNavOpen)}
              style={{
                width: '100%',
                display: 'none',
                alignItems: 'center',
                justify: 'space-between',
                padding: '12px 16px',
                background: 'var(--bg-primary)',
                border: '1.5px solid var(--border-color)',
                borderRadius: '8px',
                marginTop: '15px',
                fontWeight: '900',
                fontSize: '13px',
                color: '#008080',
                cursor: 'pointer'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Menu size={18} />
                <span>{getActiveTabName()}</span>
              </div>
              <ChevronDown size={18} style={{ transform: isNavOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.2s' }} />
            </button>
          </div>

          <nav className={`profile-sidebar-nav ${isNavOpen ? 'mobile-open' : ''}`} style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '15px' }}>
            <Link to="/profile" onClick={() => setIsNavOpen(false)} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: path === '/profile' ? 'var(--bg-primary)' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: path === '/profile' ? '#008080' : 'var(--text-primary)' }}>
                <Package size={18} /> MY ORDERS
              </div>
            </Link>
            <Link to="/about" onClick={() => setIsNavOpen(false)} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: path === '/about' ? 'var(--bg-primary)' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: path === '/about' ? '#008080' : 'var(--text-primary)' }}>
                <UserIcon size={18} /> ABOUT ACCOUNT
              </div>
            </Link>
            <Link to="/wishlist" onClick={() => setIsNavOpen(false)} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: path === '/wishlist' ? 'var(--bg-primary)' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: path === '/wishlist' ? '#008080' : 'var(--text-primary)' }}>
                <Heart size={18} /> WISHLIST
              </div>
            </Link>
            <Link to="/addresses" onClick={() => setIsNavOpen(false)} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: path === '/addresses' ? 'var(--bg-primary)' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: path === '/addresses' ? '#008080' : 'var(--text-primary)' }}>
                <MapPin size={18} /> ADDRESSES
              </div>
            </Link>
            <Link to="/settings" onClick={() => setIsNavOpen(false)} style={{ textDecoration: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: path === '/settings' ? 'var(--bg-primary)' : 'transparent', borderRadius: '8px', cursor: 'pointer', fontWeight: '800', color: path === '/settings' ? '#008080' : 'var(--text-primary)' }}>
                <SettingsIcon size={18} /> SETTINGS
              </div>
            </Link>
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
