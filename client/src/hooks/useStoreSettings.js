import { useState, useEffect } from 'react';
import api from '../api/client';

let cachedSettings = null;

export const useStoreSettings = () => {
  const [settings, setSettings] = useState(cachedSettings || {
    hero_banner_image: '',
    hero_banner_text: '',
    hero_subtext: '',
    hero_button_text: '',
    hero_button_link: '',
    promotional_banner: '',
    store_name: 'Aura Store'
  });
  const [loading, setLoading] = useState(!cachedSettings);

  useEffect(() => {
    if (cachedSettings) return;

    const fetchSettings = async () => {
      try {
        const response = await api.get('/store/settings');
        cachedSettings = response.data;
        setSettings(cachedSettings);
      } catch (err) {
        console.error('Failed to fetch store settings', err);
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  return { settings, loading };
};
