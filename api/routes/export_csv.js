/**
 * Export CSV Feature (Dev 2)
 * Feature Toggle: export_csv
 *
 * Scenario: Dev 2 is working fast (2 days)
 * - Completes feature quickly
 * - Ships to production while Dev 1 still works
 * - No blocking, no merge conflicts
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

// Helper: Convert tasks to CSV
function tasksToCSV(tasks, columns) {
  if (tasks.length === 0) {
    return 'No tasks to export';
  }

  // Default columns if not specified
  const defaultColumns = ['id', 'title', 'description', 'status', 'priority', 'tags', 'created_at'];
  const selectedColumns = columns && columns.length > 0 ? columns : defaultColumns;

  // CSV header
  const header = selectedColumns.join(',');

  // CSV rows
  const rows = tasks.map(task => {
    return selectedColumns.map(col => {
      let value = task[col];

      // Handle arrays (tags)
      if (Array.isArray(value)) {
        value = value.join(';');
      }

      // Handle undefined/null
      if (value === undefined || value === null) {
        value = '';
      }

      // Escape quotes and wrap in quotes if contains comma
      value = String(value);
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value.replace(/"/g, '""')}"`;
      }

      return value;
    }).join(',');
  });

  return [header, ...rows].join('\n');
}

// GET /api/export/csv - Export all tasks to CSV
router.get('/csv', (req, res) => {
  try {
    const db = readDB();
    const tasks = db.tasks || [];

    // Get optional column selection from query params
    const columnsParam = req.query.columns;
    const columns = columnsParam ? columnsParam.split(',') : null;

    // Convert to CSV
    const csv = tasksToCSV(tasks, columns);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="tasks_${new Date().toISOString().split('T')[0]}.csv"`);

    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/export/csv - Export filtered tasks to CSV
router.post('/csv', (req, res) => {
  try {
    const db = readDB();
    let tasks = db.tasks || [];

    // Apply filters if provided
    const { status, priority, tags, columns } = req.body;

    if (status) {
      tasks = tasks.filter(t => t.status === status);
    }

    if (priority) {
      tasks = tasks.filter(t => t.priority === priority);
    }

    if (tags && tags.length > 0) {
      tasks = tasks.filter(t =>
        t.tags && t.tags.some(tag => tags.includes(tag))
      );
    }

    // Convert to CSV
    const csv = tasksToCSV(tasks, columns);

    // Set headers for file download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="filtered_tasks_${new Date().toISOString().split('T')[0]}.csv"`);

    res.send(csv);
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/export/preview - Preview CSV export (JSON response)
router.get('/preview', (req, res) => {
  try {
    const db = readDB();
    const tasks = db.tasks || [];

    const columnsParam = req.query.columns;
    const columns = columnsParam ? columnsParam.split(',') : null;

    const csv = tasksToCSV(tasks, columns);

    res.json({
      success: true,
      preview: csv,
      taskCount: tasks.length,
      feature: {
        name: 'export_csv',
        developer: 'dev2',
        status: 'completed',
        message: 'This feature was completed in 2 days and shipped to production!'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
