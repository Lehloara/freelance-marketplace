import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const API_BASES = [
  'https://freelance-marketplace-uglf.onrender.com/api',
  
  'http://192.168.1.110:5000/api',
  'http://192.168.43.121:5000/api',
];

let API_URL = API_BASES[0];

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000, 
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('userToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (err) => {
    if (err.response?.status === 401) await SecureStore.deleteItemAsync('userToken');
    return Promise.reject(err);
  }
);

export default api;