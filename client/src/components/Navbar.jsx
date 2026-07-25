import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useSearchParams, useNavigate } from 'react-router-dom';
import { ShoppingBag, User as UserIcon, Heart, X, Menu, Search as SearchIcon, AlertCircle } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useUser } from '../context/UserContext';
import api from '../api/client';
import { useStoreSettings } from '../hooks/useStoreSettings';
import { formatPrice, FALLBACK_IMAGE } from '../utils/formatters';

const Navbar = () => {
  const { user } = useUser();
  const { cartCount, toggleCart } = useCart();
  const { wishlist } = useWishlist();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const { settings } = useStoreSettings();

  // Search Autocomplete State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const searchRef = useRef(null);

  // Loading Bar Logic
  useEffect(() => {
    setLoadingProgress(30);
    const timer = setTimeout(() => setLoadingProgress(100), 400);
    const resetTimer = setTimeout(() => setLoadingProgress(0), 700);
    return () => {
      clearTimeout(timer);
      clearTimeout(resetTimer);
    };
  }, [location.pathname]);

  const firstName = (user?.username || 'Customer').split(' ')[0].toUpperCase();

  // Live Search Effect
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      setShowResults(false);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await api.get(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
        setSearchResults((res.data || []).slice(0, 5));
        setShowResults(true);
      } catch (err) {
        console.error('Search failed', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setShowResults(false);
  }, [location.pathname]);

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 1000, background: 'var(--bg-primary)' }}>
      {/* Loading Bar */}
      {loadingProgress > 0 && (
        <div className="loading-bar" style={{ width: `${loadingProgress}%` }} />
      )}



      {/* Abandoned Cart Reminder Banner */}
      {cartCount > 0 && location.pathname !== '/checkout' && location.pathname !== '/cart' && (
        <div style={{ background: '#212121', color: '#fff', padding: '6px 15px', fontSize: '12px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '800' }}>
          <AlertCircle size={14} color="#e11b23" />
          <span>You left {cartCount} item{cartCount > 1 ? 's' : ''} in your bag!</span>
          <span 
            onClick={() => toggleCart(true)} 
            style={{ color: '#ff4444', textDecoration: 'underline', cursor: 'pointer', marginLeft: '5px' }}
          >
            Complete Purchase ➔
          </span>
        </div>
      )}

      {/* Main Navbar */}
      <nav className="navbar" style={{ borderBottom: '1px solid var(--border-color)', background: 'var(--bg-primary)' }}>
        <div className="container nav-content">
          {/* Hamburger (Mobile Only) */}
          <button className="hamburger" onClick={() => setIsMenuOpen(true)} aria-label="Open menu">
            <Menu size={24} color="var(--text-primary)" />
          </button>

          {/* Logo Section */}
          <div className="logo-left">
            <Link to="/" style={{ fontSize: '28px', fontWeight: '900', color: '#e11b23', letterSpacing: '-1.5px', textDecoration: 'none' }}>
              AURA STORE
            </Link>
          </div>

          {/* Live Search Autocomplete */}
          <div ref={searchRef} className={`search-pill-wrapper ${isMobileSearchOpen ? 'mobile-active' : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', background: 'var(--ss-light-grey)', borderRadius: '20px', padding: '6px 14px', border: '1px solid var(--border-color)', width: '100%' }}>
              <SearchIcon size={16} color="var(--text-secondary)" style={{ marginRight: '8px', flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Search streetwear, jackets, oversized..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => searchQuery.trim() && setShowResults(true)}
                style={{ width: '100%', border: 'none', background: 'transparent', outline: 'none', fontSize: '13px', color: 'var(--text-primary)', fontFamily: 'inherit' }}
              />
              {searchQuery && (
                <X size={14} color="var(--text-secondary)" style={{ cursor: 'pointer', flexShrink: 0 }} onClick={() => { setSearchQuery(''); setSearchResults([]); setShowResults(false); }} />
              )}
            </div>

            {/* Live Search Results Dropdown */}
            {showResults && searchQuery.trim().length > 0 && (
              <div style={{ position: 'absolute', top: '110%', left: 0, right: 0, background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.15)', zIndex: 1000, overflow: 'hidden', maxHeight: '380px', overflowY: 'auto' }}>
                {isSearching ? (
                  <div style={{ padding: '15px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>Searching products...</div>
                ) : searchResults.length > 0 ? (
                  <div>
                    <div style={{ padding: '8px 15px', fontSize: '10px', fontWeight: '900', color: 'var(--text-secondary)', background: 'var(--ss-light-grey)', borderBottom: '1px solid var(--border-color)', letterSpacing: '1px' }}>MATCHING PRODUCTS</div>
                    {searchResults.map((item) => (
                      <Link
                        key={item.id}
                        to={`/product/${item.id}`}
                        onClick={() => { setShowResults(false); setIsMobileSearchOpen(false); }}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 15px', textDecoration: 'none', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-color)', transition: '0.2s' }}
                      >
                        <img src={item.image || FALLBACK_IMAGE} alt={item.name} style={{ width: '40px', height: '50px', objectFit: 'cover', borderRadius: '4px', background: '#f0f0f0' }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ margin: 0, fontSize: '13px', fontWeight: '800', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                          <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>{item.category}</p>
                        </div>
                        <span style={{ fontSize: '13px', fontWeight: '900', color: '#e11b23' }}>{formatPrice(item.price)}</span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '15px', textAlign: 'center', color: 'var(--text-secondary)', fontSize: '12px' }}>No products found for "{searchQuery}"</div>
                )}
              </div>
            )}
          </div>

          {/* Right Icons row */}
          <div className="nav-icons" style={{ color: 'var(--text-primary)' }}>
            {/* Mobile Search Icon Toggle */}
            <div 
              className="mobile-search-btn" 
              onClick={() => setIsMobileSearchOpen(!isMobileSearchOpen)} 
              title="Search" 
              style={{ cursor: 'pointer', display: 'none', alignItems: 'center', justifyContent: 'center' }}
            >
              {isMobileSearchOpen ? <X size={22} /> : <SearchIcon size={22} strokeWidth={1.5} />}
            </div>

            <Link to={user ? "/profile" : "/login"} title="Account" style={{ color: 'inherit', textDecoration: 'none' }}>
              {user ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <UserIcon size={22} strokeWidth={1.5} />
                  <span className="hide-mobile" style={{ fontSize: '11px', fontWeight: '800' }}>{firstName}</span>
                </div>
              ) : (
                <UserIcon size={24} strokeWidth={1.5} />
              )}
            </Link>

            <Link to="/wishlist" title="Wishlist" className="cart-icon-wrapper">
              <Heart size={24} strokeWidth={1.5} fill={wishlist.length > 0 ? "rgba(225, 27, 35, 0.1)" : "none"} color={wishlist.length > 0 ? "#e11b23" : "currentColor"} />
              {wishlist.length > 0 && <span className="cart-count" style={{ background: '#212121' }}>{wishlist.length}</span>}
            </Link>

            <div onClick={() => toggleCart(true)} className="cart-icon-wrapper" title="Shopping Bag" style={{ cursor: 'pointer' }}>
              <ShoppingBag size={24} strokeWidth={1.5} />
              <span className="cart-count">{cartCount}</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Search Overlay removed */}

      {/* Mobile Sidebar Menu */}
      <div className={`mobile-overlay ${isMenuOpen ? 'active' : ''}`} onClick={() => setIsMenuOpen(false)} />
      <div className={`mobile-menu ${isMenuOpen ? 'active' : ''}`}>
        <button className="mobile-menu-close" onClick={() => setIsMenuOpen(false)} aria-label="Close menu">
          <X size={22} />
        </button>

        <div className="mobile-nav-links">
          <Link to="/men">MEN</Link>
          <Link to="/women">WOMEN</Link>
          <Link to="/footwear">FOOTWEAR</Link>
          <Link to="/drops" style={{ color: '#e11b23', fontWeight: '900' }}>UPCOMING DROPS</Link>
          <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '10px 0' }} />
          <Link to={user ? "/profile" : "/login"}>{user ? "MY PROFILE" : "SIGN IN"}</Link>
          <Link to="/wishlist">WISHLIST ({wishlist.length})</Link>
          {user && <Link to="/settings">SETTINGS</Link>}
          <div onClick={() => toggleCart(true)} style={{ color: '#111', fontWeight: '800', fontSize: '18px', cursor: 'pointer' }}>SHOPPING BAG ({cartCount})</div>
          <Link to="/track-order">TRACK ORDER</Link>
        </div>

        <div style={{ height: '20px' }} />
      </div>
    </header>
  );
};

export default Navbar;
