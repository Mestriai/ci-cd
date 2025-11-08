/**
 * UI Manager
 * Handles all DOM manipulation and UI updates
 */

export class UIManager {
    constructor() {
        this.elements = this.initializeElements();
    }

    /**
     * Initialize and cache DOM elements
     */
    initializeElements() {
        return {
            envBadge: document.getElementById('env-badge'),
            searchSection: document.getElementById('search-section'),
            searchLabel: document.getElementById('search-label'),
            exportSection: document.getElementById('export-section'),
            exportLabel: document.getElementById('export-label'),
            featureInfo: document.getElementById('feature-info'),
            taskList: document.getElementById('task-list'),
            taskTitle: document.getElementById('task-title'),
            taskPriority: document.getElementById('task-priority'),
            searchQuery: document.getElementById('search-query'),
            searchStatus: document.getElementById('search-status'),
            searchPriority: document.getElementById('search-priority'),
            searchResults: document.getElementById('search-results'),
            exportPreview: document.getElementById('export-preview')
        };
    }

    /**
     * Update environment badge
     */
    updateEnvironmentBadge(environment) {
        const env = environment || 'production';
        this.elements.envBadge.textContent = env.toUpperCase();
        this.elements.envBadge.className = 'env-badge env-' + env;
    }

    /**
     * Update feature section visibility
     */
    updateFeatureSection(featureName, sectionPrefix, feature) {
        const section = this.elements[`${sectionPrefix}Section`];
        const label = this.elements[`${sectionPrefix}Label`];

        if (feature && feature.enabled) {
            section.classList.add('feature-enabled');
            section.classList.remove('feature-disabled');
            label.textContent = 'ENABLED';
            label.className = 'feature-label enabled';
        } else {
            section.classList.add('feature-disabled');
            section.classList.remove('feature-enabled');
            label.textContent = 'DISABLED';
            label.className = 'feature-label disabled';
        }
    }

    /**
     * Update feature info panel
     */
    updateFeatureInfo(environment, features) {
        let html = `<li><strong>Environment:</strong> ${environment}</li>`;
        html += `<li><strong>Total Features:</strong> ${Object.keys(features).length}</li>`;

        const enabled = Object.keys(features).filter(k => features[k].enabled);
        html += `<li><strong>Enabled Features:</strong> ${enabled.length}</li>`;

        if (enabled.length > 0) {
            html += `<li><strong>Active:</strong> ${enabled.join(', ')}</li>`;
        }

        this.elements.featureInfo.innerHTML = html;
    }

    /**
     * Show error in feature info panel
     */
    showFeatureFlagError() {
        this.elements.featureInfo.innerHTML =
            `<li class="error">Error: Could not load feature flags. Using default configuration.</li>`;
    }

    /**
     * Render tasks list
     */
    renderTasks(tasks, isDemo = false) {
        if (tasks.length === 0) {
            this.elements.taskList.innerHTML =
                '<li style="padding: 20px; text-align: center; color: #666;">No tasks yet. Add one above!</li>';
            return;
        }

        this.elements.taskList.innerHTML = tasks.map(task => `
            <li class="task-item ${task.status === 'completed' ? 'completed' : ''}">
                <h4>${task.title}</h4>
                <p>${task.description || 'No description'}</p>
                <div class="task-meta">
                    <span>Priority: <strong>${task.priority}</strong></span>
                    <span>Status: <strong>${task.status}</strong></span>
                    ${task.tags && task.tags.length > 0 ?
                        task.tags.map(tag => `<span class="tag">${tag}</span>`).join('') :
                        ''
                    }
                </div>
            </li>
        `).join('');

        if (isDemo) {
            this.elements.taskList.insertAdjacentHTML('afterbegin',
                '<div style="background: #fff3cd; color: #856404; padding: 10px; border-radius: 6px; margin-bottom: 15px;"><strong>Demo Mode:</strong> API not running. Showing sample data. Start API server for full functionality.</div>');
        }
    }

    /**
     * Show search results
     */
    showSearchResults(count) {
        this.elements.searchResults.innerHTML = `
            <div style="margin-top: 15px; padding: 15px; background: white; border-radius: 6px;">
                <strong>Search Results: ${count} tasks found</strong>
            </div>
        `;
    }

    /**
     * Show CSV preview
     */
    showCSVPreview(taskCount, preview) {
        this.elements.exportPreview.innerHTML = `
            <div style="background: white; padding: 15px; border-radius: 6px; margin-top: 15px;">
                <strong>CSV Preview (${taskCount} tasks):</strong>
                <pre style="margin-top: 10px; font-size: 12px; overflow-x: auto;">${preview}</pre>
            </div>
        `;
    }

    /**
     * Get task form values
     */
    getTaskFormValues() {
        return {
            title: this.elements.taskTitle.value,
            priority: this.elements.taskPriority.value
        };
    }

    /**
     * Clear task form
     */
    clearTaskForm() {
        this.elements.taskTitle.value = '';
    }

    /**
     * Get search form values
     */
    getSearchFormValues() {
        return {
            query: this.elements.searchQuery.value,
            status: this.elements.searchStatus.value,
            priority: this.elements.searchPriority.value
        };
    }

    /**
     * Show alert
     */
    showAlert(message) {
        alert(message);
    }
}
