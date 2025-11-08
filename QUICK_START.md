# Trunk-Based Development Demo - Quick Start

## Overview

This project demonstrates **trunk-based development with feature flags** - a DevOps best practice that allows multiple developers to push to the main branch daily without merge conflicts or blocking.

## Architecture

```
┌──────────────────────────────────────────────────┐
│                  GitHub Pages                     │
│                                                   │
│  /stage/         ← All features ON for testing   │
│  /production/    ← Selective features for users  │
└──────────────────────────────────────────────────┘
                          │
                          ▼
                  ┌──────────────┐
                  │   index.html │
                  │ Task Manager │
                  └──────────────┘
                          │
                          ▼ API calls (localhost)
                  ┌──────────────┐
                  │  API Server  │
                  │  Port: 3005  │
                  └──────────────┘
                          │
                          ▼
                  ┌──────────────┐
                  │   db.json    │
                  │  (Database)  │
                  └──────────────┘
```

## The Scenario

### Two Developers, One Main Branch

**Dev 1 (Slow)**: Building Advanced Search feature
- Development time: 14 days
- Pushes incomplete code to main daily
- Feature flag: `advanced_search` (OFF in production, ON in stage)

**Dev 2 (Fast)**: Building CSV Export feature
- Development time: 2 days
- Ships to production while Dev 1 still working
- Feature flag: `export_csv` (ON in both environments)

**Result**: No merge conflicts, no blocking, no cherry-picking needed!

## Quick Start

### 1. Start the API Server

```bash
cd api
npm install
npm start
```

This starts the API on [http://localhost:3005](http://localhost:3005)

**Test the API**:
```bash
# Check health
curl http://localhost:3005/api/health

# Get feature flags (stage environment)
curl http://localhost:3005/api/feature-flags

# Production environment
NODE_ENV=production npm start
```

### 2. Open the Web Application

Open `index.html` in your browser or serve it with a local server:

```bash
# Option 1: Simple Python server
python3 -m http.server 8001

# Option 2: Node.js server
npx http-server -p 8001

# Then visit: http://localhost:8001
```

### 3. See Feature Flags in Action

**Stage Environment** (all features enabled):
- Task Manager ✅ (base feature)
- Advanced Search ✅ (Dev 1's feature)
- Export CSV ✅ (Dev 2's feature)

**Production Environment** (selective features):
- Task Manager ✅ (base feature)
- Advanced Search ❌ (disabled - not ready)
- Export CSV ✅ (enabled - shipped!)

## File Structure

```
├── TRUNK_BASED_DEMO.md          # Detailed explanation
├── QUICK_START.md               # This file
├── DISTRIBUTED_FEATURE_FLAGS.md # Scaling to multi-service architecture
│
├── config/
│   ├── features.stage.yml       # Stage config (all features ON)
│   └── features.prod.yml        # Production config (selective)
│
├── api/
│   ├── server.js                # Express API with Strategy Pattern
│   ├── featureFlags.js          # YAML-based feature flag service
│   ├── db.json                  # Simple JSON database
│   ├── routes/
│   │   ├── tasks.js            # Base CRUD (always available)
│   │   ├── advanced_search.js  # Dev 1's feature (toggled)
│   │   └── export_csv.js       # Dev 2's feature (toggled)
│   └── package.json
│
├── index.html                   # Task Manager UI with feature toggles
├── js/
│   └── featureFlags.js         # Client-side feature flag manager
│
└── .github/workflows/
    └── deploy.yml              # CI/CD pipeline with YAML conversion
```

## Key Technologies

- **YAML Configuration**: Human-readable, version-controlled feature flags
- **Strategy Pattern**: Dynamic route loading (no if-else hell)
- **Express.js**: Lightweight Node.js API framework
- **GitHub Actions**: Automated deployment pipeline
- **GitHub Pages**: Free hosting for stage and production environments

## How It Works

### 1. YAML Configuration (Source of Truth)

**config/features.stage.yml**:
```yaml
environment: stage
features:
  advanced_search:
    enabled: true  # ON for testing
    developer: dev1
    status: in_development

  export_csv:
    enabled: true  # ON for testing
    developer: dev2
    status: completed
```

**config/features.prod.yml**:
```yaml
environment: production
features:
  advanced_search:
    enabled: false  # NOT READY
    status: in_development

  export_csv:
    enabled: true   # SHIPPED!
    status: live
```

### 2. API Strategy Pattern (No If-Else Hell)

**api/server.js**:
```javascript
// ❌ Bad: If-else hell
if (featureFlags.isEnabled('feature_a')) {
  if (featureFlags.isEnabled('feature_b')) {
    // Nested complexity
  }
}

// ✅ Good: Strategy pattern
const searchRouter = featureFlags.getFeatureRouter('advanced_search');
if (searchRouter) {
  app.use('/api/search', searchRouter);
}

const exportRouter = featureFlags.getFeatureRouter('export_csv');
if (exportRouter) {
  app.use('/api/export', exportRouter);
}
```

### 3. Client-Side Feature Flags

**index.html**:
```javascript
// Fetch feature flags from API
const response = await fetch('http://localhost:3005/api/feature-flags');
const flags = await response.json();

// Show/hide UI sections based on flags
if (flags.features.advanced_search?.enabled) {
  document.getElementById('search-section').classList.add('enabled');
} else {
  document.getElementById('search-section').classList.add('disabled');
}
```

### 4. Deployment Pipeline

**GitHub Actions workflow**:
1. Converts YAML → JSON for web client
2. Deploys to `/stage/` with all features ON
3. Deploys to `/production/` with selective features
4. Both URLs always work (no 404s)

## Testing Different Environments

### Test Stage (All Features)

```bash
# API
NODE_ENV=stage npm start

# Web - add to URL path: /stage/
# Example: https://mestriai.github.io/ci-cd/stage/
```

### Test Production (Selective Features)

```bash
# API
NODE_ENV=production npm start

# Web - add to URL path: /production/
# Example: https://mestriai.github.io/ci-cd/production/
```

## Common Tasks

### Add a New Feature

1. **Update YAML configs**:
```yaml
# config/features.stage.yml
new_feature:
  enabled: true
  developer: dev3
  status: in_development

# config/features.prod.yml
new_feature:
  enabled: false  # Not ready yet
```

2. **Create API route** (if needed):
```javascript
// api/routes/new_feature.js
const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'New feature!' });
});

module.exports = router;
```

3. **Load route in server.js**:
```javascript
const newFeatureRouter = featureFlags.getFeatureRouter('new_feature');
if (newFeatureRouter) {
  app.use('/api/new-feature', newFeatureRouter);
}
```

4. **Update UI** (index.html):
```html
<div data-feature="new_feature">
  <h2>New Feature</h2>
  <!-- Feature content -->
</div>
```

### Toggle a Feature

**Option 1: Edit YAML and reload** (no restart):
```bash
vim config/features.prod.yml
# Change enabled: false → enabled: true

# Reload via API
curl -X POST http://localhost:3005/api/feature-flags/reload
```

**Option 2: Edit and restart**:
```bash
vim config/features.prod.yml
npm start
```

### Ship to Production

1. **Test in stage**: Verify feature works with all features ON
2. **Update production config**: Set `enabled: true` in `features.prod.yml`
3. **Commit and push**: CI/CD pipeline deploys automatically
4. **Monitor**: Check production URL

## Benefits

✅ **No Merge Hell**: Everyone pushes to main daily
✅ **No Blocking**: Fast devs ship without waiting for slow devs
✅ **No Cherry-Picking**: Feature flags control what's live
✅ **Easy Rollback**: Toggle flag OFF if issues arise
✅ **Gradual Rollout**: Start with stage, then production
✅ **Clean Code**: Strategy pattern avoids if-else complexity

## Learn More

- **[TRUNK_BASED_DEMO.md](TRUNK_BASED_DEMO.md)**: Detailed day-by-day walkthrough
- **[DISTRIBUTED_FEATURE_FLAGS.md](DISTRIBUTED_FEATURE_FLAGS.md)**: Scaling to microservices
- **[api/README.md](api/README.md)**: API documentation

## Troubleshooting

### API not starting

```bash
cd api
npm install  # Install dependencies
node server.js  # Check for errors
```

### Feature flag not updating

```bash
# Reload flags without restart
curl -X POST http://localhost:3005/api/feature-flags/reload

# Or restart server
npm start
```

### 404 on deployed URLs

Check that deployment pipeline ran successfully:
- GitHub Actions → Workflow runs
- Both stage and production jobs should be green ✅

---

**Built with ❤️ following trunk-based development best practices**
