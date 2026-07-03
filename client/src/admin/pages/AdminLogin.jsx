import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAdminAuth } from '../context/AdminAuthContext';
import { Lock, Mail, AlertCircle } from 'lucide-react';
import '../assets/AdminAuth.css';

const AdminLogin = () => {
  const { admin, login, loading } = useAdminAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return null;
  if (admin) return <Navigate to="/admin/dashboard" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      await login(email, password);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card glass-panel">
        <div className="admin-login-header">
          <h2>AURA ADMIN</h2>
          <p>Sign in to the control panel</p>
        </div>

        {error && (
          <div className="admin-error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <label className="admin-field-group">
            <span>Admin Email</span>
            <div className="admin-input-wrapper">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@aurastore.com"
                required
              />
            </div>
          </label>

          <label className="admin-field-group">
            <span>Password</span>
            <div className="admin-input-wrapper">
              <Lock size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          </label>

          <button type="submit" disabled={isSubmitting} className="admin-login-btn">
            {isSubmitting ? 'Authenticating...' : 'Secure Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
