<template>
  <div class="materials-container">
    <div class="header">
      <h2>Склад - Управление материалами</h2>
      <button 
        v-if="canEdit"
        @click="showAddModal = true" 
        class="btn-add"
      >
        + Добавить материал
      </button>
    </div>

    <div v-if="materialsStore.loading" class="loading">
      Загрузка...
    </div>

    <div v-else-if="materialsStore.error" class="error">
      {{ materialsStore.error }}
    </div>

    <div v-else class="materials-table">
      <table>
        <thead>
          <tr>
            <th>Название</th>
            <th>Количество</th>
            <th>Единица измерения</th>
            <th>Цена</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="material in materialsStore.allMaterials" :key="material.id">
            <td>{{ material.name }}</td>
            <td>{{ material.quantity }}</td>
            <td>{{ material.unit }}</td>
            <td>{{ material.price }} ₽</td>
            <td>
              <button 
                v-if="canEdit"
                @click="editMaterial(material)" 
                class="btn-edit-small"
              >
                ✏️
              </button>
              <button 
                v-if="canEdit"
                @click="deleteMaterial(material.id)" 
                class="btn-delete-small"
              >
                🗑️
              </button>
              <span v-if="!canEdit" class="no-access">Только просмотр</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Модальное окно -->
    <div v-if="showAddModal || editingMaterial" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <h3>{{ editingMaterial ? 'Редактировать' : 'Добавить' }} материал</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Название</label>
            <input v-model="formData.name" required />
          </div>
          <div class="form-group">
            <label>Количество</label>
            <input v-model.number="formData.quantity" type="number" required />
          </div>
          <div class="form-group">
            <label>Единица измерения</label>
            <input v-model="formData.unit" required placeholder="кг, м, шт" />
          </div>
          <div class="form-group">
            <label>Цена</label>
            <input v-model.number="formData.price" type="number" step="0.01" required />
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-cancel">
              Отмена
            </button>
            <button type="submit" class="btn-submit">
              {{ editingMaterial ? 'Сохранить' : 'Добавить' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useMaterialsStore } from '../stores/materialsStore';
import { useAuthStore } from '../stores/authStore';

const materialsStore = useMaterialsStore();
const authStore = useAuthStore();

// Проверка прав доступа - логист может только редактировать
const canEdit = computed(() => {
  const userPermissions = authStore.user?.permissions || [];
  return userPermissions.includes('warehouse.edit');
});
const showAddModal = ref(false);
const editingMaterial = ref(null);
const formData = ref({
  name: '',
  quantity: 0,
  unit: '',
  price: 0
});

onMounted(() => {
  materialsStore.fetchMaterials();
});

const editMaterial = (material) => {
  editingMaterial.value = material;
  formData.value = { ...material };
};

const closeModal = () => {
  showAddModal.value = false;
  editingMaterial.value = null;
  formData.value = { name: '', quantity: 0, unit: '', price: 0 };
};

const handleSubmit = async () => {
  try {
    if (editingMaterial.value) {
      await materialsStore.updateMaterial(editingMaterial.value.id, formData.value);
    } else {
      await materialsStore.createMaterial(formData.value);
    }
    closeModal();
  } catch (error) {
    console.error('Ошибка:', error);
  }
};

const deleteMaterial = async (id) => {
  if (confirm('Вы уверены, что хотите удалить этот материал?')) {
    try {
      await materialsStore.deleteMaterial(id);
    } catch (error) {
      console.error('Ошибка:', error);
    }
  }
};
</script>

<style scoped>
.materials-container {
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

.materials-table {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th, td {
  padding: 15px;
  text-align: left;
}

th {
  background: #f5f5f5;
  font-weight: 600;
  color: #333;
}

tbody tr {
  border-bottom: 1px solid #eee;
}

tbody tr:hover {
  background: #f9f9f9;
}

.btn-edit-small, .btn-delete-small {
  padding: 5px 10px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 18px;
}

.btn-edit-small:hover {
  opacity: 0.7;
}

.no-access {
  color: #999;
  font-size: 14px;
  font-style: italic;
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
  max-width: 500px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
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