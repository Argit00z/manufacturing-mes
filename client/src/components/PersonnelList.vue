<script setup>
import { ref, onMounted } from 'vue';
import { usePersonnelStore } from '../stores/personnelStore';

const personnelStore = usePersonnelStore();
const showAddModal = ref(false);
const editingPerson = ref(null);
const formData = ref({
  name: '',
  email: '',
  role: '',
  password: ''
});

onMounted(() => {
  personnelStore.fetchPersonnel();
});

const editPersonnel = (person) => {
  editingPerson.value = person;
  formData.value = { ...person };
};

const closeModal = () => {
  showAddModal.value = false;
  editingPerson.value = null;
  formData.value = { name: '', email: '', role: '', password: '' };
};

const handleSubmit = async () => {
  try {
    if (editingPerson.value) {
      await personnelStore.updatePersonnel(editingPerson.value.id, formData.value);
    } else {
      await personnelStore.createPersonnel(formData.value);
    }
    closeModal();
  } catch (error) {
    console.error('Ошибка:', error);
  }
};

const deletePersonnel = async (id) => {
  if (confirm('Вы уверены, что хотите удалить этого сотрудника?')) {
    try {
      await personnelStore.deletePersonnel(id);
    } catch (error) {
      console.error('Ошибка:', error);
    }
  }
};
</script>

<template>
  <div class="personnel-container">
    <div class="header">
      <h2>Персонал</h2>
      <button @click="showAddModal = true" class="btn-add">
        + Добавить сотрудника
      </button>
    </div>

    <div v-if="personnelStore.loading" class="loading">
      Загрузка...
    </div>

    <div v-else-if="personnelStore.error" class="error">
      {{ personnelStore.error }}
    </div>

    <div v-else class="personnel-grid">
      <div
        v-for="person in personnelStore.allPersonnel"
        :key="person.id"
        class="personnel-card"
      >
        <h3>{{ person.name }}</h3>
        <p><strong>Email:</strong> {{ person.email }}</p>
        <p><strong>Роль:</strong> {{ person.role }}</p>
        <div class="actions">
          <button @click="editPersonnel(person)" class="btn-edit">
            Редактировать
          </button>
          <button @click="deletePersonnel(person.id)" class="btn-delete">
            Удалить
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно добавления/редактирования -->
    <div v-if="showAddModal || editingPerson" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <h3>{{ editingPerson ? 'Редактировать' : 'Добавить' }} сотрудника</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Имя</label>
            <input v-model="formData.name" required />
          </div>
          <div class="form-group">
            <label>Email</label>
            <input v-model="formData.email" type="email" required />
          </div>
          <div class="form-group">
            <label>Роль</label>
            <input v-model="formData.role" required />
          </div>
          <div v-if="!editingPerson" class="form-group">
            <label>Пароль</label>
            <input v-model="formData.password" type="password" required />
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-cancel">
              Отмена
            </button>
            <button type="submit" class="btn-submit">
              {{ editingPerson ? 'Сохранить' : 'Добавить' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.personnel-container {
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

.personnel-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.personnel-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.personnel-card h3 {
  margin-bottom: 10px;
  color: #333;
}

.personnel-card p {
  margin: 5px 0;
  color: #666;
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