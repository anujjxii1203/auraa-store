import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { UserProvider } from './context/UserContext';
import Navbar from './components/Navbar';
import Men from './pages/Men';
import Women from './pages/Women';
import Footwear from './pages/Footwear';
import Drops from './pages/Drops';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Profile from './pages/Profile';
import Wishlist from './pages/Wishlist';
import Addresses from './pages/Addresses';
import Settings from './pages/Settings';
import Login from './pages/Login';
import ProductDetails from './pages/ProductDetails';
import Preloader from './components/Preloader';
import Footer from './components/Footer';
import TrackOrder from './pages/TrackOrder';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Shipping from './pages/Shipping';
import QA from './pages/QA';
import Returns from './pages/Returns';
import ProfileLayout from './components/ProfileLayout';
import { ToastProvider } from './context/ToastContext';
import ScrollToTop from './components/ScrollToTop';
import NotFound from './components/NotFound';
import CartDrawer from './components/CartDrawer';
import FloatingActions from './components/FloatingActions';
import AdminStats from './pages/AdminStats';

// Admin Imports
import { AdminAuthProvider } from './admin/context/AdminAuthContext';
import AdminLayout from './admin/layouts/AdminLayout';
import AdminDashboard from './admin/pages/AdminDashboard';
import AdminProducts from './admin/pages/AdminProducts';
import AdminOrders from './admin/pages/AdminOrders';
import AdminCustomers from './admin/pages/AdminCustomers';
import AdminReviews from './admin/pages/AdminReviews';
import AdminCoupons from './admin/pages/AdminCoupons';
import AdminSettings from './admin/pages/AdminSettings';
import AdminRoles from './admin/pages/AdminRoles';
import AdminLogin from './admin/pages/AdminLogin';
import { Navigate } from 'react-router-dom';

const MainLayout = () => (
  <>
    <FloatingActions />
    <CartDrawer />
    <Navbar />
    <Outlet />
    <Footer />
  </>
);



import { GoogleOAuthProvider } from '@react-oauth/google';

function App() {
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialLoad(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);

  if (initialLoad) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Preloader />
      </div>
    );
  }

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || 'placeholder'}>
      <Router>
        <ScrollToTop />
        <ToastProvider>
          <AdminAuthProvider>
            <UserProvider>
              <WishlistProvider>
                <CartProvider>
                <div className="App">
                  <Routes>
                    {/* ADMIN ROUTES */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<AdminLayout />}>
                      <Route index element={<Navigate to="dashboard" replace />} />
                      <Route path="dashboard" element={<AdminDashboard />} />
                      <Route path="products" element={<AdminProducts />} />
                      <Route path="orders" element={<AdminOrders />} />
                      <Route path="customers" element={<AdminCustomers />} />
                      <Route path="reviews" element={<AdminReviews />} />
                      <Route path="coupons" element={<AdminCoupons />} />
                      <Route path="settings" element={<AdminSettings />} />
          
                      <Route path="roles" element={<AdminRoles />} />
                    </Route>
                    <Route path="/admin-data" element={<AdminStats />} />

                  <Route element={<MainLayout />}>
                    <Route path="/" element={<Navigate to="/men" replace />} />
                    <Route path="/men" element={<Men />} />
                    <Route path="/women" element={<Women />} />
                    <Route path="/footwear" element={<Footwear />} />
                    <Route path="/drops" element={<Drops />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route element={<ProfileLayout />}>
                      <Route path="/profile" element={<Profile />} />
                      <Route path="/wishlist" element={<Wishlist />} />
                      <Route path="/addresses" element={<Addresses />} />
                      <Route path="/settings" element={<Settings />} />
                    </Route>
                    <Route path="/login" element={<Login />} />
                    <Route path="/product/:id" element={<ProductDetails />} />
                    <Route path="/track-order" element={<TrackOrder />} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="/shipping" element={<Shipping />} />
                    <Route path="/qa" element={<QA />} />
                    <Route path="/returns" element={<Returns />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </div>
              </CartProvider>
            </WishlistProvider>
          </UserProvider>
        </AdminAuthProvider>
      </ToastProvider>
    </Router>
    </GoogleOAuthProvider>
  );
}

export default App;
