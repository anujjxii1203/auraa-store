import { useEffect, useState } from 'react';
import { User, Mail, Award, Calendar, ShieldCheck, MapPin, ShoppingBag } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { formatPrice } from '../utils/formatters';
import api from '../api/client';

const AboutUser = () => {
  const { user } = useUser();
  const [stats, setStats] = useState({ totalOrders: 0, spent: 0 });

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const res = await api.get('/orders/me');
        const orders = res.data || [];
        const total = orders.reduce((sum, o) => sum + Number(o.amount || 0), 0);
        setStats({ totalOrders: orders.length, spent: total });
      } catch (err) {
        console.error('Failed to fetch user stats:', err);
      }
    };
    fetchUserStats();
  }, []);

  return (
    <div style={{ width: '100%', minWidth: 0 }}>
      <div style={{ marginBottom: '25px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '950', color: 'var(--text-primary)', margin: 0 }}>ABOUT ACCOUNT</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '4px' }}>
          Personal information and membership overview.
        </p>
      </div>

      {/* Main Account Info Card */}
      <div style={{ background: 'var(--bg-secondary)', padding: '25px', borderRadius: '12px', border: '1.5px solid var(--border-color)', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '25px', flexWrap: 'wrap' }}>
          <div style={{ width: '70px', height: '70px', background: '#008080', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: '900' }}>
            {(user?.username || 'A').charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '22px', fontWeight: '950', color: 'var(--text-primary)' }}>
              {(user?.username || 'Customer').toUpperCase()}
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>{user?.email}</p>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#e8f5e9', color: '#2e7d32', padding: '3px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '900', marginTop: '8px' }}>
              <ShieldCheck size={14} /> VERIFIED MEMBER
            </div>
          </div>
        </div>

        {/* Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '15px' }}>
          <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>
              <User size={16} color="#008080" /> FULL NAME
            </div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: 'var(--text-primary)' }}>{user?.username || 'N/A'}</p>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>
              <Mail size={16} color="#008080" /> EMAIL ADDRESS
            </div>
            <p style={{ margin: 0, fontSize: '14px', fontWeight: '900', color: 'var(--text-primary)', wordBreak: 'break-all' }}>{user?.email || 'N/A'}</p>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>
              <Award size={16} color="#ff4444" /> AURA REWARD POINTS
            </div>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '950', color: '#ff4444' }}>{user?.points || 0} Points</p>
          </div>

          <div style={{ background: 'var(--bg-primary)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#666', fontSize: '12px', fontWeight: '800', marginBottom: '6px' }}>
              <ShoppingBag size={16} color="#008080" /> TOTAL ORDERS PLACED
            </div>
            <p style={{ margin: 0, fontSize: '15px', fontWeight: '900', color: 'var(--text-primary)' }}>{stats.totalOrders} Orders</p>
          </div>
        </div>
      </div>

      {/* Privileges Banner */}
      <div style={{ background: '#f0fcfc', padding: '20px', borderRadius: '12px', border: '1px solid #d0f0f0', display: 'flex', alignItems: 'center', gap: '15px' }}>
        <Award size={28} color="#008080" />
        <div>
          <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '900', color: '#008080' }}>AURA PRIVILEGE MEMBER</h4>
          <p style={{ margin: 0, fontSize: '13px', color: '#555' }}>You enjoy free express shipping and 10% cashback in Aura Points on every streetwear purchase.</p>
        </div>
      </div>
    </div>
  );
};

export default AboutUser;
