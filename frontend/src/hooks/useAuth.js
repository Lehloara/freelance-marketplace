import { useState } from 'react';
import api from '../api/client';
import { useAuthStore } from '../store/authStore';
import * as SecureStore from 'expo-secure-store';

export const useAuth = () => {
  const [loading, setLoading] = useState(false);
  const { setUser, setToken, logout } = useAuthStore();

  const login = async (email, password) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      await setToken(data.token);
      await SecureStore.setItemAsync('userData', JSON.stringify(data.user));
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Login failed' };
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', userData);
      await setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (error) {
      return { success: false, message: error.response?.data?.message || 'Registration failed' };
    } finally {
      setLoading(false);
    }
  };

  return { login, register, logout, loading };
};