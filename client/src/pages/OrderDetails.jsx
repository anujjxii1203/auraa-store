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

  // States for Return Modal
  const [returnModalOpen, setReturnModalOpen] = useState(false);
  const [returnProduct, setReturnProduct] = useState(null);
  const [returnReason, setReturnReason] = useState("");
  const [returnDetails, setReturnDetails] = useState("");
  const [returnType, setReturnType] = useState("refund");
  const [returnPhoto, setReturnPhoto] = useState(null);

  const handleReturnSubmit = async () => {
    if (!returnReason) {
      showToast("Please select a reason for returning", "error");
      return;
    }
    try {
      const payload = JSON.stringify({
        primaryReason: returnReason,
        details: returnDetails,
        returnType: returnType,
        hasPhoto: !!returnPhoto
      });

      await api.post('/returns', {
        orderId: order.id,
        productId: returnProduct.id || returnProduct.product_id,
        productName: returnProduct.name,
        reason: payload
      });
      showToast("Return request submitted! Our team will contact you shortly.", "success");
      setReturnModalOpen(false);
      setReturnReason("");
      setReturnDetails("");
      setReturnType("refund");
      setReturnPhoto(null);
    } catch (err) {
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
    } catch (err) {
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
          } catch (e) {
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
            method: foundOrder.method,
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

  const generateInvoice = async () => {
    if (!order) return;

    const { default: jsPDF } = await import('jspdf');
    const { default: autoTable } = await import('jspdf-autotable');

    const doc = new jsPDF();

    doc.setFontSize(22);
    doc.setTextColor(225, 27, 35);
    doc.text('AURA STORE', 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Invoice generated on: ' + new Date().toLocaleDateString(), 14, 28);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text(`Order Reference: #${order.reference || order.id}`, 14, 40);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Order Date: ${order.date}`, 14, 46);
    doc.text(`Payment Method: ${order.method === 'cod' ? 'Cash On Delivery' : 'Online Payment'}`, 14, 52);

    const tableColumn = ["Item Name", "Size", "Qty", "Price", "Total"];
    const tableRows = [];

    order.items.forEach(item => {
      const itemData = [
        item.name,
        item.selectedSize || item.size || 'N/A',
        item.quantity || 1,
        `Rs. ${item.price}`,
        `Rs. ${(item.price * (item.quantity || 1)).toFixed(2)}`
      ];
      tableRows.push(itemData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 65,
      theme: 'grid',
      headStyles: { fillColor: [225, 27, 35] },
    });

    const finalY = doc.lastAutoTable.finalY || 65;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text('Price Details', 14, finalY + 15);

    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);

    const subtotal = order.items.reduce((acc, item) => acc + (item.price * (item.quantity || 1)), 0);

    doc.text(`Subtotal: Rs. ${subtotal.toFixed(2)}`, 14, finalY + 23);
    doc.text(`Shipping: Free`, 14, finalY + 29);
    doc.text(`GST / Tax (Included): Rs. ${(subtotal * 0.18).toFixed(2)}`, 14, finalY + 35);

    doc.setFontSize(12);
    doc.setTextColor(225, 27, 35);
    doc.text(`Total Amount: Rs. ${order.total.toFixed(2)}`, 14, finalY + 45);

    doc.save(`AURA_Invoice_${order.reference || order.id}.pdf`);
  };

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

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '40px' }}>
          {/* LEFT COLUMN */}
          <div>
            {/* Tracking Timeline */}
            <div style={{ background: 'var(--bg-secondary)', padding: '30px', borderRadius: '12px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '25px', color: 'var(--text-primary)' }}>ORDER STATUS</h3>

              <div style={{ position: 'relative', margin: '0 10px' }}>
                {/* Connecting line */}
                <div style={{ position: 'absolute', top: 20, bottom: 20, left: 19, width: '2px', background: '#e0e0e0', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 20, left: 19, width: '2px', background: 'var(--teal)', zIndex: 2, height: currentStep >= 3 ? '100%' : currentStep === 2 ? '66%' : currentStep === 1 ? '33%' : '0%', transition: 'height 0.5s ease' }} />

                {/* Step 1: PLACED */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '30px', position: 'relative', zIndex: 3 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--teal)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckCircle size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>ORDER CONFIRMED</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: '500' }}>Your order has been placed.</p>
                  </div>
                </div>

                {/* Step 2: PROCESSING */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '30px', position: 'relative', zIndex: 3 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: currentStep >= 1 ? 'var(--teal)' : '#f0f0f0', color: currentStep >= 1 ? 'white' : '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Package size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: '800', color: currentStep >= 1 ? 'var(--text-primary)' : '#999' }}>SELLER PROCESSED</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: '500' }}>Seller has processed your order.</p>
                  </div>
                </div>

                {/* Step 3: SHIPPED */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', marginBottom: '30px', position: 'relative', zIndex: 3 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: currentStep >= 2 ? 'var(--teal)' : '#f0f0f0', color: currentStep >= 2 ? 'white' : '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Truck size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: '800', color: currentStep >= 2 ? 'var(--text-primary)' : '#999' }}>SHIPPED</h4>
                    {currentStep >= 2 ? <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: '500' }}>Your item has been shipped.</p> : <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: '500' }}>Pending shipment</p>}
                  </div>
                </div>

                {/* Step 4: DELIVERED */}
                <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', position: 'relative', zIndex: 3 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: currentStep >= 3 ? 'var(--teal)' : '#f0f0f0', color: currentStep >= 3 ? 'white' : '#999', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Home size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: '0 0 5px 0', fontSize: '14px', fontWeight: '800', color: currentStep >= 3 ? 'var(--text-primary)' : '#999' }}>DELIVERED</h4>
                    {currentStep >= 3 ? <p style={{ margin: 0, fontSize: '12px', color: '#666', fontWeight: '500' }}>Your item has been delivered.</p> : null}
                  </div>
                </div>
              </div>
            </div>

            {/* Delivery Details */}
            <div style={{ background: 'var(--bg-secondary)', padding: '25px', borderRadius: '12px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-primary)' }}>DELIVERY DETAILS</h3>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ marginTop: '2px' }}><Home size={20} color="#666" /></div>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: '800', color: 'var(--text-primary)' }}>Home</h4>
                  <p style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#666', lineHeight: '1.5' }}>Delivery address is linked to your account.</p>
                  <p style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)' }}>User • Contact on profile</p>
                </div>
              </div>
            </div>

            {/* Support */}
            <div style={{ marginTop: '30px' }}>
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

          {/* RIGHT COLUMN */}
          <div>
            {/* Return Window */}
            <div style={{ background: 'var(--bg-secondary)', padding: '25px', borderRadius: '12px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '15px' }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--bg-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <RotateCcw size={20} color="#2874f0" />
              </div>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: '800', margin: '0 0 4px 0', color: 'var(--text-primary)' }}>Return window available for 7 days</h3>
                <p style={{ fontSize: '12px', color: '#666', margin: 0 }}>You can easily return this item from your orders panel.</p>
              </div>
            </div>

            {/* Items */}
            <div style={{ marginBottom: '20px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '900', marginBottom: '20px', color: 'var(--text-primary)' }}>ITEMS IN THIS ORDER</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {order.items.map((item, idx) => (
                  <div key={idx} className="order-item-card">
                    <div className="order-item-image-wrapper">
                      <img
                        src={item.image || FALLBACK_IMAGE}
                        alt={item.name}
                        className="order-item-image"
                        style={{ background: '#e0e0e0' }}
                        onError={(e) => { e.target.src = FALLBACK_IMAGE }}
                      />
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        <h4 style={{ margin: '0 0 5px 0', fontSize: '15px', fontWeight: '800', color: 'var(--text-primary)' }}>{item.name}</h4>
                        <p style={{ margin: 0, fontSize: '13px', color: '#666' }}>
                          Size: {item.selectedSize || item.size} | Qty: {item.quantity || 1}
                        </p>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '15px' }}>
                        <p style={{ margin: '13px', fontSize: '16px', fontWeight: '900', color: 'var(--text-primary)' }}>{formatPrice(item.price)}</p>

                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            className="order-action-btn review"
                            onClick={() => {
                              setReviewProduct(item);
                              setReviewModalOpen(true);
                            }}>
                            <Star size={14} fill="currentColor" /> REVIEW
                          </button>
                          <button
                            className="order-action-btn return"
                            onClick={() => {
                              setReturnProduct(item);
                              setReturnModalOpen(true);
                            }}>
                            <RotateCcw size={14} /> RETURN
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Price Details */}
            <div style={{ background: 'var(--bg-secondary)', padding: '25px', borderRadius: '12px', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '800', marginBottom: '20px', color: 'var(--text-primary)' }}>PRICE DETAILS</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: '#666', fontWeight: '500' }}>Listing price</span>
                <span style={{ fontWeight: '700', textDecoration: 'line-through', color: '#999' }}>{formatPrice(order.total + 1000)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: '#666', fontWeight: '500' }}>Special price</span>
                <span style={{ fontWeight: '700' }}>{formatPrice(order.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: '#666', fontWeight: '500' }}>Total fees</span>
                <span style={{ fontWeight: '700' }}>{formatPrice(0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '14px' }}>
                <span style={{ color: '#666', fontWeight: '500' }}>Shipping</span>
                <span style={{ fontWeight: '700', color: 'var(--teal)' }}>FREE</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '15px', paddingTop: '15px', borderTop: '2px dashed var(--border-color)', fontSize: '16px' }}>
                <span style={{ fontWeight: '800', color: 'var(--text-primary)' }}>Total amount</span>
                <span style={{ fontWeight: '900', color: 'var(--ss-red)' }}>{formatPrice(order.total)}</span>
              </div>

              <div style={{ marginTop: '20px', padding: '15px', background: 'var(--bg-primary)', borderRadius: '8px', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '13px', color: '#666', fontWeight: '700' }}>Paid By</span>
                <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-primary)' }}>
                  {order.method === 'cod' ? 'Cash On Delivery' : 'Online Payment'}
                </span>
              </div>

              <button
                onClick={generateInvoice}
                style={{ width: '100%', marginTop: '15px', padding: '12px', background: 'var(--bg-primary)', color: 'var(--text-primary)', border: '1.5px solid var(--border-color)', borderRadius: '8px', fontSize: '14px', fontWeight: '800', cursor: 'pointer', transition: '0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
                Download Invoice
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

      {returnModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}>
          <div style={{ background: 'var(--bg-primary)', padding: '30px', borderRadius: '12px', width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <h2 style={{ marginTop: 0, marginBottom: '5px', fontSize: '20px', fontWeight: '800' }}>Return: {returnProduct?.name}</h2>
            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', marginBottom: '20px' }} />

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '700' }}>Reason *</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {["Size too small / large", "Wrong item received", "Damaged / defective", "Not as described", "Changed my mind"].map((reason) => (
                  <label key={reason} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                    <input
                      type="radio"
                      name="returnReason"
                      value={reason}
                      checked={returnReason === reason}
                      onChange={(e) => setReturnReason(e.target.value)}
                    />
                    {reason}
                  </label>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '700' }}>Additional details (optional)</label>
              <textarea
                value={returnDetails}
                onChange={(e) => setReturnDetails(e.target.value)}
                placeholder="Please explain in more detail..."
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1.5px solid var(--border-color)', minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '700' }}>Upload photo (if damaged/wrong)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <label style={{ display: 'inline-block', padding: '8px 16px', border: '1.5px dashed var(--border-color)', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: '700', color: '#666' }}>
                  + Add photo
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => setReturnPhoto(e.target.files[0])} />
                </label>
                {returnPhoto && <span style={{ fontSize: '12px', color: 'var(--teal)', fontWeight: '600' }}>{returnPhoto.name}</span>}
              </div>
            </div>

            <div style={{ marginBottom: '30px' }}>
              <label style={{ display: 'block', marginBottom: '10px', fontSize: '14px', fontWeight: '700' }}>Return type *</label>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="radio" name="returnType" value="refund" checked={returnType === "refund"} onChange={(e) => setReturnType(e.target.value)} />
                  Refund
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  <input type="radio" name="returnType" value="exchange" checked={returnType === "exchange"} onChange={(e) => setReturnType(e.target.value)} />
                  Exchange (diff size)
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '15px' }}>
              <button
                onClick={() => setReturnModalOpen(false)}
                style={{ padding: '10px 20px', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: '700' }}
              >
                Cancel
              </button>
              <button
                onClick={handleReturnSubmit}
                style={{ padding: '10px 20px', background: 'var(--ss-red)', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                Submit Return &rarr;
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
