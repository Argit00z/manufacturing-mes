const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// Middleware для проверки токена
const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Токен не предоставлен' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Невалидный токен' });
  }
};

// ===== АВТОРИЗАЦИЯ =====

// Регистрация
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Пользователь уже существует' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || 'worker'
      }
    });
    
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Вход
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Проверка токена
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.userId },
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CRUD ПЕРСОНАЛ =====

app.get('/api/personnel', authMiddleware, async (req, res) => {
  try {
    const personnel = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(personnel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/personnel', authMiddleware, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const personnel = await prisma.user.create({ 
      data: { name, email, password: hashedPassword, role },
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(personnel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/personnel/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role } = req.body;
    
    const personnel = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { name, email, role },
      select: { id: true, name: true, email: true, role: true }
    });
    res.json(personnel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/personnel/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Удалено успешно' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CRUD МАТЕРИАЛЫ =====

app.get('/api/materials', authMiddleware, async (req, res) => {
  try {
    const materials = await prisma.material.findMany();
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/materials', authMiddleware, async (req, res) => {
  try {
    const material = await prisma.material.create({ data: req.body });
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/materials/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const material = await prisma.material.update({
      where: { id: parseInt(id) },
      data: req.body
    });
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/materials/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.material.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Удалено успешно' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CRUD ЗАДАЧИ =====

app.get('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: { 
        user: { select: { id: true, name: true, email: true } },
        material: true 
      }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', authMiddleware, async (req, res) => {
  try {
    const taskData = { ...req.body };
    
    // Преобразуем дату в ISO формат если она есть
    if (taskData.deadline) {
      // Добавляем время к дате, чтобы получить полный ISO формат
      const date = new Date(taskData.deadline);
      if (!isNaN(date.getTime())) {
        taskData.deadline = date.toISOString();
      }
    }
    
    // Преобразуем userId и materialId в числа
    if (taskData.userId) {
      taskData.userId = parseInt(taskData.userId);
    }
    if (taskData.materialId) {
      taskData.materialId = parseInt(taskData.materialId);
    }
    
    const task = await prisma.task.create({ 
      data: taskData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        material: true
      }
    });
    res.json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const taskData = { ...req.body };
    
    // Преобразуем дату в ISO формат если она есть
    if (taskData.deadline) {
      // Добавляем время к дате, чтобы получить полный ISO формат
      const date = new Date(taskData.deadline);
      if (!isNaN(date.getTime())) {
        taskData.deadline = date.toISOString();
      }
    }
    
    // Преобразуем userId и materialId в числа
    if (taskData.userId) {
      taskData.userId = parseInt(taskData.userId);
    }
    if (taskData.materialId) {
      taskData.materialId = parseInt(taskData.materialId);
    }
    
    const task = await prisma.task.update({
      where: { id: parseInt(id) },
      data: taskData,
      include: {
        user: { select: { id: true, name: true, email: true } },
        material: true
      }
    });
    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/tasks/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.task.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Удалено успешно' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));

process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit();
});