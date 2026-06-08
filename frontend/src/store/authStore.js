import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

export const useAuthStore = create((set) => ({
  user: null,
  token: undefined, 
  
  setUser: (user) => set({ user }),
  setToken: (token) => set({ token }),
  
  checkAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('userToken');
      const userData = await SecureStore.getItemAsync('userData');
      
      if (token && userData) {
        set({ token, user: JSON.parse(userData) });
      } else {
        set({ token: null, user: null });
      }
    } catch (error) {
      console.error('Auth check error:', error);
      set({ token: null, user: null });
    }
  },
  
  logout: async () => {
    await SecureStore.deleteItemAsync('userToken');
    await SecureStore.deleteItemAsync('userData');
    set({ token: null, user: null });
  },

  initialize: async () => {
    const token = await SecureStore.getItemAsync('userToken');
    const userData = await SecureStore.getItemAsync('userData');
    if (token && userData) {
      set({ token, user: JSON.parse(userData), isAuthenticated: true });
    }
  },
}));