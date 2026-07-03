import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Shield, ShieldAlert, Users, Search, Plus, X, LoaderCircle } from 'lucide-react';
import '../assets/AdminProducts.css';
import { useAdminAuth } from '../context/AdminAuthContext';

const AdminRoles = () => {
  const { admin } = useAdminAuth();
  const [adminUsers, setAdminUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ email: '', password: '', role_id: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchData = async () => {
    try {
      const [usersRes, rolesRes] = await Promise.all([
        api.get('/admin/admin-users'),
        api.get('/admin/roles')
      ]);
      setAdminUsers(usersRes.data);
      setRoles(rolesRes.data);
    } catch (err) {
      console.error('Failed to fetch RBAC data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!newAdmin.email || !newAdmin.password || !newAdmin.role_id) return setError('All fields are required');
    setSubmitting(true);
    setError('');
    try {
      await api.post('/admin/admin-users', newAdmin);
      setIsModalOpen(false);
      setNewAdmin({ email: '', password: '', role_id: '' });
      fetchData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create admin user');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = adminUsers.filter(u => 
    u.email.toLowerCase().includes(search.toLowerCase()) || 
    (u.role_name || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="admin-spinner"></div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <div>
          <h1>Security & Access Control</h1>
          <p>Manage admin users and their roles</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
        
        {/* Roles Panel */}
        <div className="glass-panel" style={{ flex: '1 1 300px', minWidth: '300px', padding: '24px' }}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#fff', fontSize: '18px' }}>
            <Shield size={20} /> System Roles
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {roles.map(role => (
              <div key={role.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}>
                <h3 style={{ color: '#fff', fontSize: '15px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between' }}>
                  {role.name}
                  {role.name === 'Super Admin' && <ShieldAlert size={16} color="#ff4d4f" />}
                </h3>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {JSON.parse(role.permissions || '[]').map(perm => (
                    <span key={perm} style={{ background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', color: '#a8b2d1' }}>
                      {perm}
                    </span>
                  ))}
                  {role.name === 'Super Admin' && (
                    <span style={{ background: 'rgba(225,27,35,0.1)', color: '#ff4d4f', padding: '4px 8px', borderRadius: '4px', fontSize: '11px' }}>
                      all_permissions
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Users Panel */}
        <div className="glass-panel" style={{ flex: '2 1 600px', padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0, color: '#fff', fontSize: '18px' }}>
              <Users size={20} /> Admin Users
            </h2>
            {admin?.role === 'Super Admin' && (
              <button className="btn-primary" onClick={() => setIsModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Plus size={16} /> Add Admin
              </button>
            )}
          </div>
          
          <div className="table-toolbar" style={{ padding: '0 0 20px 0', borderBottom: 'none' }}>
            <div className="search-bar" style={{ width: '100%', maxWidth: '350px' }}>
              <Search size={18} />
              <input 
                type="text" 
                placeholder="Search admin users..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Login</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map(user => (
                <tr key={user.id}>
                  <td style={{ fontWeight: '500' }}>{user.email}</td>
                  <td>
                    <span className="status-badge" style={{ background: user.role_name === 'Super Admin' ? 'rgba(225,27,35,0.1)' : 'rgba(59, 130, 246, 0.1)', color: user.role_name === 'Super Admin' ? '#ff4d4f' : '#3b82f6' }}>
                      {user.role_name}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${user.status === 'active' ? 'success' : 'danger'}`}>
                      {user.status}
                    </span>
                  </td>
                  <td style={{ color: '#8892b0' }}>
                    {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan="4" className="empty-state">
                    <p>No admin users found.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Add Admin Modal */}
      {isModalOpen && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="modal-content glass-panel" style={{ width: '400px', padding: '24px' }}>
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px' }}>Create Admin User</h3>
              <button className="icon-btn" onClick={() => setIsModalOpen(false)}><X size={20} /></button>
            </div>
            
            {error && <div style={{ padding: '10px', background: 'rgba(255,77,79,0.1)', color: '#ff4d4f', borderRadius: '6px', marginBottom: '16px', fontSize: '13px' }}>{error}</div>}

            <form onSubmit={handleCreateAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label className="field-group">
                <span>Email Address</span>
                <input 
                  type="email" 
                  required
                  value={newAdmin.email}
                  onChange={(e) => setNewAdmin({...newAdmin, email: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </label>
              
              <label className="field-group">
                <span>Password</span>
                <input 
                  type="password" 
                  required
                  value={newAdmin.password}
                  onChange={(e) => setNewAdmin({...newAdmin, password: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                />
              </label>

              <label className="field-group">
                <span>Assign Role</span>
                <select 
                  required
                  value={newAdmin.role_id}
                  onChange={(e) => setNewAdmin({...newAdmin, role_id: e.target.value})}
                  style={{ width: '100%', padding: '10px', background: '#1a1d24', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                >
                  <option value="">Select a role...</option>
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </label>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)} style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn-primary" disabled={submitting} style={{ flex: 1 }}>
                  {submitting ? <LoaderCircle size={18} className="spin-icon" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRoles;
