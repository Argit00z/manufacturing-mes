import { defineStore } from 'pinia';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api';

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    loading: false,
    error: null
  }),

  getters: {
    allTasks: (state) => state.tasks,
    getTaskById: (state) => (id) => {
      return state.tasks.find(t => t.id === id);
    },
    tasksByUser: (state) => (userId) => {
      return state.tasks.filter(t => t.userId === userId);
    }
  },

  actions: {
    async fetchTasks() {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.get(`${API_URL}/tasks`);
        this.tasks = response.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Ошибка загрузки задач';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createTask(taskData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.post(`${API_URL}/tasks`, taskData);
        this.tasks.push(response.data);
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Ошибка создания задачи';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateTask(id, taskData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await axios.put(`${API_URL}/tasks/${id}`, taskData);
        const index = this.tasks.findIndex(t => t.id === id);
        if (index !== -1) {
          this.tasks[index] = response.data;
        }
        return response.data;
      } catch (error) {
        this.error = error.response?.data?.error || 'Ошибка обновления задачи';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteTask(id) {
      this.loading = true;
      this.error = null;
      try {
        await axios.delete(`${API_URL}/tasks/${id}`);
        this.tasks = this.tasks.filter(t => t.id !== id);
      } catch (error) {
        this.error = error.response?.data?.error || 'Ошибка удаления задачи';
        throw error;
      } finally {
        this.loading = false;
      }
    }
  }
});