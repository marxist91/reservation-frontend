import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

const defaultApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: defaultApiUrl,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 secondes timeout
});

// Intercepteur pour ajouter le token JWT
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError): Promise<AxiosError> => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs
apiClient.interceptors.response.use(
  (response: AxiosResponse): AxiosResponse => response,
  (error: AxiosError<ApiError>): Promise<Error> => {
    // Erreur réseau ou serveur non disponible
    if (!error.response) {
      console.error('Erreur réseau:', error.message);
      return Promise.reject(new Error('Erreur de connexion au serveur'));
    }

    // Token expiré ou invalide - seulement sur 401
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      // Ne pas rediriger si déjà sur la page login, register, ou page d'accueil
      if (currentPath !== '/login' && currentPath !== '/register' && currentPath !== '/') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default apiClient;
