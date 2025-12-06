import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import LoginForm from '../components/LoginForm.vue';
import RegisterForm from '../components/RegisterForm.vue';
import TasksList from '../components/TasksList.vue';
import PersonnelList from '../components/PersonnelList.vue';
import MaterialsList from '../components/MaterialsList.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginForm,
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: RegisterForm,
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    name: 'Tasks',
    component: TasksList,
    meta: { requiresAuth: true }
  },
  {
    path: '/personnel',
    name: 'Personnel',
    component: PersonnelList,
    meta: { requiresAuth: true }
  },
  {
    path: '/materials',
    name: 'Materials',
    component: MaterialsList,
    meta: { requiresAuth: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login');
  } else if (to.meta.requiresGuest && authStore.isLoggedIn) {
    next('/');
  } else {
    next();
  }
});

export default router;