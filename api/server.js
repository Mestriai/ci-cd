/**
 * Trunk-Based Development Demo API
 * Port: 3005
 *
 * Demonstrates:
 * - Clean feature flag implementation
 * - Strategy pattern (no if-else hell)
 * - Trunk-based workflow support
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const FeatureFlagService = require('./featureFlags');

const app = express();
const PORT = process.env.PORT || 3005;
const NODE_ENV = process.env.NODE_ENV || 'stage';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Feature Flag Service
const featureFlags = new FeatureFlagService(NODE_ENV);

console.log(`
╔════════════════════════════════════════════════════════╗
║   Trunk-Based Development Demo API                     ║
║   Environment: ${NODE_ENV.toUpperCase().padEnd(40)}║
║   Port: ${PORT.toString().padEnd(46)}║
╚════════════════════════════════════════════════════════╝
`);

// ============================================
// CORE ROUTES (Always Available)
// ============================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    environment: NODE_ENV,
    timestamp: new Date().toISOString()
  });
});

// Feature flags endpoint (for frontend)
app.get('/api/feature-flags', (req, res) => {
  res.json(featureFlags.getConfig());
});

// Reload feature flags (for development)
app.post('/api/feature-flags/reload', (req, res) => {
  featureFlags.reload();
  res.json({
    message: 'Feature flags reloaded',
    config: featureFlags.getConfig()
  });
});

// ============================================
// BASE FEATURE: Task CRUD (Always Available)
// ============================================

// Load base task routes
const tasksRouter = require('./routes/tasks');
app.use('/api/tasks', tasksRouter);

console.log('✅ Base feature loaded: Task CRUD');

// ============================================
// FEATURE-TOGGLED ROUTES (Strategy Pattern)
// ============================================

// Dev 1's Feature: Advanced Search
const searchRouter = featureFlags.getFeatureRouter('advanced_search');
if (searchRouter) {
  app.use('/api/search', searchRouter);
  console.log('✅ Feature loaded: Advanced Search (Dev 1)');
} else {
  console.log('⏭️  Feature skipped: Advanced Search (disabled)');
}

// Dev 2's Feature: Export CSV
const exportRouter = featureFlags.getFeatureRouter('export_csv');
if (exportRouter) {
  app.use('/api/export', exportRouter);
  console.log('✅ Feature loaded: Export CSV (Dev 2)');
} else {
  console.log('⏭️  Feature skipped: Export CSV (disabled)');
}

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`,
    hint: 'This feature might be disabled via feature flags'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message
  });
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║   🚀 API Server Running                                ║
║                                                         ║
║   URL: http://localhost:${PORT.toString().padEnd(32)}║
║                                                         ║
║   Endpoints:                                           ║
║   - GET  /api/health                                   ║
║   - GET  /api/feature-flags                            ║
║   - GET  /api/tasks                                    ║
║   - POST /api/tasks                                    ║
  `);

  const enabledFeatures = featureFlags.getEnabledFeatures();

  if (enabledFeatures.includes('advanced_search')) {
    console.log('║   - POST /api/search (Advanced Search) ✓           ║');
  }

  if (enabledFeatures.includes('export_csv')) {
    console.log('║   - GET  /api/export/csv (Export CSV) ✓            ║');
  }

  console.log(`║                                                         ║
╚════════════════════════════════════════════════════════╝

📝 Trunk-Based Development Demo
   - Multiple devs push to main daily
   - Features controlled by YAML flags
   - No merge hell, no blocking

🔧 To change features:
   1. Edit config/features.${NODE_ENV}.yml
   2. POST to /api/feature-flags/reload
   OR restart server

Press Ctrl+C to stop
`);
});

module.exports = app;
