/**
 * Task Service
 * Handles all task-related API calls
 */

import { CONFIG, DEMO_TASKS } from './config.js';

export class TaskService {
    constructor() {
        this.tasks = [];
        this.apiAvailable = false;
    }

    /**
     * Load tasks from API or use demo data
     */
    async loadTasks() {
        try {
            const response = await fetch(`${CONFIG.API_BASE}/tasks`);
            const data = await response.json();
            this.tasks = data.tasks || [];
            this.apiAvailable = true;
            return { tasks: this.tasks, isDemo: false };
        } catch (error) {
            console.warn('API not available. Using demo mode without backend.');
            this.tasks = [...DEMO_TASKS];
            this.apiAvailable = false;
            return { tasks: this.tasks, isDemo: true };
        }
    }

    /**
     * Add a new task
     */
    async addTask(title, priority) {
        if (!title) {
            throw new Error('Task title is required');
        }

        if (!this.apiAvailable) {
            throw new Error('API not available. This feature requires the API server running on http://localhost:3005\n\nTo start the API:\n  cd api\n  npm install\n  npm start');
        }

        const response = await fetch(`${CONFIG.API_BASE}/tasks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, priority, tags: ['trunk-based'] })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error('Failed to create task');
        }

        return data;
    }

    /**
     * Search tasks with filters
     */
    async searchTasks(query, status, priority) {
        const response = await fetch(`${CONFIG.API_BASE}/search`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query, status, priority })
        });

        const data = await response.json();

        if (!data.success) {
            throw new Error('Search failed');
        }

        return data;
    }

    /**
     * Export tasks to CSV
     */
    exportCSV() {
        window.open(`${CONFIG.API_BASE}/export/csv`, '_blank');
    }

    /**
     * Preview CSV export
     */
    async previewCSV() {
        const response = await fetch(`${CONFIG.API_BASE}/export/preview`);
        const data = await response.json();

        if (!data.success) {
            throw new Error('Preview failed');
        }

        return data;
    }
}
