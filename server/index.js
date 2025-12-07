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

// Middleware для проверки прав доступа
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    try {
      const user = await prisma.user.findUnique({ 
        where: { id: req.userId },
        select: {
          id: true,
          role: {
            select: {
              permissions: true
            }
          }
        }
      });
      
      if (!user || !user.role) {
        return res.status(403).json({ error: 'Доступ запрещен' });
      }
      
      const permissions = user.role.permissions || [];
      
      if (permissions.includes(requiredPermission)) {
        next();
      } else {
        res.status(403).json({ error: 'Недостаточно прав доступа' });
      }
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  };
};

// ===== АВТОРИЗАЦИЯ =====

// Регистрация (убрана из публичного доступа)
// Теперь только администратор может создавать пользователей через /api/personnel

// Вход
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
            permissions: true
          }
        }
      }
    });
    
    if (!user) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Неверный email или пароль' });
    }
    
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    const { password: _, ...userWithoutPassword } = user;
    const userData = {
      ...userWithoutPassword,
      permissions: user.role?.permissions || []
    };
    
    res.json({ token, user: userData });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Проверка токена
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({ 
      where: { id: req.userId },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            displayName: true,
            permissions: true
          }
        }
      }
    });
    
    // Добавляем permissions на верхний уровень для удобства
    const userData = {
      ...user,
      permissions: user.role?.permissions || []
    };
    
    res.json(userData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CRUD РОЛИ =====

app.get('/api/roles', authMiddleware, checkPermission('roles.view'), async (req, res) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { id: 'asc' }
    });
    res.json(roles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/roles', authMiddleware, checkPermission('roles.edit'), async (req, res) => {
  try {
    const { name, displayName, description, permissions, isSystem } = req.body;
    
    const existingRole = await prisma.role.findUnique({ where: { name } });
    if (existingRole) {
      return res.status(400).json({ error: 'Роль с таким именем уже существует' });
    }
    
    const role = await prisma.role.create({
      data: {
        name,
        displayName,
        description,
        permissions,
        isSystem: isSystem || false
      }
    });
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/roles/:id', authMiddleware, checkPermission('roles.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { displayName, description, permissions } = req.body;
    
    const role = await prisma.role.update({
      where: { id: parseInt(id) },
      data: { displayName, description, permissions }
    });
    res.json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/roles/:id', authMiddleware, checkPermission('roles.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const role = await prisma.role.findUnique({ where: { id: parseInt(id) } });
    if (role && role.isSystem) {
      return res.status(400).json({ error: 'Невозможно удалить системную роль' });
    }
    
    // Проверяем, есть ли пользователи с этой ролью
    const usersWithRole = await prisma.user.count({
      where: { roleId: parseInt(id) }
    });
    
    if (usersWithRole > 0) {
      return res.status(400).json({ 
        error: `Невозможно удалить роль. Есть ${usersWithRole} пользователей с этой ролью.` 
      });
    }
    
    await prisma.role.delete({ where: { id: parseInt(id) } });
    res.json({ message: 'Роль удалена успешно' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CRUD ПЕРСОНАЛ =====

app.get('/api/personnel', authMiddleware, checkPermission('personnel.view'), async (req, res) => {
  try {
    const personnel = await prisma.user.findMany({
      select: { 
        id: true, 
        name: true, 
        email: true, 
        roleId: true,
        role: {
          select: {
            name: true,
            displayName: true
          }
        }
      }
    });
    res.json(personnel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/personnel', authMiddleware, checkPermission('personnel.edit'), async (req, res) => {
  try {
    const { name, email, password, role: roleName } = req.body;
    
    // Находим роль по имени
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      return res.status(400).json({ error: 'Роль не найдена' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const personnel = await prisma.user.create({ 
      data: { 
        name, 
        email, 
        password: hashedPassword, 
        roleId: role.id
      },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        roleId: true,
        role: {
          select: {
            name: true,
            displayName: true
          }
        }
      }
    });
    res.json(personnel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/personnel/:id', authMiddleware, checkPermission('personnel.edit'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, role: roleName } = req.body;
    
    // Находим роль по имени
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (!role) {
      return res.status(400).json({ error: 'Роль не найдена' });
    }
    
    const personnel = await prisma.user.update({
      where: { id: parseInt(id) },
      data: { name, email, roleId: role.id },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        roleId: true,
        role: {
          select: {
            name: true,
            displayName: true
          }
        }
      }
    });
    res.json(personnel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/personnel/:id', authMiddleware, checkPermission('personnel.edit'), async (req, res) => {
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