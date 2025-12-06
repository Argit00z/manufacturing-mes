import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const usePersonnelStore = defineStore('personnel', {
  state: () => ({
    personnel: [],
    loading: false,
    error: null
  }),

  getters: {
    allPersonnel: (state) => state.personnel,
    getPersonnelById: (state) => (id) => {
      return state.personnel.find(p => p.id === id);
    }
  },

  actions: {
    async fetchPersonnel() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(`${API_URL}/personnel`);
        this.personnel = response.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Ошибка загрузки персонала';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createPersonnel(personnelData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post(`${API_URL}/personnel`, personnelData);
        this.personnel.push(response.data);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Ошибка создания сотрудника';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updatePersonnel(id, personnelData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.put(`${API_URL}/personnel/${id}`, personnelData);
        const index = this.personnel.findIndex(p => p.id === id);
        if (index !== -1) {
          this.personnel[index] = response.data;
        }
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Ошибка обновления сотрудника';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deletePersonnel(id) {
      this.loading = true;
      this.error = null;
      try {
        await axios.delete(`${API_URL}/personnel/${id}`);
        this.personnel = this.personnel.filter(p => p.id !== id);
      } catch (error) {
        this.error = error.response?.data?.error || 'Ошибка удаления сотрудника';
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});