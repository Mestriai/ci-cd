/**
 * Feature Flag Manager
 * Manages feature flags for different environments
 */

class FeatureFlagManager {
  constructor() {
    this.features = {};
    this.environment = 'production'; // default
    this.loaded = false;
  }

  /**
   * Initialize and load feature flags for the current environment
   * @param {string} environment - 'stage' or 'production'
   */
  async init(environment = null) {
    // Auto-detect environment from URL if not provided
    if (!environment) {
      const path = window.location.pathname;
      if (path.includes('/stage/')) {
        this.environment = 'stage';
      } else if (path.includes('/production/')) {
        this.environment = 'production';
      } else {
        this.environment = 'production'; // default
      }
    } else {
      this.environment = environment;
    }

    try {
      // Load the environment-specific config
      // Source: YAML files (features.stage.yml, features.prod.yml)
      // Converted to JSON during deployment pipeline for web client consumption
      const configPath = `config/features.json`;
      const response = await fetch(configPath);

      if (!response.ok) {
        console.warn(`Failed to load feature config for ${this.environment}, using defaults`);
        this.features = {};
        return;
      }

      const config = await response.json();
      this.features = config.features || {};
      this.loaded = true;

      console.log(`✓ Feature flags loaded for: ${this.environment}`);
      console.log(`✓ Active features:`, Object.keys(this.features).filter(k => this.features[k].enabled));
    } catch (error) {
      console.error('Error loading feature flags:', error);
      this.features = {};
    }
  }

  /**
   * Check if a feature is enabled
   * @param {string} featureName - Name of the feature to check
   * @returns {boolean} - True if enabled, false otherwise
   */
  isEnabled(featureName) {
    if (!this.features[featureName]) {
      console.warn(`Feature "${featureName}" not found in config`);
      return false;
    }
    return this.features[featureName].enabled === true;
  }

  /**
   * Get all enabled features
   * @returns {Array} - Array of enabled feature names
   */
  getEnabledFeatures() {
    return Object.keys(this.features).filter(key => this.features[key].enabled);
  }

  /**
   * Get feature metadata
   * @param {string} featureName - Name of the feature
   * @returns {Object} - Feature metadata
   */
  getFeatureInfo(featureName) {
    return this.features[featureName] || null;
  }

  /**
   * Get current environment
   * @returns {string} - Current environment name
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * Show/hide DOM elements based on feature flags
   * Usage: Add data-feature="feature_name" to HTML elements
   */
  applyFeatureFlags() {
    const elements = document.querySelectorAll('[data-feature]');

    elements.forEach(element => {
      const featureName = element.getAttribute('data-feature');
      const isEnabled = this.isEnabled(featureName);

      if (isEnabled) {
        element.style.display = ''; // Show element
        element.classList.add('feature-enabled');
      } else {
        element.style.display = 'none'; // Hide element
        element.classList.add('feature-disabled');
      }
    });

    console.log(`✓ Applied feature flags to ${elements.length} elements`);
  }

  /**
   * Execute callback if feature is enabled
   * @param {string} featureName - Name of the feature
   * @param {Function} callback - Function to execute if enabled
   */
  whenEnabled(featureName, callback) {
    if (this.isEnabled(featureName)) {
      callback();
    }
  }

  /**
   * Get all features with their status
   * @returns {Object} - All features and their status
   */
  getAllFeatures() {
    return this.features;
  }
}

// Create global instance
window.featureFlags = new FeatureFlagManager();

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', async () => {
    await window.featureFlags.init();
    window.featureFlags.applyFeatureFlags();
  });
} else {
  // DOM already loaded
  (async () => {
    await window.featureFlags.init();
    window.featureFlags.applyFeatureFlags();
  })();
}
