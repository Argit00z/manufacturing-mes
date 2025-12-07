import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const useRolesStore = defineStore('roles', {
  state: () => ({
    roles: [],
    loading: false,
    error: null
  }),

  getters: {
    allRoles: (state) => state.roles,
    getRoleById: (state) => (id) => {
      return state.roles.find(r => r.id === id);
    },
    getRoleByName: (state) => (name) => {
      return state.roles.find(r => r.name === name);
    }
  },

  actions: {
    async fetchRoles() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(`${API_URL}/roles`);
        this.roles = response.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Ошибка загрузки ролей';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createRole(roleData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post(`${API_URL}/roles`, roleData);
        this.roles.push(response.data);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Ошибка создания роли';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateRole(id, roleData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.put(`${API_URL}/roles/${id}`, roleData);
        const index = this.roles.findIndex(r => r.id === id);
        if (index !== -1) {
          this.roles[index] = response.data;
        }
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Ошибка обновления роли';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteRole(id) {
      this.loading = true;
      this.error = null;
      try {
        await axios.delete(`${API_URL}/roles/${id}`);
        this.roles = this.roles.filter(r => r.id !== id);
      } catch (error) {
        this.error = error.response?.data?.error || 'Ошибка удаления роли';
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});