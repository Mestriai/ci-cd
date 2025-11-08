/**
 * Feature Flag Manager
 * Handles loading and checking feature flags
 */

import { CONFIG } from './config.js';

export class FeatureFlagManager {
    constructor() {
        this.flags = { features: {} };
        this.loaded = false;
    }

    /**
     * Load feature flags from local JSON file (converted from YAML during deployment)
     * This allows the frontend to work on GitHub Pages without a backend
     */
    async load() {
        try {
            const response = await fetch(CONFIG.FEATURE_FLAGS_PATH);
            this.flags = await response.json();
            this.loaded = true;
            console.log('Feature flags loaded from config/features.json:', this.flags);
            return this.flags;
        } catch (error) {
            console.error('Error loading feature flags:', error);
            // Fallback to default production config
            this.flags = {
                environment: 'production',
                features: {
                    advanced_search: { enabled: false },
                    export_csv: { enabled: false }
                }
            };
            throw error;
        }
    }

    /**
     * Check if a feature is enabled
     */
    isEnabled(featureName) {
        return this.flags.features?.[featureName]?.enabled || false;
    }

    /**
     * Get feature metadata
     */
    getFeature(featureName) {
        return this.flags.features?.[featureName] || null;
    }

    /**
     * Get all enabled features
     */
    getEnabledFeatures() {
        if (!this.flags.features) return [];
        return Object.keys(this.flags.features)
            .filter(key => this.flags.features[key].enabled === true);
    }

    /**
     * Get current environment
     */
    getEnvironment() {
        return this.flags.environment || 'production';
    }

    /**
     * Get all features
     */
    getAllFeatures() {
        return this.flags.features || {};
    }
}
