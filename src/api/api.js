import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
});

// attach token on each request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers['x-auth-token'] = token;
  return config;
});

// global error handling
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const message =
      error?.response?.data?.msg ||
      error?.response?.data?.error ||
      error.message ||
      'An unknown error occurred';
    if (message !== 'No active election found') toast.error(message);
    if (error?.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
