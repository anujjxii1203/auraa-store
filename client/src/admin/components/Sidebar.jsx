import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Users, 
  ShoppingCart, 
  Settings, 
  Tag, 
  MessageSquare,
  Image,
  ShieldAlert,
  LogOut,
  ChevronLeft
} from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthContext';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { logout, hasPermission, admin } = useAdminAuth();

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard', permission: 'view_dashboard' },
    { name: 'Products', icon: Package, path: '/admin/products', permission: 'manage_products' },
    { name: 'Orders', icon: ShoppingCart, path: '/admin/orders', permission: 'manage_orders' },
    { name: 'Customers', icon: Users, path: '/admin/customers', permission: 'manage_users' },
    { name: 'Coupons', icon: Tag, path: '/admin/coupons', permission: 'manage_coupons' },
    { name: 'Reviews', icon: MessageSquare, path: '/admin/reviews', permission: 'manage_products' },
    { name: 'Settings', icon: Settings, path: '/admin/settings', permission: 'manage_settings' },
    { name: 'Roles & Access', icon: ShieldAlert, path: '/admin/roles', permission: 'manage_settings' },
  ];

  // Super Admin bypassing check
  const visibleItems = admin?.role === 'Super Admin' 
    ? menuItems 
    : menuItems.filter(item => hasPermission(item.permission));

  const expanded = isOpen;

  return (
    <aside 
      className={`admin-sidebar glass-panel ${expanded ? '' : 'closed'}`}
    >
      <div className="sidebar-header">
        <h2 className="logo">{expanded ? 'AURA ADMIN' : 'A'}</h2>
      </div>

      <nav className="sidebar-nav">
        {visibleItems.map((item) => (
          <NavLink 
            to={item.path} 
            key={item.name}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            title={!expanded ? item.name : ''}
            onClick={() => {
              if (window.innerWidth <= 768) {
                setIsOpen(false);
              }
            }}
          >
            <item.icon size={22} />
            <span className="nav-label">{item.name}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={logout} className="logout-btn" title="Logout">
          <LogOut size={22} />
          <span className="nav-label">Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
