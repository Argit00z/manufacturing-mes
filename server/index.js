const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient({});


app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// CRUD Персонал
app.get('/api/personnel', async (req, res) => {
  try {
    const personnel = await prisma.user.findMany();
    res.json(personnel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/personnel', async (req, res) => {
  try {
    const personnel = await prisma.user.create({ data: req.body });
    res.json(personnel);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRUD Материалы
app.get('/api/materials', async (req, res) => {
  try {
    const materials = await prisma.material.findMany();
    res.json(materials);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/materials', async (req, res) => {
  try {
    const material = await prisma.material.create({ data: req.body });
    res.json(material);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// CRUD Задачи
app.get('/api/tasks', async (req, res) => {
  try {
    const tasks = await prisma.task.findMany({
      include: { user: true, material: true }
    });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/tasks', async (req, res) => {
  try {
    const task = await prisma.task.create({ data: req.body });
    res.json(task);
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