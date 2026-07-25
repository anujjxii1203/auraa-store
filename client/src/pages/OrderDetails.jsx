import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/client';
import { Package, Truck, CheckCircle, Home, ArrowLeft, Star, RotateCcw } from 'lucide-react';
import PageTitle from '../components/PageTitle';
import { formatPrice, FALLBACK_IMAGE } from '../utils/formatters';
import { useToast } from '../context/ToastContext';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  
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
        // Find the specific order from the list
        const foundOrder = res.data.find(o => o.id.toString() === id || o.reference === id);
        
        if (foundOrder) {
          let parsedMeta = {};
          try {
            parsedMeta = typeof foundOrder.metadata === 'string' ? JSON.parse(foundOrder.metadata) : (foundOrder.metadata || {});
          } catch(e) {
            console.error("Failed to parse metadata", e);
          }
          const items = Array.isArray(parsedMeta) ? parsedMeta : (parsedMeta.items || []);

          const formatted = {
            id: foundOrder.id,
            reference: foundOrder.reference,
            date: new Date(foundOrder.created_at).toLocaleDateString(),
            total: foundOrder.amount,
            status: (foundOrder.status_track || 'processing').toLowerCase(),
            payment_status: foundOrder.status,
            razorpay_order_id: foundOrder.razorpay_order_id,
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
    return (
      <div style={{ padding: '100px 20px', minHeight: '60vh', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2>Loading order details...</h2>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={{ padding: '100px 20px', minHeight: '60vh', background: 'var(--bg-primary)' }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
          <h2>Order not found</h2>
          <p style={{ marginTop: '10px', color: '#666' }}>We couldn't find the details for this order.</p>
          <button 
            onClick={() => navigate('/profile')} 
            style={{ marginTop: '20px', padding: '10px 20px', background: 'var(--text-primary)', color: 'var(--bg-primary)', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const getStatusStep = (status) => {
    switch (status) {
      case 'processing': return 1;
      case 'shipped': return 2;
      case 'delivered': return 3;
      default: return 0;
    }
  };

  const currentStep = getStatusStep(order.status);

  return (
    <div style={{ padding: '60px 20px', minHeight: '80vh', background: 'var(--bg-primary)' }}>
      <PageTitle title={`Order #${order.reference}`} />
      
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <button 
          onClick={() => navigate('/profile')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '700', marginBottom: '30px', color: 'var(--text-primary)' }}
        >
          <ArrowLeft size={16} /> BACK TO ORDERS
        </button>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid var(--border-color)', paddingBottom: '20px', marginBottom: '30px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '950', margin: '0 0 10px 0', letterSpacing: '-1px', color: 'var(--text-primary)' }}>
              ORDER #{order.reference || order.id}
            </h1>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>Placed on {order.date}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ margin: '0 0 5px 0', color: '#666', fontSize: '14px' }}>Total Amount</p>
            <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '900', color: 'var(--ss-red)' }}>
              {formatPrice(order.total)}
            </h2>
          </div>
        </div>

        {/* Tracking Timeline */}
        <div style={{ background: 'var(--bg-secondary)', padding: '30px', borderRadius: '12px', marginBottom: '40px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '25px', color: 'var(--text-primary)' }}>ORDER STATUS</h3>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', margin: '0 20px' }}>
            {/* Connecting line */}
            <div style={{ position: 'absolute', top: '20px', left: 0, right: 0, height: '2px', background: '#e0e0e0', zIndex: 1 }} />
            <div style={{ position: 'absolute', top: '20px', left: 0, right: '0', height: '2px', background: 'var(--teal)', zIndex: 2, width: currentStep >= 3 ? '100%' : currentStep === 2 ? '50%' : '0%', transition: 'width 0.5s ease' }} />

            {/* Steps */}
            <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--teal)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckCircle size={20} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--teal)' }}>PLACED</span>
            </div>

            <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: currentStep >= 1 ? 'var(--teal)' : '#f0f0f0', color: currentStep >= 1 ? 'white' : '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.5s ease' }}>
                <Package size={20} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: currentStep >= 1 ? 'var(--teal)' : '#999' }}>PROCESSING</span>
            </div>

            <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: currentStep >= 2 ? 'var(--teal)' : '#f0f0f0', color: currentStep >= 2 ? 'white' : '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.5s ease' }}>
                <Truck size={20} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: currentStep >= 2 ? 'var(--teal)' : '#999' }}>SHIPPED</span>
            </div>

            <div style={{ position: 'relative', zIndex: 3, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: currentStep >= 3 ? 'var(--teal)' : '#f0f0f0', color: currentStep >= 3 ? 'white' : '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.5s ease' }}>
                <Home size={20} />
              </div>
              <span style={{ fontSize: '12px', fontWeight: '700', color: currentStep >= 3 ? 'var(--teal)' : '#999' }}>DELIVERED</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
          {/* Order Items */}
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '20px', color: 'var(--text-primary)' }}>ITEMS IN THIS ORDER</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {order.items.map((item, idx) => (
                <div key={idx} style={{ display: 'flex', gap: '20px', padding: '20px', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
                  <img 
                    src={item.image || FALLBACK_IMAGE} 
                    alt={item.name} 
                    style={{ width: '100px', height: '120px', objectFit: 'cover', borderRadius: '8px', background: '#e0e0e0' }}
                    onError={(e) => { e.target.src = FALLBACK_IMAGE }}
                  />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', fontSize: '16px', fontWeight: '800', color: 'var(--text-primary)' }}>{item.name}</h4>
                      <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                        Size: {item.selectedSize || item.size} | Qty: {item.quantity || 1}
                      </p>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '15px' }}>
                      <p style={{ margin: 0, fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)' }}>{formatPrice(item.price)}</p>
                      
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button 
                          onClick={() => {
                            setReviewProduct(item);
                            setReviewModalOpen(true);
                          }}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: '0.2s' }}>
                          <Star size={14} /> REVIEW
                        </button>
                        <button 
                          onClick={() => handleReturn(item)}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 12px', background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '6px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', transition: '0.2s', color: 'var(--ss-red)' }}>
                          <RotateCcw size={14} /> RETURN
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment & Shipping Details */}
          <div>
            <div style={{ background: 'var(--bg-secondary)', padding: '25px', borderRadius: '12px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-primary)' }}>PAYMENT DETAILS</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>Subtotal</span>
                <span style={{ fontWeight: '600' }}>{formatPrice(order.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: '#666' }}>Shipping</span>
                <span style={{ fontWeight: '600', color: 'var(--teal)' }}>FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '15px', borderTop: '1px solid var(--border-color)', fontSize: '16px' }}>
                <span style={{ fontWeight: '800' }}>Total Paid</span>
                <span style={{ fontWeight: '900', color: 'var(--ss-red)' }}>{formatPrice(order.total)}</span>
              </div>
              
              <div style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-primary)', borderRadius: '8px' }}>
                <p style={{ margin: '0 0 5px 0', fontSize: '12px', color: '#666', fontWeight: '700' }}>PAYMENT STATUS</p>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '800', color: order.payment_status === 'paid' ? 'var(--teal)' : '#f39c12', textTransform: 'uppercase' }}>
                  {order.payment_status}
                </p>
              </div>
            </div>

            {/* Support */}
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '15px', color: 'var(--text-primary)' }}>NEED HELP?</h3>
              <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px', lineHeight: '1.5' }}>
                If you have any issues with your order, returns, or payment, our support team is available 24/7.
              </p>
              <button 
                onClick={() => window.location.href = 'mailto:support@auraa.com'}
                style={{ width: '100%', padding: '12px', background: 'var(--text-primary)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', transition: '0.2s', textTransform: 'uppercase' }}>
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>

      {reviewModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'var(--bg-primary)', padding: '30px', borderRadius: '12px', width: '90%', maxWidth: '500px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px', fontWeight: '800' }}>Review {reviewProduct?.name}</h2>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '700' }}>Rating (1-5)</label>
              <div style={{ display: 'flex', gap: '10px' }}>
                {[1, 2, 3, 4, 5].map(num => (
                  <Star 
                    key={num} 
                    size={24} 
                    fill={num <= rating ? 'var(--ss-red)' : 'none'} 
                    color={num <= rating ? 'var(--ss-red)' : '#ccc'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setRating(num)}
                  />
                ))}
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '700' }}>Comments</label>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you think about this product?"
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid var(--border-color)', minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button 
                onClick={() => setReviewModalOpen(false)}
                style={{ padding: '10px 20px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '700' }}
              >
                Cancel
              </button>
              <button 
                onClick={handleReviewSubmit}
                style={{ padding: '10px 20px', background: 'var(--ss-red)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700' }}
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
