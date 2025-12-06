import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const useMaterialsStore = defineStore('materials', {
  state: () => ({
    materials: [],
    loading: false,
    error: null
  }),

  getters: {
    allMaterials: (state) => state.materials,
    getMaterialById: (state) => (id) => {
      return state.materials.find(m => m.id === id);
    }
  },

  actions: {
    async fetchMaterials() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(`${API_URL}/materials`);
        this.materials = response.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Ошибка загрузки материалов';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createMaterial(materialData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post(`${API_URL}/materials`, materialData);
        this.materials.push(response.data);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Ошибка создания материала';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateMaterial(id, materialData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.put(`${API_URL}/materials/${id}`, materialData);
        const index = this.materials.findIndex(m => m.id === id);
        if (index !== -1) {
          this.materials[index] = response.data;
        }
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Ошибка обновления материала';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteMaterial(id) {
      this.loading = true;
      this.error = null;
      try {
        await axios.delete(`${API_URL}/materials/${id}`);
        this.materials = this.materials.filter(m => m.id !== id);
      } catch (error) {
        this.error = error.response?.data?.error || 'Ошибка удаления материала';
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});