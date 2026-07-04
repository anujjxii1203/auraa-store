import React, { useEffect, useState } from 'react';
import api from '../../api/client';
import { Save, Image as ImageIcon, AlignLeft, Settings as SettingsIcon, Shield, Palette } from 'lucide-react';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [bannerTab, setBannerTab] = useState('men');
  const [settings, setSettings] = useState({
    hero_banner_image: '',
    hero_banner_text: '',
    hero_subtext: '',
    hero_button_text: '',
    hero_button_link: '',
    
    men_hero_banner_image: '',
    men_hero_banner_text: '',
    men_hero_subtext: '',
    men_hero_button_text: '',
    men_hero_button_link: '',

    women_hero_banner_image: '',
    women_hero_banner_text: '',
    women_hero_subtext: '',
    women_hero_button_text: '',
    women_hero_button_link: '',

    footwear_hero_banner_image: '',
    footwear_hero_banner_text: '',
    footwear_hero_subtext: '',
    footwear_hero_button_text: '',
    footwear_hero_button_link: '',
    
    promotional_banner: '',
    store_name: '',
    maintenance_mode: 'false'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/admin/settings');
        setSettings(s => ({ ...s, ...res.data }));
      } catch (err) {
        console.error('Failed to fetch settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? (checked ? 'true' : 'false') : value 
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.post('/admin/settings', settings);
      setMessage('Settings saved successfully!');
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setMessage('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="admin-spinner"></div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header" style={{ marginBottom: '20px' }}>
        <div>
          <h1>Store Settings & CMS</h1>
          <p>Manage store configurations, banners, and policies</p>
        </div>
      </div>

      <div className="admin-settings-layout">
        {/* Settings Sidebar Tabs */}
        <div className="glass-panel admin-settings-sidebar">
          <button 
            type="button"
            onClick={() => setActiveTab('general')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
              background: activeTab === 'general' ? 'rgba(225,27,35,0.1)' : 'transparent',
              color: activeTab === 'general' ? '#e11b23' : '#a8b2d1',
              border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 600
            }}
          >
            <SettingsIcon size={18} /> General
          </button>
          
          <button 
            type="button"
            onClick={() => setActiveTab('appearance')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
              background: activeTab === 'appearance' ? 'rgba(225,27,35,0.1)' : 'transparent',
              color: activeTab === 'appearance' ? '#e11b23' : '#a8b2d1',
              border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 600
            }}
          >
            <Palette size={18} /> Appearance & Banners
          </button>
          
          <button 
            type="button"
            onClick={() => setActiveTab('advanced')}
            style={{ 
              display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', 
              background: activeTab === 'advanced' ? 'rgba(225,27,35,0.1)' : 'transparent',
              color: activeTab === 'advanced' ? '#e11b23' : '#a8b2d1',
              border: 'none', borderRadius: '8px', cursor: 'pointer', textAlign: 'left', fontWeight: 600
            }}
          >
            <Shield size={18} /> Advanced
          </button>
        </div>

        {/* Settings Content Area */}
        <div className="glass-panel" style={{ flex: 1, padding: '30px' }}>
          {message && (
            <div style={{ padding: '12px', background: message.includes('Failed') ? 'rgba(225,27,35,0.1)' : 'rgba(16,185,129,0.1)', color: message.includes('Failed') ? '#ff4d4f' : '#10b981', borderRadius: '8px', marginBottom: '20px' }}>
              {message}
            </div>
          )}

          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* GENERAL TAB */}
            {activeTab === 'general' && (
              <div className="settings-section">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#fff' }}>
                  <SettingsIcon size={20} /> Store Identity
                </h3>
                <label className="field-group">
                  <span>Store Name</span>
                  <input 
                    type="text" 
                    name="store_name" 
                    value={settings.store_name} 
                    onChange={handleChange} 
                    style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                  />
                  <small style={{ color: '#8892b0', marginTop: '4px', display: 'block' }}>This appears in the browser tab and email communications.</small>
                </label>
              </div>
            )}

            {/* APPEARANCE TAB */}
            {activeTab === 'appearance' && (
              <>
                <div className="settings-section" style={{ paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#fff' }}>
                    <AlignLeft size={20} /> Top Promotional Banner
                  </h3>
                  <label className="field-group">
                    <span>Banner Text</span>
                    <input 
                      type="text" 
                      name="promotional_banner" 
                      value={settings.promotional_banner || ''} 
                      onChange={handleChange} 
                      style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                    />
                    <small style={{ color: '#8892b0', marginTop: '4px', display: 'block' }}>Leave blank to hide the top promotional banner.</small>
                  </label>
                </div>

                {/* Banner Tabs */}
                <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
                  {['men', 'women', 'footwear'].map(tab => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setBannerTab(tab)}
                      style={{
                        padding: '8px 16px',
                        background: bannerTab === tab ? '#e11b23' : 'rgba(255,255,255,0.1)',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '20px',
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        fontWeight: '600'
                      }}
                    >
                      {tab} Banner
                    </button>
                  ))}
                </div>


                {bannerTab === 'men' && (
                <div className="settings-section">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#fff' }}>
                    <ImageIcon size={20} /> Men's Category Banner
                  </h3>
                  <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
                    <label className="field-group">
                      <span>Headline</span>
                      <input 
                        type="text" 
                        name="men_hero_banner_text" 
                        value={settings.men_hero_banner_text || ''} 
                        onChange={handleChange} 
                        style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                      />
                    </label>

                    <label className="field-group">
                      <span>Subtext</span>
                      <textarea 
                        name="men_hero_subtext" 
                        value={settings.men_hero_subtext || ''} 
                        onChange={handleChange} 
                        rows="2"
                        style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', resize: 'vertical' }}
                      ></textarea>
                    </label>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label className="field-group" style={{ flex: 1 }}>
                        <span>Button Text</span>
                        <input 
                          type="text" 
                          name="men_hero_button_text" 
                          value={settings.men_hero_button_text || ''} 
                          onChange={handleChange} 
                          style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                        />
                      </label>
                      
                      <label className="field-group" style={{ flex: 1 }}>
                        <span>Button Link</span>
                        <input 
                          type="text" 
                          name="men_hero_button_link" 
                          value={settings.men_hero_button_link || ''} 
                          onChange={handleChange} 
                          style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                        />
                      </label>
                    </div>
                    
                    <label className="field-group">
                      <span>Image URL</span>
                      <input 
                        type="url" 
                        name="men_hero_banner_image" 
                        value={settings.men_hero_banner_image || ''} 
                        onChange={handleChange} 
                        style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                      />
                    </label>
                    
                    {settings.men_hero_banner_image && (
                      <div style={{ marginTop: '10px' }}>
                        <img 
                          src={settings.men_hero_banner_image} 
                          alt="Preview" 
                          style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                )}

                {bannerTab === 'women' && (
                <div className="settings-section">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#fff' }}>
                    <ImageIcon size={20} /> Women's Category Banner
                  </h3>
                  <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
                    <label className="field-group">
                      <span>Headline</span>
                      <input 
                        type="text" 
                        name="women_hero_banner_text" 
                        value={settings.women_hero_banner_text || ''} 
                        onChange={handleChange} 
                        style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                      />
                    </label>

                    <label className="field-group">
                      <span>Subtext</span>
                      <textarea 
                        name="women_hero_subtext" 
                        value={settings.women_hero_subtext || ''} 
                        onChange={handleChange} 
                        rows="2"
                        style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', resize: 'vertical' }}
                      ></textarea>
                    </label>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label className="field-group" style={{ flex: 1 }}>
                        <span>Button Text</span>
                        <input 
                          type="text" 
                          name="women_hero_button_text" 
                          value={settings.women_hero_button_text || ''} 
                          onChange={handleChange} 
                          style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                        />
                      </label>
                      
                      <label className="field-group" style={{ flex: 1 }}>
                        <span>Button Link</span>
                        <input 
                          type="text" 
                          name="women_hero_button_link" 
                          value={settings.women_hero_button_link || ''} 
                          onChange={handleChange} 
                          style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                        />
                      </label>
                    </div>
                    
                    <label className="field-group">
                      <span>Image URL</span>
                      <input 
                        type="url" 
                        name="women_hero_banner_image" 
                        value={settings.women_hero_banner_image || ''} 
                        onChange={handleChange} 
                        style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                      />
                    </label>
                    
                    {settings.women_hero_banner_image && (
                      <div style={{ marginTop: '10px' }}>
                        <img 
                          src={settings.women_hero_banner_image} 
                          alt="Preview" 
                          style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                )}

                {bannerTab === 'footwear' && (
                <div className="settings-section">
                  <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px', color: '#fff' }}>
                    <ImageIcon size={20} /> Footwear Category Banner
                  </h3>
                  <div style={{ display: 'flex', gap: '20px', flexDirection: 'column' }}>
                    <label className="field-group">
                      <span>Headline</span>
                      <input 
                        type="text" 
                        name="footwear_hero_banner_text" 
                        value={settings.footwear_hero_banner_text || ''} 
                        onChange={handleChange} 
                        style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                      />
                    </label>

                    <label className="field-group">
                      <span>Subtext</span>
                      <textarea 
                        name="footwear_hero_subtext" 
                        value={settings.footwear_hero_subtext || ''} 
                        onChange={handleChange} 
                        rows="2"
                        style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px', resize: 'vertical' }}
                      ></textarea>
                    </label>

                    <div style={{ display: 'flex', gap: '16px' }}>
                      <label className="field-group" style={{ flex: 1 }}>
                        <span>Button Text</span>
                        <input 
                          type="text" 
                          name="footwear_hero_button_text" 
                          value={settings.footwear_hero_button_text || ''} 
                          onChange={handleChange} 
                          style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                        />
                      </label>
                      
                      <label className="field-group" style={{ flex: 1 }}>
                        <span>Button Link</span>
                        <input 
                          type="text" 
                          name="footwear_hero_button_link" 
                          value={settings.footwear_hero_button_link || ''} 
                          onChange={handleChange} 
                          style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                        />
                      </label>
                    </div>
                    
                    <label className="field-group">
                      <span>Image URL</span>
                      <input 
                        type="url" 
                        name="footwear_hero_banner_image" 
                        value={settings.footwear_hero_banner_image || ''} 
                        onChange={handleChange} 
                        style={{ width: '100%', padding: '12px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: '6px' }}
                      />
                    </label>
                    
                    {settings.footwear_hero_banner_image && (
                      <div style={{ marginTop: '10px' }}>
                        <img 
                          src={settings.footwear_hero_banner_image} 
                          alt="Preview" 
                          style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      </div>
                    )}
                  </div>
                </div>
                )}
              </>
            )}

            {/* ADVANCED TAB */}
            {activeTab === 'advanced' && (
              <div className="settings-section">
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px', color: '#fff' }}>
                  <Shield size={20} /> Advanced Configurations
                </h3>
                
                <div style={{ padding: '20px', background: 'rgba(225,27,35,0.05)', border: '1px solid rgba(225,27,35,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ color: '#fff', marginBottom: '4px', fontSize: '16px' }}>Maintenance Mode</h4>
                    <p style={{ color: '#8892b0', fontSize: '14px', lineHeight: '1.5' }}>
                      When enabled, the storefront API will return a 503 Service Unavailable error. Visitors will not be able to browse or purchase products. 
                      <strong> Admin access remains fully functional.</strong>
                    </p>
                  </div>
                  
                  <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', position: 'relative' }}>
                    <input 
                      type="checkbox" 
                      name="maintenance_mode"
                      checked={settings.maintenance_mode === 'true'}
                      onChange={handleChange}
                      style={{ 
                        appearance: 'none', width: '50px', height: '26px', background: settings.maintenance_mode === 'true' ? '#e11b23' : 'rgba(255,255,255,0.2)', 
                        borderRadius: '20px', position: 'relative', outline: 'none', cursor: 'pointer', transition: 'background 0.3s'
                      }}
                    />
                    <div style={{ 
                      position: 'absolute', top: '3px', left: settings.maintenance_mode === 'true' ? '27px' : '3px', 
                      width: '20px', height: '20px', background: '#fff', borderRadius: '50%', transition: 'all 0.3s' 
                    }}></div>
                  </label>
                </div>

                <div style={{ marginTop: '24px' }}>
                  <p style={{ color: '#8892b0' }}>More API limits and rate configurations will be added here soon.</p>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
              <button type="submit" className="btn-primary" disabled={saving} style={{ padding: '12px 30px' }}>
                <Save size={18} /> {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
