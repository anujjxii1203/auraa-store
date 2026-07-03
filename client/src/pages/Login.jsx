import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, ArrowRight, LoaderCircle, Lock, Mail, User, CheckCircle2 } from 'lucide-react';
import { useGoogleLogin } from '@react-oauth/google';

import zxcvbn from 'zxcvbn';
import BackButton from '../components/BackButton';
import PageTitle from '../components/PageTitle';
import PasswordInput from '../components/PasswordInput';
import api from '../api/client';
import { useUser } from '../context/UserContext';
import { useToast } from '../context/ToastContext';

const initialForm = { username: '', email: '', password: '' };

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState(initialForm);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('credentials'); // 'credentials', 'otp', 'forgot', 'forgot-otp'
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const { setSession } = useUser();
  const { showToast } = useToast();
  const navigate = useNavigate();



  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: '', color: 'transparent' };
    const result = zxcvbn(password);
    const scores = [
      { label: 'Very Weak', color: '#ff4444' },
      { label: 'Weak', color: '#ffa700' },
      { label: 'Fair', color: '#e6d200' },
      { label: 'Good', color: '#8bc34a' },
      { label: 'Strong', color: '#4caf50' }
    ];
    return { score: result.score, ...scores[result.score] };
  };

  const updateField = (field, value) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const validateForm = () => {
    if (step === 'credentials') {
      if (!isLogin && !formData.username.trim()) return 'Please enter your full name.';
      if (!formData.email.trim()) return 'Please enter your email address.';
      if (!formData.email.includes('@')) return 'Please enter a valid email address.';
      if (!formData.password) return 'Please enter your password.';
      return '';
    }
    if (step === 'forgot') {
      if (!formData.email.trim()) return 'Please enter your email address.';
      if (!formData.email.includes('@')) return 'Please enter a valid email address.';
      return '';
    }
    if (step === 'otp' || step === 'forgot-otp') {
      if (!otp.trim()) return 'Please enter the OTP sent to your email.';
      if (step === 'forgot-otp' && newPassword.length < 6) return 'New password must be at least 6 characters long.';
      return '';
    }
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();

    if (validationError) {
      if (step === 'otp' || step === 'forgot-otp') setOtpError(validationError); else setError(validationError);
      return;
    }

    setError('');
    setOtpError('');
    setLoading(true);

    try {
      if (step === 'credentials') {
        if (!isLogin) {
          await api.post('/register', { ...formData, rememberMe });
          showToast('Account created successfully!', 'success');
          setIsLogin(true);
          setFormData(initialForm);
        } else {
          const response = await api.post('/auth/request-otp', { email: formData.email, password: formData.password });
          setStep('otp');
          showToast(response.data?.message || 'OTP sent to your email.', 'success');
        }
      } else if (step === 'forgot') {
        const response = await api.post('/auth/forgot-password', { email: formData.email });
        setStep('forgot-otp');
        showToast(response.data?.message || 'Password reset OTP sent to your email.', 'success');
      } else if (step === 'forgot-otp') {
        await api.post('/auth/reset-password', { email: formData.email, otp, newPassword });
        showToast('Password reset successfully! Please log in.', 'success');
        setStep('credentials');
        setIsLogin(true);
        setFormData(initialForm);
        setOtp('');
        setNewPassword('');
      } else if (step === 'otp') {
        const response = await api.post('/auth/verify-otp', { email: formData.email, otp, rememberMe });
        setSession({ user: response.data.user, token: response.data.token });
        showToast(`Welcome back ${response.data.user.username} 👋`, 'success');
        navigate('/men');
      }
    } catch (err) {
      if (step === 'otp' || step === 'forgot-otp') setOtpError(err.userMessage || 'Unable to verify OTP.');
      else setError(err.userMessage || 'Unable to complete this request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      setLoading(true);
      setOtpError('');
      let response;
      if (step === 'forgot-otp') {
        response = await api.post('/auth/forgot-password', { email: formData.email });
      } else {
        response = await api.post('/auth/request-otp', { email: formData.email, password: formData.password });
      }
      showToast(response.data?.message || 'OTP resent to your email.', 'success');
    } catch (err) {
      setOtpError(err.userMessage || 'Unable to resend OTP.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin((current) => !current);
    setError('');
    setOtpError('');
    setStep('credentials');
    setFormData(initialForm);
    setOtp('');
    setNewPassword('');
  };

  const loginGoogle = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        setLoading(true);
        setError('');
        const response = await api.post('/auth/google', { access_token: tokenResponse.access_token });
        setSession({ user: response.data.user, token: response.data.token });
        showToast(`Welcome back ${response.data.user.username} 👋`, 'success');
        navigate('/men');
      } catch (err) {
        setError(err.userMessage || 'Google login failed.');
      } finally {
        setLoading(false);
      }
    },
    onError: () => setError('Google login failed.')
  });

  const hasMinLen = formData.password.length >= 8;
  const hasUpper = /[A-Z]/.test(formData.password);
  const hasNumber = /[0-9]/.test(formData.password);
  const hasSymbol = /[^A-Za-z0-9]/.test(formData.password);

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
    <div className="auth-page">
      <PageTitle title={step.includes('forgot') ? "Forgot Password" : (isLogin ? "Sign In" : "Register")} />
      <section className="auth-panel">
        <BackButton />
        <div className="auth-heading">
          <h1>AURA STORE</h1>
          <p>{step.includes('forgot') ? 'Reset your password.' : (isLogin ? 'Welcome back.' : 'Create your account.')}</p>
        </div>

        {error && (
          <div className="error-banner" role="alert">
            <AlertCircle size={17} />
            <span>{error}</span>
          </div>
        )}
        {otpError && (
          <div className="error-banner" role="alert">
            <AlertCircle size={17} />
            <span>{otpError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {step === 'credentials' && (
            <>
              {!isLogin && (
                <label className="field-group">
                  <span>Full Name</span>
                  <div className="input-with-icon">
                    <User size={18} />
                    <input
                      type="text"
                      value={formData.username}
                      onChange={(event) => updateField('username', event.target.value)}
                      placeholder="Full Name"
                      autoComplete="username"
                    />
                  </div>
                </label>
              )}
              <label className="field-group">
                <span>Email Address</span>
                <div className="input-with-icon">
                  <Mail size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="field-group">
                <span>Password</span>
                <PasswordInput
                  value={formData.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder="Enter password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'}
                />
              </label>
              {!isLogin && formData.password.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <div style={{ flex: 1, height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${(getPasswordStrength(formData.password).score + 1) * 20}%`, background: getPasswordStrength(formData.password).color, transition: 'all 0.3s' }}></div>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 'bold', color: getPasswordStrength(formData.password).color }}>
                      {getPasswordStrength(formData.password).score === 4 ? 'Strong Password' : getPasswordStrength(formData.password).label}
                    </span>
                  </div>
                  <div className="password-checklist">
                    <span className={hasMinLen ? 'checked' : ''}><CheckCircle2 size={12} /> 8+ characters</span>
                    <span className={hasUpper ? 'checked' : ''}><CheckCircle2 size={12} /> One uppercase</span>
                    <span className={hasNumber ? 'checked' : ''}><CheckCircle2 size={12} /> One number</span>
                    <span className={hasSymbol ? 'checked' : ''}><CheckCircle2 size={12} /> One symbol</span>
                  </div>
                </div>
              )}

              {isLogin && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: '#555' }}>
                    <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} style={{ cursor: 'pointer' }} />
                    Remember me (30 days)
                  </label>
                  <button type="button" onClick={() => { setError(''); setStep('forgot'); }} className="forgot-pwd-btn">
                    Forgot Password?
                  </button>
                </div>
              )}
            </>
          )}

          {step === 'forgot' && (
            <>
              <label className="field-group">
                <span>Email Address</span>
                <div className="input-with-icon">
                  <Mail size={18} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => updateField('email', event.target.value)}
                    placeholder="Enter your account email"
                    autoComplete="email"
                  />
                </div>
              </label>
            </>
          )}

          {(step === 'otp' || step === 'forgot-otp') && (
            <>
              <label className="field-group">
                <span>One‑Time Password</span>
                <div className="input-with-icon">
                  <Lock size={18} />
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                    autoComplete="one-time-code"
                  />
                </div>
              </label>

              {step === 'forgot-otp' && (
                <>
                  <label className="field-group" style={{ marginTop: '16px' }}>
                    <span>New Password</span>
                    <PasswordInput
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Enter new password"
                      autoComplete="new-password"
                    />
                  </label>
                  {newPassword.length > 0 && (
                    <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ flex: 1, height: '6px', background: '#eee', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(getPasswordStrength(newPassword).score + 1) * 20}%`, background: getPasswordStrength(newPassword).color, transition: 'all 0.3s' }}></div>
                      </div>
                      <span style={{ fontSize: '11px', fontWeight: 'bold', color: getPasswordStrength(newPassword).color }}>
                        {getPasswordStrength(newPassword).label}
                      </span>
                    </div>
                  )}
                </>
              )}

              <div style={{ textAlign: 'right', marginTop: '8px' }}>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  style={{ background: 'none', border: 'none', color: '#e11b23', fontSize: '13px', cursor: 'pointer', fontWeight: 'bold' }}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </div>
            </>
          )}

          <button type="submit" className="btn-red auth-submit" disabled={loading} style={{ marginTop: '24px' }}>
            {loading ? <LoaderCircle size={18} className="spin-icon" /> : <ArrowRight size={18} />}
            {loading ? (isLogin ? 'Signing In...' : 'Creating Account...') : (step === 'credentials' ? (isLogin ? 'Sign In' : 'Create Account') : step === 'forgot' ? 'Send Reset OTP' : step === 'forgot-otp' ? 'Reset Password' : 'Verify OTP')}
          </button>
        </form>

        {step === 'credentials' && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
              <div style={{ flex: 1, height: '1px', background: '#eee' }}></div>
              <span style={{ padding: '0 10px', color: '#bbb', fontSize: '13px', fontWeight: 'bold' }}>OR</span>
              <div style={{ flex: 1, height: '1px', background: '#eee' }}></div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button type="button" onClick={() => loginGoogle()} className="btn-social">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
                Continue with Google
              </button>
            </div>
          </>
        )}

        <div className="auth-switch">
          {step.includes('forgot') ? (
            <button type="button" onClick={() => { setStep('credentials'); setError(''); }}>
              Back to Login
            </button>
          ) : (
            <>
              <span>{isLogin ? "Don't have an account?" : 'Already have an account?'}</span>
              <button type="button" onClick={toggleMode}>
                {isLogin ? 'Sign up' : 'Log in'}
              </button>
            </>
          )}
        </div>
      </section>
    </div>
    </div>
  );
};

export default Login;
