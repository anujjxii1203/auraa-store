import { SignIn } from '@clerk/clerk-react';
import PageTitle from '../components/PageTitle';

const Login = () => {
  return (
    <div className="auth-layout-grid">
      <div className="auth-image-pane">
        <img 
          src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1200&q=80&fit=crop"
          alt="Premium Streetwear"
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <div className="auth-image-overlay">
          <div className="auth-image-badge">✦ Premium Fashion</div>
          <h2>Discover Timeless<br/>Fashion.</h2>
          <p>Crafted for modern lifestyles — from streets to boardrooms.</p>
          <div className="auth-image-features">
            <span>Free Shipping on orders above ₹999</span>
            <span>Secure Checkout, always</span>
            <span>Easy 30-day Returns</span>
          </div>
        </div>
      </div>
      <div className="auth-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <PageTitle title="Sign In" />
        <SignIn routing="path" path="/login" signUpUrl="/login" />
      </div>
    </div>
  );
};

export default Login;
