import { useEffect, useState } from 'react';
import api from '../api/client';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Package, Heart, LogOut, MapPin, Settings as SettingsIcon, ChevronDown, ChevronUp, Truck, CheckCircle, Home, MonitorSmartphone } from 'lucide-react';
import BackButton from '../components/BackButton';
import PageTitle from '../components/PageTitle';
import { useUser } from '../context/UserContext';
import { FALLBACK_IMAGE, formatPrice } from '../utils/formatters';

const getSavedOrders = (email) => {
  if (!email) return [];
  try {
    return JSON.parse(localStorage.getItem(`orders_${email}`) || '[]');
  } catch {
    localStorage.removeItem(`orders_${email}`);
    return [];
  }
};

const Profile = () => {
  const { user, logout } = useUser();

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
  const navigate = useNavigate();
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('orders');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
    fetchSessions();
  }, [user]);

  const fetchSessions = async () => {
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data);
    } catch (err) {
      console.error('Failed to fetch sessions');
    }
  };

  const revokeSession = async (id) => {
    try {
      await api.delete(`/auth/sessions/${id}`);
      fetchSessions();
    } catch (err) {
      console.error('Failed to revoke session');
    }
  };

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/me');
      // Format backend orders to match UI structure
      const formatted = res.data.map(order => {
        let parsedMeta = {};
        try {
          parsedMeta = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : (order.metadata || {});
        } catch(e) {}
        const items = Array.isArray(parsedMeta) ? parsedMeta : (parsedMeta.items || []);

        return {
          id: order.id,
          reference: order.reference,
          date: new Date(order.created_at).toLocaleDateString(),
          total: order.amount,
          status: (order.status_track || 'processing').toLowerCase(),
          payment_status: order.status,
          items: items
        };
      });
      setOrders(formatted);
    } catch (err) {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const toggleOrder = (id) => {
    setExpandedOrder(expandedOrder === id ? null : id);
  };

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
        <div>
          {activeTab === 'orders' ? (
            <>
              <h1 style={{ fontSize: '28px', fontWeight: '950', marginBottom: '30px', color: 'var(--text-primary)' }}>RECENT ORDERS</h1>
              
              {orders.length === 0 ? (
                <div style={{ padding: '40px', background: 'var(--ss-light-grey)', borderRadius: '12px', textAlign: 'center', border: '1.5px dashed var(--border-color)' }}>
                  <p style={{ color: 'var(--text-secondary)', fontWeight: '700', marginBottom: '20px' }}>You haven't placed any orders yet.</p>
                  <Link to="/" className="btn-red" style={{ padding: '12px 25px', borderRadius: '6px', textDecoration: 'none', fontSize: '13px', display: 'inline-block' }}>START SHOPPING</Link>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  {orders.map((order) => (
                    <div key={order.id} style={{ border: '1.5px solid var(--border-color)', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-primary)' }}>
                      <div 
                        className="order-header" 
                        onClick={() => navigate(`/order/${order.reference || order.id}`)}
                        style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', transition: '0.2s', '&:hover': { background: 'var(--ss-light-grey)' } }}
                      >
                        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                          <div style={{ display: 'flex' }}>
                            {order.items.slice(0, 3).map((item, idx) => (
                              <img key={idx} src={item.image || FALLBACK_IMAGE} alt={item.name} onError={(e) => e.currentTarget.src = FALLBACK_IMAGE} style={{ width: '50px', height: '65px', objectFit: 'cover', borderRadius: '6px', marginLeft: idx > 0 ? '-25px' : '0', border: '2px solid var(--bg-primary)', zIndex: 10 - idx }} />
                            ))}
                          </div>
                          <div>
                            <p style={{ fontWeight: '900', fontSize: '14px', color: 'var(--text-primary)' }}>ORDER #{order.reference || order.id}</p>
                            <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{order.date}</p>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '20px' }}>
                          <div>
                            <p style={{ fontWeight: '900', fontSize: '15px', color: 'var(--text-primary)' }}>{formatPrice(order.total)}</p>
                            <p style={{ fontSize: '11px', color: order.status === 'delivered' ? 'var(--yaperz-green)' : '#e11b23', fontWeight: '800' }}>
                              {order.status === 'delivered' ? `DELIVERED ON ${order.date}` : order.status.toUpperCase()}
                            </p>
                          </div>
                          <button style={{ padding: '8px 16px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '6px', fontSize: '12px', fontWeight: '800', cursor: 'pointer' }}>
                            VIEW DETAILS
                          </button>
                        </div>
                      </div>

                      <div style={{ borderTop: '1px solid var(--border-color)', padding: '12px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--ss-light-grey)' }}>
                        <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>RATE & REVIEW</span>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <svg key={star} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ cursor: 'pointer', color: 'var(--text-secondary)' }} onClick={() => navigate(`/order/${order.reference || order.id}`)}>
                              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                            </svg>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : activeTab === 'sessions' ? (
            <>
              <h1 style={{ fontSize: '28px', fontWeight: '950', marginBottom: '30px', color: 'var(--text-primary)' }}>ACTIVE SESSIONS</h1>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {sessions.map((session) => (
                  <div key={session.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px', border: '1.5px solid var(--border-color)', borderRadius: '12px', background: 'var(--bg-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '40px', height: '40px', background: 'var(--ss-light-grey)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}>
                        <MonitorSmartphone size={20} />
                      </div>
                      <div>
                        <p style={{ fontSize: '15px', fontWeight: '900', color: 'var(--text-primary)' }}>
                          {session.device_name || 'Unknown Device'} - {session.browser || 'Unknown Browser'}
                          {session.isCurrent && <span style={{ marginLeft: '10px', fontSize: '11px', background: '#008080', color: 'white', padding: '2px 6px', borderRadius: '4px' }}>This Device</span>}
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {session.os || 'Unknown OS'} • {session.country || 'Unknown Location'} • Last Active: {new Date(session.last_active).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <button onClick={() => revokeSession(session.id)} style={{ padding: '8px 16px', borderRadius: '6px', fontSize: '12px', fontWeight: '800', background: 'transparent', border: '1px solid #e11b23', color: '#e11b23', cursor: 'pointer' }}>
                        LOGOUT DEVICE
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </>
          ) : null}

          <div style={{ marginTop: '40px', background: '#f0fcfc', padding: '25px', borderRadius: '12px', border: '1px solid #d0f0f0' }}>
            <h3 style={{ fontWeight: '900', color: 'var(--yaperz-green)', marginBottom: '10px', fontSize: '14px' }}>AURA PRIVILEGE MEMBER</h3>
            <p style={{ fontSize: '13px', color: '#555', lineHeight: '1.5' }}>You've unlocked free shipping on all orders and 10% cashback on your next streetwear grab!</p>
          </div>
        </div>
    </div>
  );
};

export default Profile;
