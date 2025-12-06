<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

const router = useRouter();
const authStore = useAuthStore();

const formData = ref({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  role: ''
});

const loading = ref(false);
const error = ref(null);
const success = ref(null);

const handleRegister = async () => {
  error.value = null;
  success.value = null;

  // Валидация
  if (formData.value.password !== formData.value.confirmPassword) {
    error.value = 'Пароли не совпадают';
    return;
  }

  if (formData.value.password.length < 6) {
    error.value = 'Пароль должен содержать минимум 6 символов';
    return;
  }

  loading.value = true;
  
  try {
    const { confirmPassword, ...registerData } = formData.value;
    await authStore.register(registerData);
    success.value = 'Регистрация успешна! Перенаправление на страницу входа...';
    
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  } catch (err) {
    error.value = err.error || 'Ошибка регистрации';
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div class="register-container">
    <div class="register-card">
      <h2>Регистрация</h2>
      <form @submit.prevent="handleRegister">
        <div class="form-group">
          <label for="name">Имя</label>
          <input
            id="name"
            v-model="formData.name"
            type="text"
            required
            placeholder="Введите ваше имя"
          />
        </div>

        <div class="form-group">
          <label for="email">Email</label>
          <input
            id="email"
            v-model="formData.email"
            type="email"
            required
            placeholder="Введите email"
          />
        </div>
        
        <div class="form-group">
          <label for="password">Пароль</label>
          <input
            id="password"
            v-model="formData.password"
            type="password"
            required
            placeholder="Введите пароль"
            minlength="6"
          />
        </div>

        <div class="form-group">
          <label for="confirmPassword">Подтвердите пароль</label>
          <input
            id="confirmPassword"
            v-model="formData.confirmPassword"
            type="password"
            required
            placeholder="Повторите пароль"
            minlength="6"
          />
        </div>

        <div class="form-group">
          <label for="role">Роль</label>
          <select id="role" v-model="formData.role" required>
            <option value="">Выберите роль</option>
            <option value="worker">Работник</option>
            <option value="manager">Менеджер</option>
            <option value="admin">Администратор</option>
          </select>
        </div>

        <div v-if="error" class="error-message">
          {{ error }}
        </div>

        <div v-if="success" class="success-message">
          {{ success }}
        </div>

        <button type="submit" :disabled="loading" class="btn-primary">
          {{ loading ? 'Регистрация...' : 'Зарегистрироваться' }}
        </button>
      </form>

      <div class="login-link">
        Уже есть аккаунт? 
        <router-link to="/login">Войти</router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: #f5f5f5;
}

.register-card {
  background: white;
  padding: 40px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 450px;
}

h2 {
  margin-bottom: 30px;
  text-align: center;
  color: #333;
}

.form-group {
  margin-bottom: 20px;
}

label {
  display: block;
  margin-bottom: 8px;
  color: #555;
  font-weight: 500;
}

input,
select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}

input:focus,
select:focus {
  outline: none;
  border-color: #4CAF50;
}

.btn-primary {
  width: 100%;
  padding: 12px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
  transition: background 0.3s;
  margin-top: 10px;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
}

.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.error-message {
  background: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
}

.success-message {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 20px;
  font-size: 14px;
}

.login-link {
  text-align: center;
  margin-top: 20px;
  color: #666;
  font-size: 14px;
}

.login-link a {
  color: #4CAF50;
  text-decoration: none;
  font-weight: 500;
}

.login-link a:hover {
  text-decoration: underline;
}
</style>