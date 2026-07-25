import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Package, Truck, CheckCircle, Home, ArrowLeft, Star, RotateCcw, Copy, ChevronDown, ChevronUp, Download, HelpCircle } from 'lucide-react';
import { formatPrice, FALLBACK_IMAGE } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // States for UI
  const [timelineExpanded, setTimelineExpanded] = useState(false);
  const [activeAccordion, setActiveAccordion] = useState('');

  // States for Review Modal
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reviewProduct, setReviewProduct] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const handleReturn = async (item) => {
    const reason = prompt("Please enter a reason for returning this item:");
    if (!reason) return;
    try {
      await api.post('/returns', { 
        orderId: order.id, 
        productId: item.id || item.product_id, 
        productName: item.name, 
        reason 
      });
      showToast("Return request submitted! Our team will contact you shortly.", "success");
    } catch(err) {
      showToast("Failed to submit return request", "error");
    }
  };

  const handleReviewSubmit = async () => {
    try {
      await api.post('/reviews', { 
        productId: reviewProduct.id || reviewProduct.product_id, 
        rating, 
        comment 
      });
      showToast("Review submitted successfully!", "success");
      setReviewModalOpen(false);
      setComment("");
      setRating(5);
    } catch(err) {
      showToast("Failed to submit review", "error");
    }
  };

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const res = await api.get('/orders/me');
        const foundOrder = res.data.find(o => o.id.toString() === id || o.reference === id);
        
        if (foundOrder) {
          let parsedMeta = {};
          try {
            parsedMeta = typeof foundOrder.metadata === 'string' ? JSON.parse(foundOrder.metadata) : (foundOrder.metadata || {});
          } catch(e) {}
          const items = Array.isArray(parsedMeta) ? parsedMeta : (parsedMeta.items || []);

          const formatted = {
            id: foundOrder.id,
            reference: foundOrder.reference,
            date: new Date(foundOrder.created_at).toLocaleDateString(),
            total: foundOrder.amount,
            status: (foundOrder.status_track || 'processing').toLowerCase(),
            payment_status: foundOrder.status,
            user_name: foundOrder.user_name || 'Customer',
            items: items
          };
          setOrder(formatted);
        }
      } catch (err) {
        console.error('Failed to fetch order details:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrderDetails();
  }, [id]);

  if (loading) {
    return <div style={{ padding: '100px 20px', textAlign: 'center' }}>Loading order details...</div>;
  }

  if (!order) {
    return <div style={{ padding: '100px 20px', textAlign: 'center' }}>Order not found</div>;
  }

  const primaryItem = order.items[0] || {};
  const otherItems = order.items.slice(1);

  const getStatusStep = (status) => {
    switch (status) {
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'out for delivery': return 3;
      case 'delivered': return 4;
      default: return 0;
    }
  };

  const currentStep = getStatusStep(order.status);

  const copyOrderId = () => {
    navigator.clipboard.writeText(order.reference || order.id);
    showToast('Order ID copied!', 'success');
  };

  const toggleAccordion = (name) => {
    setActiveAccordion(activeAccordion === name ? '' : name);
  };

  return (
    <div className="fk-page-bg">
      <div style={{ background: 'white', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <ArrowLeft size={24} onClick={() => navigate('/profile')} style={{ cursor: 'pointer' }} />
          <h1 style={{ fontSize: '18px', fontWeight: '500', margin: 0 }}>Order Details</h1>
        </div>
        <button style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'white', border: '1px solid #d7d7d7', padding: '6px 12px', borderRadius: '4px', fontSize: '14px', fontWeight: '500' }}>
          Help
        </button>
      </div>

      <div className="fk-card" style={{ marginTop: '0', borderRadius: '0' }}>
        <div className="fk-order-header">
          <img src={primaryItem.image || FALLBACK_IMAGE} alt="product" className="fk-order-header-img" />
          <div className="fk-order-header-info">
            <h2>{primaryItem.name || 'Product'}</h2>
            <p>Size: {primaryItem.selectedSize || primaryItem.size || 'Free'} • Qty: {primaryItem.quantity || 1}</p>
          </div>
        </div>
        <div className="fk-order-id-section">
          <span style={{ fontSize: '12px', color: '#878787' }}>Order #{order.reference || order.id}</span>
          <Copy size={14} color="#2874f0" style={{ cursor: 'pointer' }} onClick={copyOrderId} />
        </div>
      </div>

      <div className="fk-card">
        <div 
          style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setTimelineExpanded(!timelineExpanded)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {currentStep >= 4 ? (
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#26a541', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={16} color="white" />
              </div>
            ) : (
              <div style={{ width: 24, height: 24, borderRadius: '50%', background: '#ff9000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={16} color="white" />
              </div>
            )}
            <span style={{ fontSize: '16px', fontWeight: '500', color: currentStep >= 4 ? '#26a541' : '#ff9000', textTransform: 'capitalize' }}>
              {order.status}, {order.date}
            </span>
          </div>
          {timelineExpanded ? <ChevronUp size={20} color="#878787" /> : <ChevronDown size={20} color="#878787" />}
        </div>

        {timelineExpanded && (
          <div className="fk-timeline-container">
            <div className="fk-timeline-item">
              <div className="fk-timeline-line active" />
              <div className="fk-timeline-dot active" />
              <div className="fk-timeline-content">
                <div className="fk-timeline-title">Order Confirmed</div>
                <div className="fk-timeline-sub">Your Order has been placed.</div>
              </div>
            </div>
            <div className="fk-timeline-item">
              <div className={`fk-timeline-line ${currentStep >= 2 ? 'active' : ''}`} />
              <div className={`fk-timeline-dot ${currentStep >= 2 ? 'active' : ''}`} />
              <div className="fk-timeline-content">
                <div className="fk-timeline-title">Shipped</div>
                {currentStep >= 2 ? (
                  <div className="fk-timeline-sub">Your item has been shipped.</div>
                ) : (
                  <div className="fk-timeline-sub" style={{ opacity: 0.5 }}>Pending shipment</div>
                )}
              </div>
            </div>
            <div className="fk-timeline-item">
              <div className={`fk-timeline-line ${currentStep >= 3 ? 'active' : ''}`} />
              <div className={`fk-timeline-dot ${currentStep >= 3 ? 'active' : ''}`} />
              <div className="fk-timeline-content">
                <div className="fk-timeline-title">Out For Delivery</div>
                {currentStep >= 3 && <div className="fk-timeline-sub">Your item is out for delivery</div>}
              </div>
            </div>
            <div className="fk-timeline-item">
              <div className={`fk-timeline-line ${currentStep >= 4 ? 'active' : ''}`} />
              <div className={`fk-timeline-dot ${currentStep >= 4 ? 'active' : ''}`} />
              <div className="fk-timeline-content">
                <div className="fk-timeline-title">Delivered</div>
                {currentStep >= 4 && <div className="fk-timeline-sub">Your item has been delivered</div>}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fk-card">
        <div style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <RotateCcw size={20} color="#2874f0" />
          <span style={{ fontSize: '14px', fontWeight: '500', color: '#212121' }}>Return window available for 7 days</span>
        </div>
      </div>

      <div className="fk-card">
        <div className="fk-accordion-header" onClick={() => toggleAccordion('delivery')}>
          Delivery details
          {activeAccordion === 'delivery' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        {activeAccordion === 'delivery' && (
          <div className="fk-accordion-content">
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Home size={18} color="#878787" style={{ marginTop: '2px' }} />
              <div>
                <p style={{ fontSize: '14px', fontWeight: '500', margin: '0 0 8px 0' }}>Home</p>
                <p style={{ fontSize: '14px', color: '#212121', marginBottom: '8px' }}>Delivery address is linked to your account.</p>
                <p style={{ fontSize: '14px', color: '#212121' }}>{order.user_name}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="fk-card">
        <div className="fk-accordion-header" onClick={() => toggleAccordion('price')}>
          Price details
          {activeAccordion === 'price' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        {activeAccordion === 'price' && (
          <div className="fk-accordion-content">
            <div className="fk-detail-row">
              <span>Listing price</span>
              <span>{formatPrice(order.total + 1000)}</span>
            </div>
            <div className="fk-detail-row">
              <span>Special price</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            <div className="fk-detail-row">
              <span>Delivery charges</span>
              <span style={{ color: '#26a541' }}>FREE</span>
            </div>
            <div className="fk-detail-row total">
              <span>Total amount</span>
              <span>{formatPrice(order.total)}</span>
            </div>
            <div style={{ background: '#f5f5f5', padding: '12px', borderRadius: '4px', display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: '#878787' }}>Paid By</span>
              <span style={{ fontWeight: '500' }}>{order.payment_status === 'paid' ? 'Online Payment' : 'Cash On Delivery'}</span>
            </div>
            
            <button className="fk-download-invoice">
              <Download size={16} /> Download Invoice
            </button>
          </div>
        )}
      </div>

      {otherItems.length > 0 && (
        <div className="fk-card">
          <div className="fk-accordion-header" onClick={() => toggleAccordion('items')}>
            Other items in this order
            {activeAccordion === 'items' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
          </div>
          {activeAccordion === 'items' && (
            <div className="fk-accordion-content" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {otherItems.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img src={item.image || FALLBACK_IMAGE} alt="product" style={{ width: 40, height: 40, objectFit: 'contain' }} />
                  <div style={{ flex: 1, fontSize: '14px' }}>
                    <div style={{ color: '#878787' }}>{item.name}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Review Actions */}
      <div style={{ padding: '16px', display: 'flex', gap: '16px' }}>
        <button 
          onClick={() => { setReviewProduct(primaryItem); setReviewModalOpen(true); }}
          style={{ flex: 1, padding: '14px', background: 'white', border: '1px solid #d7d7d7', borderRadius: '4px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
          Rate & Review Product
        </button>
        <button 
          onClick={() => handleReturn(primaryItem)}
          style={{ flex: 1, padding: '14px', background: '#2874f0', color: 'white', border: 'none', borderRadius: '4px', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
          Return
        </button>
      </div>

      {reviewModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', padding: '24px', borderRadius: '8px', width: '90%', maxWidth: '400px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '500' }}>Review {reviewProduct?.name}</h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Rating (1-5)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[1, 2, 3, 4, 5].map(num => (
                  <Star 
                    key={num} 
                    size={28} 
                    fill={num <= rating ? '#26a541' : 'none'} 
                    color={num <= rating ? '#26a541' : '#ccc'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setRating(num)}
                  />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px' }}>Comments</label>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you think about this product?"
                style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #dbdbdb', minHeight: '100px', resize: 'vertical' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setReviewModalOpen(false)}
                style={{ padding: '10px 20px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '500' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleReviewSubmit}
                style={{ padding: '10px 20px', background: '#fb641b', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: '500' }}
              >
                Submit Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
