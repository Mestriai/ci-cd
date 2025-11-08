/**
 * Base Task CRUD Routes
 * Always available (no feature toggle)
 */

const express = require('express');
const fs = require('fs');
const path = require('path');

const router = express.Router();
const DB_PATH = path.join(__dirname, '..', 'db.json');

// Helper: Read database
function readDB() {
  const data = fs.readFileSync(DB_PATH, 'utf8');
  return JSON.parse(data);
}

// Helper: Write database
function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// GET /api/tasks - List all tasks
router.get('/', (req, res) => {
  try {
    const db = readDB();
    res.json({
      success: true,
      tasks: db.tasks || [],
      count: db.tasks?.length || 0
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', (req, res) => {
  try {
    const db = readDB();
    const task = db.tasks.find(t => t.id === parseInt(req.params.id));

    if (!task) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    res.json({
      success: true,
      task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/tasks - Create new task
router.post('/', (req, res) => {
  try {
    const db = readDB();
    const { title, description, priority, tags } = req.body;

    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }

    const newTask = {
      id: db.nextId,
      title,
      description: description || '',
      status: 'pending',
      priority: priority || 'medium',
      tags: tags || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    db.tasks.push(newTask);
    db.nextId++;
    writeDB(db);

    res.status(201).json({
      success: true,
      task: newTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', (req, res) => {
  try {
    const db = readDB();
    const taskIndex = db.tasks.findIndex(t => t.id === parseInt(req.params.id));

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const updates = req.body;
    db.tasks[taskIndex] = {
      ...db.tasks[taskIndex],
      ...updates,
      id: db.tasks[taskIndex].id, // Preserve ID
      updated_at: new Date().toISOString()
    };

    writeDB(db);

    res.json({
      success: true,
      task: db.tasks[taskIndex]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', (req, res) => {
  try {
    const db = readDB();
    const taskIndex = db.tasks.findIndex(t => t.id === parseInt(req.params.id));

    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const deletedTask = db.tasks.splice(taskIndex, 1)[0];
    writeDB(db);

    res.json({
      success: true,
      task: deletedTask
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
