/**
 * Feature Flag Service
 * YAML-based feature flag manager following DevOps best practices
 *
 * Principles:
 * - Use YAML (not text files or scattered configs)
 * - Avoid if-else hell (use strategy pattern)
 * - Meaningful toggle names (never reuse)
 * - Clear lifecycle management
 * - Centralized configuration
 */

const yaml = require('js-yaml');
const fs = require('fs');
const path = require('path');

class FeatureFlagService {
  constructor(environment = 'production') {
    this.environment = environment;
    this.config = null;
    this.configPath = null;
    this.loadConfiguration();
  }

  /**
   * Load YAML configuration for current environment
   */
  loadConfiguration() {
    try {
      // Determine config file based on environment
      const configFileName = this.environment === 'stage'
        ? 'features.stage.yml'
        : 'features.prod.yml';

      this.configPath = path.join(__dirname, '..', 'config', configFileName);

      // Load and parse YAML
      const fileContents = fs.readFileSync(this.configPath, 'utf8');
      this.config = yaml.load(fileContents);

      console.log(`✅ Feature flags loaded for: ${this.environment}`);
      console.log(`✅ Config file: ${this.configPath}`);
      console.log(`✅ Features:`, Object.keys(this.config.features || {}));
    } catch (error) {
      console.error(`❌ Error loading feature flags:`, error.message);
      // Fail safe: empty config
      this.config = { features: {} };
    }
  }

  /**
   * Check if a feature is enabled
   * @param {string} featureName - Name of the feature to check
   * @returns {boolean} - True if enabled, false otherwise
   */
  isEnabled(featureName) {
    if (!this.config || !this.config.features) {
      console.warn(`⚠️  Feature config not loaded properly`);
      return false;
    }

    const feature = this.config.features[featureName];

    if (!feature) {
      console.warn(`⚠️  Feature "${featureName}" not found in config`);
      return false;
    }

    const enabled = feature.enabled === true;

    if (enabled) {
      console.log(`✓ Feature "${featureName}" is ENABLED`);
    } else {
      console.log(`✗ Feature "${featureName}" is DISABLED`);
    }

    return enabled;
  }

  /**
   * Get feature metadata
   * @param {string} featureName - Name of the feature
   * @returns {Object|null} - Feature metadata or null
   */
  getFeatureInfo(featureName) {
    if (!this.config || !this.config.features) {
      return null;
    }
    return this.config.features[featureName] || null;
  }

  /**
   * Get all features
   * @returns {Object} - All features with their configuration
   */
  getAllFeatures() {
    if (!this.config || !this.config.features) {
      return {};
    }
    return this.config.features;
  }

  /**
   * Get list of enabled features
   * @returns {Array} - Array of enabled feature names
   */
  getEnabledFeatures() {
    if (!this.config || !this.config.features) {
      return [];
    }

    return Object.keys(this.config.features)
      .filter(key => this.config.features[key].enabled === true);
  }

  /**
   * Get current environment
   * @returns {string} - Current environment name
   */
  getEnvironment() {
    return this.environment;
  }

  /**
   * Get full configuration (for API endpoint)
   * @returns {Object} - Full configuration object
   */
  getConfig() {
    return this.config || { features: {} };
  }

  /**
   * Reload configuration from disk
   * Useful for hot-reloading without server restart
   */
  reload() {
    console.log(`🔄 Reloading feature flags...`);
    this.loadConfiguration();
  }

  /**
   * Get feature route handler dynamically (Strategy Pattern)
   * Avoids if-else hell by loading routes conditionally
   *
   * @param {string} featureName - Name of the feature
   * @returns {Function|null} - Route handler or null if disabled
   */
  getFeatureRouter(featureName) {
    if (!this.isEnabled(featureName)) {
      console.log(`🚫 Route for "${featureName}" not loaded (feature disabled)`);
      return null;
    }

    try {
      // Dynamically require the route module
      const routePath = path.join(__dirname, 'routes', `${featureName}.js`);

      if (!fs.existsSync(routePath)) {
        console.warn(`⚠️  Route file not found: ${routePath}`);
        return null;
      }

      console.log(`✅ Loading route for enabled feature: "${featureName}"`);
      return require(routePath);
    } catch (error) {
      console.error(`❌ Error loading route for "${featureName}":`, error.message);
      return null;
    }
  }
}

module.exports = FeatureFlagService;
