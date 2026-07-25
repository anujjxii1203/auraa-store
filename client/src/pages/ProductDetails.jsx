import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ShoppingBag, Heart, Check, ShieldCheck, Truck, Plus, Minus, Share2, Ruler, X, Star, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import BackButton from '../components/BackButton';
import Preloader from '../components/Preloader';
import PageTitle from '../components/PageTitle';
import ProductCard from '../components/ProductCard';
import api from '../api/client';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useUser } from '../context/UserContext';
import { FALLBACK_IMAGE, formatPrice, getOriginalPrice } from '../utils/formatters';

const AccordionItem = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="accordion-item">
      <button className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        {title}
        {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>
      {isOpen && <div className="accordion-content">{children}</div>}
    </div>
  );
};

const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const { showToast } = useToast();
  const { user } = useUser();
  
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [selectedSize, setSelectedSize] = useState('M');
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [error, setError] = useState(null);

  // Review State
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [hasPurchased, setHasPurchased] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  const handleBuyNow = () => {
    addToCart({ ...product, selectedSize, quantity });
    navigate('/checkout');
  };

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/products/${id}`);
      const data = response.data;
      setProduct(data);
      
      // Save to Recently Viewed
      const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
      const updated = [data, ...recentlyViewed.filter(p => p.id !== data.id)].slice(0, 4);
      localStorage.setItem('recentlyViewed', JSON.stringify(updated));

      // Fetch Related
      const relatedRes = await api.get(`/products?category=${data.category}&gender=${data.gender}`);
      setRelatedProducts(relatedRes.data.filter(p => p.id !== data.id).slice(0, 4));
    } catch (err) {
      setError(err.userMessage || 'Failed to load product details.');
    }
  };

  useEffect(() => {
    fetchProduct();
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    const checkPurchaseStatus = async () => {
      if (user) {
        try {
          const res = await api.get('/orders/me');
          const orders = res.data;
          const purchased = orders.some(order => {
             // ensure it's a delivered order
             if (!order.status_track || order.status_track.toLowerCase() !== 'delivered') {
                 return false;
             }
             let items = [];
             if (typeof order.metadata === 'string') {
               try { items = JSON.parse(order.metadata); } catch(e) {}
             } else {
               items = order.metadata || [];
             }
             const itemsArr = Array.isArray(items) ? items : (items.items || []);
             return itemsArr.some(item => (item.id || item.product_id).toString() === id.toString());
          });
          setHasPurchased(purchased);
        } catch (e) {
          console.error("Failed to check purchase status", e);
        }
      } else {
        setHasPurchased(false);
      }
    };
    checkPurchaseStatus();
  }, [id, user]);

  const handleAddToCart = () => {
    addToCart({ ...product, selectedSize, quantity });
    setIsAdded(true);
    showToast(`${product.name} added to bag!`, 'success');
    setTimeout(() => setIsAdded(false), 2000);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      showToast('Please login to leave a review.', 'error');
      navigate('/login');
      return;
    }
    setIsSubmittingReview(true);
    try {
      await api.post('/reviews', { product_id: id, ...reviewForm });
      showToast('Review submitted successfully!', 'success');
      setReviewForm({ rating: 5, comment: '' });
      fetchProduct();
    } catch (err) {
      showToast('Failed to submit review.', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (error) return <div className="container" style={{ padding: '100px', textAlign: 'center', color: '#e11b23', fontWeight: 'bold' }}>{error}</div>;
  if (!product) return <Preloader />;

  const isWishlisted = isInWishlist(product.id);

  return (
    <div className="pdp-container">
      <PageTitle title={product.name} />
      
      <div className="breadcrumbs" style={{ marginBottom: '20px' }}>
        <Link to="/">HOME</Link>
        <span>/</span>
        <Link to={`/?gender=${product.gender || 'Men'}`}>{product.gender ? product.gender.toUpperCase() : 'UNISEX'}</Link>
        <span>/</span>
        <Link to={`/?gender=${product.gender || 'Men'}&category=${product.category}`}>{product.category ? product.category.toUpperCase() : 'APPAREL'}</Link>
        <span>/</span>
        <span>{product.name.toUpperCase()}</span>
      </div>

      <div className="pdp-grid-ss">
        {/* Left Column: Image */}
        <div className="pdp-left">
          <div style={{ borderRadius: '8px', overflow: 'hidden', background: '#f5f5f5' }}>
            <img 
              src={product.image || FALLBACK_IMAGE} 
              alt={product.name} 
              style={{ width: '100%', height: 'auto', display: 'block', objectFit: 'cover' }} 
            />
          </div>
        </div>

        {/* Right Column: Details */}
        <div className="pdp-right">
          <div style={{ borderBottom: '1px solid #eee', paddingBottom: '25px', marginBottom: '25px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '900', marginBottom: '8px', color: '#111' }}>{product.name}</h1>
            <p style={{ color: '#666', fontSize: '15px', fontWeight: '600', marginBottom: '15px' }}>{product.category}</p>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
              <span style={{ fontSize: '26px', fontWeight: '900', color: '#111' }}>{formatPrice(product.price)}</span>
              <span style={{ fontSize: '18px', fontWeight: '600', color: '#999', textDecoration: 'line-through' }}>{formatPrice(getOriginalPrice(product.price))}</span>
              <span style={{ fontSize: '16px', fontWeight: '800', color: '#008080' }}>30% OFF</span>
            </div>
            <div className="pdp-tax-info">Inclusive of all taxes</div>
            {product.stock !== undefined && product.stock <= 5 && product.stock > 0 && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', background: '#fff3cd', color: '#856404', border: '1px solid #ffeeba', padding: '8px 14px', borderRadius: '6px', fontSize: '13px', fontWeight: '800', gap: '8px' }}>
                <span>🔥 Only {product.stock} left in stock - order soon!</span>
              </div>
            )}
            <div style={{ marginTop: '12px', display: 'inline-flex', alignItems: 'center', background: 'rgba(225, 27, 35, 0.1)', color: '#e11b23', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: '800' }}>
              <Star size={14} fill="#e11b23" style={{ marginRight: '6px' }} />
              EARN {Math.floor(product.price * 0.1)} AURA POINTS WITH THIS PURCHASE
            </div>
          </div>

          {/* Size Selection */}
          <div style={{ marginBottom: '30px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: '800' }}>Please select a size.</span>
              <button 
                onClick={() => setShowSizeGuide(true)}
                style={{ background: 'transparent', border: 'none', color: '#008080', fontWeight: '800', fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                <Ruler size={14} /> Size Guide
              </button>
            </div>
            <div className="size-selector-grid">
              {['S', 'M', 'L', 'XL', 'XXL'].map(size => (
                <div 
                  key={size} 
                  className={`size-btn ${selectedSize === size ? 'selected' : ''}`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </div>
              ))}
            </div>
          </div>

          {/* Action Row */}
          <div style={{ display: 'flex', gap: '12px', marginBottom: '25px', flexWrap: 'wrap' }}>
            <button className="btn-ss-primary" onClick={handleAddToCart} style={{ flex: 1, padding: '16px', fontSize: '14px', fontWeight: '900' }}>
              {isAdded ? 'ADDED TO BAG' : 'ADD TO BAG'}
            </button>
            <button 
              onClick={handleBuyNow}
              style={{ flex: 1, padding: '16px', fontSize: '14px', fontWeight: '900', background: '#212121', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', transition: '0.2s' }}
            >
              BUY NOW
            </button>
            <button 
              className="btn-ss-secondary" 
              onClick={() => toggleWishlist(product)}
              style={{ width: 'auto', padding: '0 20px', borderColor: isWishlisted ? '#e11b23' : '#eee', color: isWishlisted ? '#e11b23' : '#111' }}
            >
              <Heart size={18} fill={isWishlisted ? '#e11b23' : 'none'} />
            </button>
          </div>

          <div style={{ marginTop: '10px' }}>
            <AccordionItem title="Product Details" defaultOpen={true}>
              <p style={{ marginBottom: '15px' }}>{product.description}</p>
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li><strong>Material:</strong> 100% Premium Cotton</li>
                <li><strong>Fit:</strong> Relaxed Comfort Fit</li>
                <li><strong>Wash Care:</strong> Machine wash. Wash in cold water, use mild detergent, dry in shade.</li>
                <li><strong>Note:</strong> Colors may slightly vary depending on your screen brightness.</li>
              </ul>
            </AccordionItem>
            
            <AccordionItem title="Delivery & Returns">
              <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <li>Pay on delivery is available</li>
                <li>Easy 15 days return and exchange. Return Policies may vary based on products and promotions.</li>
                <li>Estimated delivery time: 3-5 working days.</li>
              </ul>
            </AccordionItem>

            <AccordionItem title={`Customer Reviews (${product.reviews?.length || 0})`}>
              {/* Rating Breakdown Bar Chart */}
              {product.reviews && product.reviews.length > 0 && (
                <div style={{ marginBottom: '25px', padding: '20px', background: 'var(--ss-light-grey)', borderRadius: '8px' }}>
                  <div style={{ fontSize: '18px', fontWeight: '900', marginBottom: '15px' }}>
                    Rating Overview ({(product.reviews.reduce((acc, r) => acc + (r.rating || 5), 0) / product.reviews.length).toFixed(1)} ★)
                  </div>
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = product.reviews.filter(r => Math.round(r.rating) === star).length;
                    const percent = Math.round((count / product.reviews.length) * 100);
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', fontSize: '12px' }}>
                        <span style={{ width: '30px', fontWeight: '800' }}>{star} ★</span>
                        <div style={{ flex: 1, height: '8px', background: '#e0e0e0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: '#008080' }} />
                        </div>
                        <span style={{ width: '40px', color: '#666', fontSize: '11px' }}>{percent}%</span>
                      </div>
                    );
                  })}
                </div>
              )}
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '800', marginBottom: '15px' }}>Write a Review</h4>
                {hasPurchased ? (
                  <form onSubmit={handleReviewSubmit}>
                    <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={20} fill={star <= reviewForm.rating ? '#ffc107' : 'none'} color={star <= reviewForm.rating ? '#ffc107' : '#ccc'} style={{ cursor: 'pointer' }} onClick={() => setReviewForm({ ...reviewForm, rating: star })} />
                      ))}
                    </div>
                    <textarea 
                      value={reviewForm.comment} 
                      onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })} 
                      style={{ width: '100%', padding: '12px', borderRadius: '4px', border: '1px solid #ddd', height: '80px', marginBottom: '10px', fontFamily: 'inherit' }} 
                      required 
                      placeholder="Tell us what you think..." 
                    />
                    <button type="submit" disabled={isSubmittingReview} className="btn-ss-secondary" style={{ width: 'auto', padding: '10px 20px', fontSize: '12px' }}>
                      {isSubmittingReview ? 'SUBMITTING...' : 'SUBMIT REVIEW'}
                    </button>
                  </form>
                ) : (
                  <div style={{ padding: '20px', background: 'var(--ss-light-grey)', borderRadius: '8px', border: '1px dashed #ccc' }}>
                    <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>You can only review products that you have purchased.</p>
                  </div>
                )}
              </div>

              {product.reviews?.length === 0 ? (
                <p style={{ color: '#666', fontStyle: 'italic' }}>No reviews yet. Be the first!</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {product.reviews?.map(r => (
                    <div key={r.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <span style={{ fontWeight: '800', fontSize: '14px', color: '#111' }}>{r.username}</span>
                        <div style={{ display: 'flex', gap: '2px' }}>
                          {[...Array(5)].map((_, i) => <Star key={i} size={12} fill={i < r.rating ? '#ffc107' : 'none'} color={i < r.rating ? '#ffc107' : '#ccc'} />)}
                        </div>
                      </div>
                      <p style={{ fontSize: '13px', color: '#444', lineHeight: '1.5', marginBottom: '6px' }}>{r.comment}</p>
                      <p style={{ fontSize: '11px', color: '#999', fontWeight: '600' }}>
                        {r.created_at ? new Date(r.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true }) : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </AccordionItem>
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <section style={{ marginTop: '80px', borderTop: '1px solid #eee', paddingTop: '60px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '950', marginBottom: '30px', textAlign: 'center' }}>YOU MAY ALSO LIKE</h2>
          <div className="product-grid">
            {relatedProducts.map(p => (
              <ProductCard key={p.id} product={p} onAddToCart={addToCart} onWishlistToggle={toggleWishlist} isWishlisted={isInWishlist(p.id)} />
            ))}
          </div>
        </section>
      )}

      {/* SIZE GUIDE MODAL */}
      {showSizeGuide && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '12px', padding: '30px', maxWidth: '550px', width: '100%', position: 'relative' }}>
            <button 
              onClick={() => setShowSizeGuide(false)}
              style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', cursor: 'pointer', color: '#111' }}
            >
              <X size={20} />
            </button>
            <h2 style={{ fontSize: '22px', fontWeight: '950', marginBottom: '8px' }}>SIZE GUIDE</h2>
            <p style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>All measurements are in inches. Fits true to size.</p>

            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: '#212121', color: '#fff' }}>
                  <th style={{ padding: '10px' }}>Size</th>
                  <th style={{ padding: '10px' }}>Chest (in)</th>
                  <th style={{ padding: '10px' }}>Shoulder (in)</th>
                  <th style={{ padding: '10px' }}>Length (in)</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { s: 'S', c: '38', sh: '17.5', l: '27' },
                  { s: 'M', c: '40', sh: '18.5', l: '28' },
                  { s: 'L', c: '42', sh: '19.5', l: '29' },
                  { s: 'XL', c: '44', sh: '20.5', l: '30' },
                  { s: 'XXL', c: '46', sh: '21.5', l: '31' },
                ].map(row => (
                  <tr key={row.s} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '12px', fontWeight: '900' }}>{row.s}</td>
                    <td style={{ padding: '12px' }}>{row.c}</td>
                    <td style={{ padding: '12px' }}>{row.sh}</td>
                    <td style={{ padding: '12px' }}>{row.l}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <button 
              onClick={() => setShowSizeGuide(false)}
              style={{ width: '100%', marginTop: '20px', padding: '12px', background: '#e11b23', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: '900', cursor: 'pointer' }}
            >
              GOT IT
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductDetails;
