import axios from 'axios';
import { Platform } from 'react-native';
import Constants from 'expo-constants';

export const getBaseUrl = () => {
  if (__DEV__) {
    // Dynamically get the Metro server's IP when running on physical device
    const debuggerHost = Constants.expoConfig?.hostUri;
    if (debuggerHost) {
      const ip = debuggerHost.split(':')[0];
      return `http://${ip}:5055/api`;
    }
    
    // Fallback for emulators or web
    if (Platform.OS === 'android') {
      return 'http://10.0.2.2:5055/api';
    }
    return 'http://localhost:5055/api';
  }
  return 'https://aura-store-backend.onrender.com/api';
};

const api = axios.create({
  baseURL: getBaseUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
