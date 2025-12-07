<template>
  <div class="roles-container">
    <div class="header">
      <h2>Управление ролями и правами доступа</h2>
      <button @click="showAddModal = true" class="btn-add">
        + Создать роль
      </button>
    </div>

    <div v-if="rolesStore.loading" class="loading">
      Загрузка...
    </div>

    <div v-else-if="rolesStore.error" class="error">
      {{ rolesStore.error }}
    </div>

    <div v-else class="roles-grid">
      <div
        v-for="role in rolesStore.allRoles"
        :key="role.id"
        class="role-card"
      >
        <div class="role-header">
          <h3>{{ role.displayName }}</h3>
          <span class="role-name-badge">{{ role.name }}</span>
        </div>
        <p class="role-description">{{ role.description }}</p>
        
        <div class="permissions-section">
          <h4>Права доступа:</h4>
          <div class="permissions-list">
            <div 
              v-for="perm in role.permissions" 
              :key="perm"
              class="permission-item"
            >
              <span class="permission-icon">✓</span>
              {{ getPermissionText(perm) }}
            </div>
          </div>
        </div>

        <div class="actions">
          <button @click="editRole(role)" class="btn-edit">
            Редактировать
          </button>
          <button 
            v-if="!role.isSystem"
            @click="deleteRole(role.id)" 
            class="btn-delete"
          >
            Удалить
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно добавления/редактирования роли -->
    <div v-if="showAddModal || editingRole" class="modal" @click.self="closeModal">
      <div class="modal-content large">
        <h3>{{ editingRole ? 'Редактировать' : 'Создать' }} роль</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Системное имя роли (латиница, без пробелов)</label>
            <input 
              v-model="formData.name" 
              required 
              pattern="[a-z_]+"
              placeholder="logistician"
              :disabled="editingRole?.isSystem"
            />
            <small>Используется в системе для идентификации</small>
          </div>

          <div class="form-group">
            <label>Отображаемое название</label>
            <input 
              v-model="formData.displayName" 
              required 
              placeholder="Логист"
            />
          </div>

          <div class="form-group">
            <label>Описание</label>
            <textarea 
              v-model="formData.description" 
              rows="3"
              placeholder="Краткое описание роли и её назначения"
            ></textarea>
          </div>

          <div class="form-group">
            <label>Права доступа</label>
            <div class="permissions-checkboxes">
              <div 
                v-for="permission in availablePermissions" 
                :key="permission.value"
                class="checkbox-item"
              >
                <label>
                  <input 
                    type="checkbox" 
                    :value="permission.value"
                    v-model="formData.permissions"
                  />
                  <span>{{ permission.label }}</span>
                  <small>{{ permission.description }}</small>
                </label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input 
                type="checkbox" 
                v-model="formData.isSystem"
                :disabled="editingRole?.isSystem"
              />
              Системная роль (нельзя удалить)
            </label>
          </div>

          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-cancel">
              Отмена
            </button>
            <button type="submit" class="btn-submit">
              {{ editingRole ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRolesStore } from '../stores/rolesStore';

const rolesStore = useRolesStore();
const showAddModal = ref(false);
const editingRole = ref(null);

const availablePermissions = [
  { 
    value: 'dashboard.view', 
    label: 'Просмотр дашборда',
    description: 'Просмотр задач и статистики'
  },
  { 
    value: 'dashboard.edit', 
    label: 'Редактирование дашборда',
    description: 'Создание, изменение и удаление задач'
  },
  { 
    value: 'warehouse.view', 
    label: 'Просмотр склада',
    description: 'Просмотр материалов и остатков'
  },
  { 
    value: 'warehouse.edit', 
    label: 'Редактирование склада',
    description: 'Управление материалами на складе'
  },
  { 
    value: 'personnel.view', 
    label: 'Просмотр персонала',
    description: 'Просмотр списка сотрудников'
  },
  { 
    value: 'personnel.edit', 
    label: 'Управление персоналом',
    description: 'Добавление, изменение и удаление сотрудников'
  },
  { 
    value: 'roles.view', 
    label: 'Просмотр ролей',
    description: 'Просмотр ролей и прав доступа'
  },
  { 
    value: 'roles.edit', 
    label: 'Управление ролями',
    description: 'Создание и изменение ролей и прав'
  }
];

const formData = ref({
  name: '',
  displayName: '',
  description: '',
  permissions: [],
  isSystem: false
});

onMounted(() => {
  rolesStore.fetchRoles();
});

const getPermissionText = (perm) => {
  const permission = availablePermissions.find(p => p.value === perm);
  return permission ? permission.label : perm;
};

const editRole = (role) => {
  editingRole.value = role;
  formData.value = {
    name: role.name,
    displayName: role.displayName,
    description: role.description || '',
    permissions: [...role.permissions],
    isSystem: role.isSystem
  };
};

const closeModal = () => {
  showAddModal.value = false;
  editingRole.value = null;
  formData.value = {
    name: '',
    displayName: '',
    description: '',
    permissions: [],
    isSystem: false
  };
};

const handleSubmit = async () => {
  try {
    if (editingRole.value) {
      await rolesStore.updateRole(editingRole.value.id, formData.value);
    } else {
      await rolesStore.createRole(formData.value);
    }
    closeModal();
  } catch (error) {
    console.error('Ошибка:', error);
  }
};

const deleteRole = async (id) => {
  if (confirm('Вы уверены, что хотите удалить эту роль? Все пользователи с этой ролью потеряют доступ.')) {
    try {
      await rolesStore.deleteRole(id);
    } catch (error) {
      console.error('Ошибка:', error);
    }
  }
};
</script>

<style scoped>
.roles-container {
  padding: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.btn-add {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.roles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.role-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #4CAF50;
}

.role-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.role-header h3 {
  margin: 0;
  color: #333;
}

.role-name-badge {
  padding: 4px 12px;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.role-description {
  color: #666;
  margin: 10px 0;
  font-size: 14px;
}

.permissions-section {
  margin: 20px 0;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
}

.permissions-section h4 {
  margin: 0 0 10px 0;
  font-size: 14px;
  color: #555;
}

.permissions-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.permission-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #555;
}

.permission-icon {
  color: #4CAF50;
  font-weight: bold;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: 15px;
}

.btn-edit, .btn-delete {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-edit {
  background: #2196F3;
  color: white;
}

.btn-delete {
  background: #f44336;
  color: white;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-content.large {
  max-width: 700px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: 500;
  color: #333;
}

.form-group small {
  display: block;
  margin-top: 5px;
  color: #999;
  font-size: 12px;
}

.form-group input,
.form-group textarea {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.permissions-checkboxes {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
  max-height: 300px;
  overflow-y: auto;
}

.checkbox-item label {
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.checkbox-item input[type="checkbox"] {
  width: auto;
  margin-right: 8px;
}

.checkbox-item span {
  font-weight: 500;
  color: #333;
}

.checkbox-item small {
  margin-left: 28px;
  color: #666;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  width: auto;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.btn-cancel {
  padding: 10px 20px;
  background: #ccc;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.btn-submit {
  padding: 10px 20px;
  background: #4CAF50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.loading, .error {
  text-align: center;
  padding: 20px;
  font-size: 18px;
}

.error {
  color: #f44336;
}
</style>