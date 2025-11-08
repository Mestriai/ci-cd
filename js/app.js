/**
 * Main Application Controller
 * Coordinates between services and UI
 */

import { FeatureFlagManager } from './featureFlagManager.js';
import { TaskService } from './taskService.js';
import { UIManager } from './ui.js';

class App {
    constructor() {
        this.featureFlags = new FeatureFlagManager();
        this.taskService = new TaskService();
        this.ui = new UIManager();

        // Make methods available globally for onclick handlers
        window.addTask = this.addTask.bind(this);
        window.searchTasks = this.searchTasks.bind(this);
        window.exportCSV = this.exportCSV.bind(this);
        window.previewCSV = this.previewCSV.bind(this);
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            await this.loadFeatureFlags();
            await this.loadTasks();
        } catch (error) {
            console.error('Error initializing app:', error);
        }
    }

    /**
     * Load and apply feature flags
     */
    async loadFeatureFlags() {
        try {
            await this.featureFlags.load();

            // Update UI based on feature flags
            this.ui.updateEnvironmentBadge(this.featureFlags.getEnvironment());
            this.ui.updateFeatureSection(
                'advanced_search',
                'search',
                this.featureFlags.getFeature('advanced_search')
            );
            this.ui.updateFeatureSection(
                'export_csv',
                'export',
                this.featureFlags.getFeature('export_csv')
            );
            this.ui.updateFeatureInfo(
                this.featureFlags.getEnvironment(),
                this.featureFlags.getAllFeatures()
            );
        } catch (error) {
            this.ui.showFeatureFlagError();
        }
    }

    /**
     * Load tasks from API or demo data
     */
    async loadTasks() {
        const { tasks, isDemo } = await this.taskService.loadTasks();
        this.ui.renderTasks(tasks, isDemo);
    }

    /**
     * Add a new task
     */
    async addTask() {
        const { title, priority } = this.ui.getTaskFormValues();

        if (!title) {
            this.ui.showAlert('Please enter a task title');
            return;
        }

        try {
            await this.taskService.addTask(title, priority);
            this.ui.clearTaskForm();
            await this.loadTasks();
        } catch (error) {
            console.error('Error adding task:', error);
            this.ui.showAlert(error.message);
        }
    }

    /**
     * Search tasks (Dev 1's feature)
     */
    async searchTasks() {
        if (!this.featureFlags.isEnabled('advanced_search')) {
            this.ui.showAlert(
                'Advanced Search is disabled in this environment.\n\n' +
                'This feature is:\n' +
                '- ENABLED in Stage (for testing)\n' +
                '- DISABLED in Production (not ready yet)'
            );
            return;
        }

        const { query, status, priority } = this.ui.getSearchFormValues();

        try {
            const data = await this.taskService.searchTasks(query, status, priority);
            this.ui.showSearchResults(data.count);
            this.ui.renderTasks(data.results);
        } catch (error) {
            console.error('Error searching:', error);
            this.ui.showAlert('Error searching tasks');
        }
    }

    /**
     * Export tasks to CSV (Dev 2's feature)
     */
    exportCSV() {
        if (!this.featureFlags.isEnabled('export_csv')) {
            this.ui.showAlert(
                'Export CSV is disabled in this environment.\n\n' +
                'This feature is:\n' +
                '- ENABLED in Stage\n' +
                '- ENABLED in Production (shipped!)'
            );
            return;
        }

        try {
            this.taskService.exportCSV();
        } catch (error) {
            console.error('Error exporting CSV:', error);
            this.ui.showAlert(
                'API not available. This feature requires the API server.\n\n' +
                'To start the API:\n' +
                '  cd api\n' +
                '  npm install\n' +
                '  npm start'
            );
        }
    }

    /**
     * Preview CSV export (Dev 2's feature)
     */
    async previewCSV() {
        if (!this.featureFlags.isEnabled('export_csv')) {
            this.ui.showAlert(
                'Export CSV is disabled in this environment.\n\n' +
                'This feature is:\n' +
                '- ENABLED in Stage\n' +
                '- ENABLED in Production (shipped!)'
            );
            return;
        }

        try {
            const data = await this.taskService.previewCSV();
            this.ui.showCSVPreview(data.taskCount, data.preview);
        } catch (error) {
            console.error('Error previewing CSV:', error);
            this.ui.showAlert('Error previewing CSV');
        }
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        const app = new App();
        app.init();
    });
} else {
    const app = new App();
    app.init();
}
