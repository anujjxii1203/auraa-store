import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 60000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  // Mobile app might still use token, web uses cookies implicitly
  const token = localStorage.getItem('token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite loops when refresh token itself fails
    if (error.response?.status === 401 && originalRequest.url !== '/auth/refresh' && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/auth/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (err) {
        processQueue(err, null);
        // Dispatch custom event to trigger global logout if not already trying to log out
        if (originalRequest.url !== '/auth/logout') {
          window.dispatchEvent(new Event('auth-logout'));
        }
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    const serverMessage = error.response?.data?.message || error.response?.data?.error;
    error.userMessage = serverMessage || 'Unable to reach the store server. Please try again.';
    return Promise.reject(error);
  }
);

export default api;
