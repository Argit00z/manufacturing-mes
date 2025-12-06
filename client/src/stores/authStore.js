import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    token: localStorage.getItem('token') || null,
    isAuthenticated: false
  }),

  getters: {
    currentUser: (state) => state.user,
    isLoggedIn: (state) => state.isAuthenticated
  },

  actions: {
    async login(credentials) {
      try {
        const response = await axios.post(`${API_URL}/auth/login`, credentials);
        this.token = response.data.token;
        this.user = response.data.user;
        this.isAuthenticated = true;
        localStorage.setItem('token', this.token);
        
        // Устанавливаем токен для всех последующих запросов
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
        
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },

    async register(userData) {
      try {
        const response = await axios.post(`${API_URL}/auth/register`, userData);
        return response.data;
      } catch (error) {
        throw error.response?.data || error;
      }
    },

    logout() {
      this.user = null;
      this.token = null;
      this.isAuthenticated = false;
      localStorage.removeItem('token');
      delete axios.defaults.headers.common['Authorization'];
    },

    async checkAuth() {
      if (this.token) {
        try {
          axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
          const response = await axios.get(`${API_URL}/auth/me`);
          this.user = response.data;
          this.isAuthenticated = true;
        } catch (error) {
          this.logout();
        }
      }
    }
  }
});