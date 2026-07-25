import { useEffect, useState } from 'react';
import api from '../api/client';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext';
import { FALLBACK_IMAGE, formatPrice } from '../utils/formatters';
import { Search, SlidersHorizontal, ChevronRight, Star, ArrowLeft } from 'lucide-react';
import PageTitle from '../components/PageTitle';

const Profile = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchOrders();
  }, [user]);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/orders/me');
      
      const formattedItems = [];
      res.data.forEach(order => {
        let parsedMeta = {};
        try {
          parsedMeta = typeof order.metadata === 'string' ? JSON.parse(order.metadata) : (order.metadata || {});
        } catch(e) {}
        const items = Array.isArray(parsedMeta) ? parsedMeta : (parsedMeta.items || []);
        
        items.forEach(item => {
          formattedItems.push({
            orderId: order.id,
            reference: order.reference,
            date: new Date(order.created_at).toLocaleDateString(),
            orderStatus: (order.status_track || 'processing').toLowerCase(),
            paymentStatus: order.status,
            ...item
          });
        });
      });
      
      setOrders(formattedItems);
    } catch (err) {
      console.error('Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  const filters = ['All', 'Delivered', 'Cancelled', 'Returned'];

  const getStatusText = (status, date) => {
    if (status === 'delivered') return { text: `Delivered on ${date}`, color: '#26a541', sub: 'Your item has been delivered' };
    if (status === 'shipped') return { text: `Shipped on ${date}`, color: '#26a541', sub: 'Your item is on the way' };
    if (status === 'cancelled') return { text: 'Cancelled', color: '#ff6161', sub: 'As per your request, your item has been cancelled' };
    if (status === 'returned') return { text: 'Return Completed', color: '#26a541', sub: 'Refund has been initiated' };
    return { text: `Processing`, color: '#26a541', sub: 'Seller has processed your order' };
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading orders...</div>;

  return (
    <div className="fk-page-bg">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' }}>
        <PageTitle title="My Orders" />
        <button onClick={() => navigate('/settings')} style={{ background: 'transparent', border: 'none', color: '#2874f0', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          Account Settings <ChevronRight size={16} />
        </button>
      </div>
      
      {/* Search & Filters */}
      <div className="fk-orders-search-container">
        <div className="fk-orders-search">
          <Search size={18} color="#878787" />
          <input 
            type="text" 
            placeholder="Search your order..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#878787', fontSize: '14px', cursor: 'pointer' }}>
          <SlidersHorizontal size={18} /> Filters
        </div>
      </div>
      
      <div className="fk-filters">
        {filters.map(f => (
          <div 
            key={f} 
            className={`fk-filter-chip ${activeFilter === f ? 'active' : ''}`}
            onClick={() => setActiveFilter(f)}
          >
            {f}
          </div>
        ))}
      </div>

      {/* Orders List */}
      <div style={{ marginTop: '8px' }}>
        {orders.length === 0 ? (
          <div style={{ padding: '40px', background: 'white', textAlign: 'center', color: '#878787' }}>No orders found</div>
        ) : (
          orders.map((item, idx) => {
            const statusInfo = getStatusText(item.orderStatus, item.date);
            return (
              <div key={`${item.orderId}-${idx}`} className="fk-card fk-order-item" onClick={() => navigate(`/order/${item.reference}`)}>
                <div className="fk-order-img-container">
                  <img src={item.image || FALLBACK_IMAGE} alt={item.name} className="fk-order-img" />
                </div>
                <div className="fk-order-info">
                  <div className="fk-order-status-title" style={{ color: statusInfo.color }}>
                    {item.orderStatus === 'delivered' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#26a541', marginRight: 4 }} />}
                    {statusInfo.text}
                  </div>
                  <div className="fk-order-status-sub">{statusInfo.sub}</div>
                  
                  <div className="fk-order-rate-section">
                    <span style={{ fontSize: '13px', color: '#212121' }}>Rate & Review</span>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {[1,2,3,4,5].map(s => <Star key={s} size={18} color="#c2c2c2" />)}
                    </div>
                  </div>
                </div>
                <ChevronRight size={20} color="#878787" style={{ alignSelf: 'center' }} />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default Profile;
