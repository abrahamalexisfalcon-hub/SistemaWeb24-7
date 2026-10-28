import axios, { type InternalAxiosRequestConfig, type AxiosResponse, type AxiosError } from 'axios';
import { clearAuthSession, getStoredToken } from '../utils/authStorage';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Interceptor de solicitud: Inyecta el token Bearer JWT desde el almacenamiento
// compartido (localStorage) con respaldo en sessionStorage.
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getStoredToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Interceptor de respuesta: Manejo de sesión expirada o no autorizada (401)
api.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Solo cerrar sesión si realmente existía un token. Un 401 por una
      // petición anónima (por ejemplo, justo al abrir una notificación) no
      // debe destruir el contexto de autenticación de otras pestañas.
      const token = getStoredToken();
      if (token) {
        clearAuthSession();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?motivo=expirado';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
