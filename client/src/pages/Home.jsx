import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Truck, ShieldCheck, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import ProductCard from '../components/ProductCard';
import SkeletonCard from '../components/SkeletonCard';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

const Home = () => {
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        // Fetch a few products for the trending section
        const response = await api.get('/products');
        // Get the latest 4 products
        const sorted = response.data.sort((a, b) => b.id - a.id).slice(0, 4);
        setTrendingProducts(sorted);
      } catch (error) {
        console.error('Failed to fetch trending products:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const handleAddToCart = (product) => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      category: product.category,
    });
  };

  return (
    <div className="home-container">
      {/* Cinematic Hero Section */}
      <section className="home-hero" style={{
        position: 'relative',
        height: 'calc(100vh - 70px)',
        width: '100%',
        backgroundImage: 'url("https://images.unsplash.com/photo-1552374196-1ab2a1c593e8?auto=format&fit=crop&w=2000&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
      }}>
        {/* Dark overlay for text readability */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 100%)',
          zIndex: 1
        }}></div>

        <div className="container" style={{ position: 'relative', zIndex: 2, width: '100%', padding: '0 5%' }}>
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            style={{ maxWidth: '600px' }}
          >
            <h1 style={{ 
              fontSize: 'clamp(3rem, 5vw, 5.5rem)', 
              fontWeight: '900', 
              color: '#fff', 
              lineHeight: '1.1',
              marginBottom: '20px',
              textTransform: 'uppercase',
              letterSpacing: '-1px'
            }}>
              Define Your <br/>
              <span style={{ color: '#e11b23' }}>Street Style.</span>
            </h1>
            <p style={{ 
              fontSize: '1.2rem', 
              color: '#e5e7eb', 
              marginBottom: '40px',
              lineHeight: '1.6',
              fontWeight: '500'
            }}>
              Discover the latest premium streetwear collections. Designed for comfort, built for the culture.
            </p>
            
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <Link to="/men" style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                background: '#e11b23', color: '#fff', padding: '16px 32px',
                borderRadius: '4px', fontWeight: '800', fontSize: '1.1rem',
                textTransform: 'uppercase', textDecoration: 'none',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(225, 27, 35, 0.4)'
              }}
              onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 25px rgba(225, 27, 35, 0.6)'; }}
              onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(225, 27, 35, 0.4)'; }}
              >
                Shop Men's <ArrowRight size={20} />
              </Link>
              
              <Link to="/women" style={{
                display: 'inline-flex', alignItems: 'center', gap: '10px',
                background: 'rgba(255,255,255,0.1)', color: '#fff', padding: '16px 32px',
                borderRadius: '4px', fontWeight: '800', fontSize: '1.1rem',
                textTransform: 'uppercase', textDecoration: 'none',
                border: '2px solid rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                transition: 'all 0.3s ease',
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.color = '#000'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = '#fff'; }}
              >
                Shop Women's
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Strip */}
      <div style={{ 
        background: '#111', 
        color: '#fff', 
        padding: '25px 0',
        borderBottom: '1px solid #222'
      }}>
        <div className="container" style={{
          display: 'flex', 
          justifyContent: 'space-around',
          flexWrap: 'wrap',
          gap: '20px'
        }}>
          {[
            { icon: <Truck size={24} color="#e11b23"/>, text: "Free Global Shipping" },
            { icon: <ShieldCheck size={24} color="#e11b23"/>, text: "Premium Quality" },
            { icon: <Zap size={24} color="#e11b23"/>, text: "Fast Fulfillment" },
            { icon: <Star size={24} color="#e11b23"/>, text: "Top Rated Support" }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {item.icon}
              <span style={{ fontWeight: '700', fontSize: '1.1rem', textTransform: 'uppercase', letterSpacing: '1px' }}>{item.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Categories Section */}
      <section style={{ padding: '80px 0', background: 'var(--bg-primary)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: '950', textTransform: 'uppercase', color: 'var(--text-primary)' }}>
              Explore Collections
            </h2>
            <div style={{ width: '60px', height: '4px', background: '#e11b23', margin: '20px auto 0' }}></div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: '30px' 
          }}>
            {[
              { title: "Men's Apparel", link: "/men", img: "https://images.unsplash.com/photo-1516257984-b1b4d707412e?auto=format&fit=crop&w=800&q=80" },
              { title: "Women's Apparel", link: "/women", img: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=800&q=80" },
              { title: "Exclusive Footwear", link: "/footwear", img: "https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=800&q=80" }
            ].map((cat, i) => (
              <Link to={cat.link} key={i} style={{
                position: 'relative',
                height: '400px',
                borderRadius: '12px',
                overflow: 'hidden',
                display: 'block',
                textDecoration: 'none'
              }}
              className="category-card"
              >
                <div style={{
                  position: 'absolute', inset: 0,
                  backgroundImage: `url(${cat.img})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  transition: 'transform 0.5s ease',
                  className: 'cat-bg'
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                ></div>
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 100%)',
                  display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
                  padding: '30px', transition: 'all 0.3s ease'
                }}>
                  <h3 style={{ color: '#fff', fontSize: '2rem', fontWeight: '900', marginBottom: '10px', textTransform: 'uppercase' }}>{cat.title}</h3>
                  <span style={{ color: '#e11b23', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    SHOP NOW <ArrowRight size={16} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trending Products */}
      <section style={{ padding: '60px 0 100px', background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px' }}>
            <div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: '950', textTransform: 'uppercase', color: 'var(--text-primary)', margin: 0 }}>
                Trending Now
              </h2>
              <div style={{ width: '60px', height: '4px', background: '#e11b23', marginTop: '15px' }}></div>
            </div>
            <Link to="/drops" style={{ color: 'var(--text-secondary)', fontWeight: '700', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '5px' }}
              onMouseOver={(e) => e.currentTarget.style.color = '#e11b23'}
              onMouseOut={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
            >
              VIEW ALL <ArrowRight size={18} />
            </Link>
          </div>

          <div className="product-grid">
            {loading ? (
              [...Array(4)].map((_, i) => <SkeletonCard key={i} />)
            ) : trendingProducts.length > 0 ? (
              trendingProducts.map(product => (
                <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                  <ProductCard 
                    product={product} 
                    isWishlisted={isInWishlist(product.id)} 
                    onAddToCart={handleAddToCart} 
                    onWishlistToggle={toggleWishlist} 
                  />
                </motion.div>
              ))
            ) : (
              <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)' }}>No products found.</p>
            )}
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
