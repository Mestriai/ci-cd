/**
 * Advanced Search Feature (Dev 1)
 * Feature Toggle: advanced_search
 *
 * Scenario: Dev 1 is working slowly (14 days)
 * - Pushes incomplete code to main daily
 * - Enabled in stage for testing
 * - Disabled in production until complete
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

// POST /api/search - Advanced search with filters
router.post('/', (req, res) => {
  try {
    const db = readDB();
    const { query, status, priority, tags, dateFrom, dateTo } = req.body;

    let results = db.tasks || [];

    // Filter by text query (title or description)
    if (query) {
      const lowerQuery = query.toLowerCase();
      results = results.filter(task =>
        task.title.toLowerCase().includes(lowerQuery) ||
        (task.description && task.description.toLowerCase().includes(lowerQuery))
      );
    }

    // Filter by status
    if (status) {
      results = results.filter(task => task.status === status);
    }

    // Filter by priority
    if (priority) {
      results = results.filter(task => task.priority === priority);
    }

    // Filter by tags
    if (tags && tags.length > 0) {
      results = results.filter(task =>
        task.tags && task.tags.some(tag => tags.includes(tag))
      );
    }

    // Filter by date range
    if (dateFrom) {
      results = results.filter(task =>
        new Date(task.created_at) >= new Date(dateFrom)
      );
    }

    if (dateTo) {
      results = results.filter(task =>
        new Date(task.created_at) <= new Date(dateTo)
      );
    }

    res.json({
      success: true,
      results,
      count: results.length,
      filters: {
        query: query || null,
        status: status || null,
        priority: priority || null,
        tags: tags || null,
        dateFrom: dateFrom || null,
        dateTo: dateTo || null
      },
      feature: {
        name: 'advanced_search',
        developer: 'dev1',
        status: 'This feature is enabled!'
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/search/facets - Get available filter options
router.get('/facets', (req, res) => {
  try {
    const db = readDB();
    const tasks = db.tasks || [];

    // Extract unique values for filters
    const statuses = [...new Set(tasks.map(t => t.status))];
    const priorities = [...new Set(tasks.map(t => t.priority))];
    const allTags = tasks.flatMap(t => t.tags || []);
    const tags = [...new Set(allTags)];

    res.json({
      success: true,
      facets: {
        statuses,
        priorities,
        tags,
        totalTasks: tasks.length
      },
      feature: {
        name: 'advanced_search',
        developer: 'dev1'
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
