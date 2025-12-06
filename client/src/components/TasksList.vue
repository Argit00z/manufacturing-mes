<script setup>
import { ref, onMounted } from 'vue';
import { useTasksStore } from '../stores/tasksStore';
import { usePersonnelStore } from '../stores/personnelStore';
import { useMaterialsStore } from '../stores/materialsStore';

const tasksStore = useTasksStore();
const personnelStore = usePersonnelStore();
const materialsStore = useMaterialsStore();

const showAddModal = ref(false);
const editingTask = ref(null);
const formData = ref({
  title: '',
  description: '',
  userId: '',
  materialId: '',
  deadline: '',
  status: 'pending'
});

onMounted(() => {
  tasksStore.fetchTasks();
  personnelStore.fetchPersonnel();
  materialsStore.fetchMaterials();
});

const getStatusText = (status) => {
  const statuses = {
    pending: 'В ожидании',
    in_progress: 'В работе',
    completed: 'Завершена'
  };
  return statuses[status] || status;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('ru-RU');
};

const editTask = (task) => {
  editingTask.value = task;
  
  // Форматируем дату для input type="date"
  const deadlineDate = new Date(task.deadline);
  const formattedDate = deadlineDate.toISOString().split('T')[0];
  
  formData.value = {
    title: task.title,
    description: task.description,
    userId: task.userId,
    materialId: task.materialId || '',
    deadline: formattedDate,
    status: task.status
  };
};

const closeModal = () => {
  showAddModal.value = false;
  editingTask.value = null;
  formData.value = {
    title: '',
    description: '',
    userId: '',
    materialId: '',
    deadline: '',
    status: 'pending'
  };
};

const handleSubmit = async () => {
  try {
    const submitData = { ...formData.value };
    
    // Удаляем materialId если он пустой
    if (!submitData.materialId) {
      delete submitData.materialId;
    }
    
    // Преобразуем userId и materialId в числа
    submitData.userId = parseInt(submitData.userId);
    if (submitData.materialId) {
      submitData.materialId = parseInt(submitData.materialId);
    }
    
    if (editingTask.value) {
      await tasksStore.updateTask(editingTask.value.id, submitData);
    } else {
      await tasksStore.createTask(submitData);
    }
    closeModal();
  } catch (error) {
    console.error('Ошибка:', error);
  }
};

const deleteTask = async (id) => {
  if (confirm('Вы уверены, что хотите удалить эту задачу?')) {
    try {
      await tasksStore.deleteTask(id);
    } catch (error) {
      console.error('Ошибка:', error);
    }
  }
};
</script>

<template>
  <div class="tasks-container">
    <div class="header">
      <h2>Задачи</h2>
      <button @click="showAddModal = true" class="btn-add">
        + Создать задачу
      </button>
    </div>

    <div v-if="tasksStore.loading" class="loading">
      Загрузка...
    </div>

    <div v-else-if="tasksStore.error" class="error">
      {{ tasksStore.error }}
    </div>

    <div v-else class="tasks-list">
      <div
        v-for="task in tasksStore.allTasks"
        :key="task.id"
        class="task-card"
        :class="{ completed: task.status === 'completed' }"
      >
        <div class="task-header">
          <h3>{{ task.title }}</h3>
          <span class="status-badge" :class="task.status">
            {{ getStatusText(task.status) }}
          </span>
        </div>
        <p class="task-description">{{ task.description }}</p>
        <div class="task-info">
          <div class="info-item">
            <strong>Исполнитель:</strong> {{ task.user?.name || 'Не назначен' }}
          </div>
          <div class="info-item" v-if="task.material">
            <strong>Материал:</strong> {{ task.material.name }}
          </div>
          <div class="info-item">
            <strong>Срок:</strong> {{ formatDate(task.deadline) }}
          </div>
        </div>
        <div class="actions">
          <button @click="editTask(task)" class="btn-edit">
            Редактировать
          </button>
          <button @click="deleteTask(task.id)" class="btn-delete">
            Удалить
          </button>
        </div>
      </div>
    </div>

    <!-- Модальное окно -->
    <div v-if="showAddModal || editingTask" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <h3>{{ editingTask ? 'Редактировать' : 'Создать' }} задачу</h3>
        <form @submit.prevent="handleSubmit">
          <div class="form-group">
            <label>Название</label>
            <input v-model="formData.title" required />
          </div>
          <div class="form-group">
            <label>Описание</label>
            <textarea v-model="formData.description" rows="4" required></textarea>
          </div>
          <div class="form-group">
            <label>Исполнитель</label>
            <select v-model="formData.userId" required>
              <option value="">Выберите исполнителя</option>
              <option
                v-for="person in personnelStore.allPersonnel"
                :key="person.id"
                :value="person.id"
              >
                {{ person.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Материал (опционально)</label>
            <select v-model="formData.materialId">
              <option value="">Без материала</option>
              <option
                v-for="material in materialsStore.allMaterials"
                :key="material.id"
                :value="material.id"
              >
                {{ material.name }}
              </option>
            </select>
          </div>
          <div class="form-group">
            <label>Срок выполнения</label>
            <input v-model="formData.deadline" type="date" required />
          </div>
          <div class="form-group">
            <label>Статус</label>
            <select v-model="formData.status" required>
              <option value="pending">В ожидании</option>
              <option value="in_progress">В работе</option>
              <option value="completed">Завершена</option>
            </select>
          </div>
          <div class="modal-actions">
            <button type="button" @click="closeModal" class="btn-cancel">
              Отмена
            </button>
            <button type="submit" class="btn-submit">
              {{ editingTask ? 'Сохранить' : 'Создать' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tasks-container {
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

.tasks-list {
  display: grid;
  gap: 20px;
}

.task-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #2196F3;
}

.task-card.completed {
  border-left-color: #4CAF50;
  opacity: 0.8;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-header h3 {
  margin: 0;
  color: #333;
}

.status-badge {
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 500;
}

.status-badge.pending {
  background: #fff3cd;
  color: #856404;
}

.status-badge.in_progress {
  background: #cce5ff;
  color: #004085;
}

.status-badge.completed {
  background: #d4edda;
  color: #155724;
}

.task-description {
  color: #666;
  margin: 10px 0;
}

.task-info {
  display: grid;
  gap: 8px;
  margin: 15px 0;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 4px;
}

.info-item {
  font-size: 14px;
  color: #555;
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

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.form-group input,
.form-group textarea,
.form-group select {
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