import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/authStore';
import LoginForm from '../components/LoginForm.vue';
import TasksList from '../components/TasksList.vue';
import PersonnelList from '../components/PersonnelList.vue';
import MaterialsList from '../components/MaterialsList.vue';
import RolesManagement from '../components/RolesManagement.vue';

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: LoginForm,
    meta: { requiresGuest: true }
  },
  {
    path: '/',
    name: 'Tasks',
    component: TasksList,
    meta: { 
      requiresAuth: true,
      requiredPermission: 'dashboard.view'
    }
  },
  {
    path: '/personnel',
    name: 'Personnel',
    component: PersonnelList,
    meta: { 
      requiresAuth: true,
      requiredPermission: 'personnel.view'
    }
  },
  {
    path: '/materials',
    name: 'Materials',
    component: MaterialsList,
    meta: { 
      requiresAuth: true,
      requiredPermission: 'warehouse.view'
    }
  },
  {
    path: '/roles',
    name: 'Roles',
    component: RolesManagement,
    meta: { 
      requiresAuth: true,
      requiredPermission: 'roles.view'
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

// Navigation guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore();
  
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login');
  } else if (to.meta.requiresGuest && authStore.isLoggedIn) {
    next('/');
  } else if (to.meta.requiredPermission) {
    // Проверка прав доступа на основе permissions
    const userPermissions = authStore.user?.permissions || [];
    const requiredPermission = to.meta.requiredPermission;
    
    if (userPermissions.includes(requiredPermission)) {
      next();
    } else {
      // Перенаправляем на главную если нет доступа
      next('/');
    }
  } else {
    next();
  }
});

export default router;