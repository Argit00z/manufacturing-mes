<script setup>
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from './stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

onMounted(() => {
  authStore.checkAuth();
});

const handleLogout = () => {
  authStore.logout();
  router.push('/login');
};
</script>

<template>
  <div id="app">
    <nav v-if="authStore.isLoggedIn" class="navbar">
      <div class="navbar-brand">
        <h1>MES Система</h1>
      </div>
      <div class="navbar-menu">
        <router-link to="/" class="nav-link">Задачи</router-link>
        <router-link to="/personnel" class="nav-link">Персонал</router-link>
        <router-link to="/materials" class="nav-link">Материалы</router-link>
      </div>
      <div class="navbar-user">
        <span>{{ authStore.user?.name || 'Пользователь' }}</span>
        <button @click="handleLogout" class="btn-logout">Выйти</button>
      </div>
    </nav>
    
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background: #f5f5f5;
}

#app {
  min-height: 100vh;
}

.navbar {
  background: white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  padding: 15px 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.navbar-brand h1 {
  font-size: 24px;
  color: #4CAF50;
}

.navbar-menu {
  display: flex;
  gap: 20px;
}

.nav-link {
  text-decoration: none;
  color: #666;
  padding: 8px 16px;
  border-radius: 4px;
  transition: all 0.3s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background: #4CAF50;
  color: white;
}

.navbar-user {
  display: flex;
  align-items: center;
  gap: 15px;
}

.navbar-user span {
  color: #666;
  font-weight: 500;
}

.btn-logout {
  padding: 8px 16px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s;
}

.btn-logout:hover {
  background: #d32f2f;
}

.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}
</style>