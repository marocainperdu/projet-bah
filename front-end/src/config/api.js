// Configuration pour l'API backend
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000';

// Configuration axios par défaut
import axios from 'axios';

axios.defaults.baseURL = API_BASE_URL;

// Intercepteur pour ajouter automatiquement le token d'authentification
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour gérer les erreurs d'authentification
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API_BASE_URL;
