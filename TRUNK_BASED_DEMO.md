# Trunk-Based Development with Feature Flags - Complete Demo

## 🎯 Overview

This project demonstrates **trunk-based development** with **feature flags** following DevOps best practices. It shows how multiple developers with different velocities can work on the same `main` branch without:
- ❌ Merge hell
- ❌ Blocking each other
- ❌ Cherry-picking commits
- ❌ Stale branches
- ❌ Breaking production

## 🏗️ Architecture

```
┌─────────────────────────────────────────┐
│         3-Tier Application              │
├─────────────────────────────────────────┤
│  Web (Frontend)                         │
│  - Task Manager UI                      │
│  - Feature-toggled components           │
├─────────────────────────────────────────┤
│  API (Backend) - Port 3005              │
│  - Express.js                           │
│  - YAML-based feature flags             │
│  - Strategy pattern (no if-else hell)   │
├─────────────────────────────────────────┤
│  DB (Data Layer)                        │
│  - JSON file database                   │
│  - Simple CRUD operations               │
└─────────────────────────────────────────┘
```

## 📋 Demo Scenario

### The Setup
**Two developers working on the same codebase:**

**Developer 1 (Slow):**
- Feature: Advanced Search
- Time: 14 days
- Approach: Pushes incomplete code to `main` daily
- Toggle: `advanced_search`

**Developer 2 (Fast):**
- Feature: Export to CSV
- Time: 2 days
- Approach: Completes quickly, ships to production
- Toggle: `export_csv`

### The Traditional Problem (Without Trunk-Based Dev)

```
Day 1-2: Dev2 finishes CSV export
         ❌ Can't merge - Dev1's feature branch has conflicts
         ❌ Dev1 working on 12-day-old code

Day 14:  Dev1 finishes search
         ❌ Massive merge conflicts
         ❌ 2 weeks of merge hell
         ❌ Code is stale, bugs introduced
```

### The Trunk-Based Solution (With Feature Flags)

```
📅 Day 1: Both developers start
├─ Dev1: Pushes incomplete search.js to main ✅
├─ Dev2: Pushes incomplete export.js to main ✅
├─ Stage: Both features visible (enabled for testing)
└─ Production: Neither visible (both disabled)
   🎯 No merge conflicts!

📅 Day 2: Dev2 completes CSV export
├─ Dev1: Continues search, pushes to main ✅
├─ Dev2: Completes export.js, pushes to main ✅
├─ Stage: Both visible, export works!
└─ Production: Still neither visible
   🎯 Dev2 not blocked by Dev1!

📅 Day 3: Ship Dev2's feature to production
├─ Update features.prod.yml: export_csv: enabled=true
├─ Push config change to main
├─ Stage: Both features visible
└─ Production: Only export visible ✅
   🎯 Selective deployment without cherry-picking!

📅 Days 4-13: Dev1 continues safely
├─ Dev1: Daily commits to main (improving search)
├─ Dev2: Working on next features
├─ Stage: Dev1's progress visible for testing
└─ Production: Only export visible, unaffected
   🎯 No blocking, no stale code!

📅 Day 14: Ship Dev1's feature
├─ Update features.prod.yml: advanced_search: enabled=true
├─ Stage: Both visible and working
└─ Production: Both features live! ✅
   🎯 Clean deployment, no merge hell!
```

## 🚀 How to Run

### 1. Start the API Server

```bash
cd api
npm install
npm start
```

Server runs on: `http://localhost:3005`

### 2. Open the Web App

**Stage Environment:**
```
https://mestriai.github.io/ci-cd/stage/
```

**Production Environment:**
```
https://mestriai.github.io/ci-cd/production/
```

**Local Development:**
```bash
# Serve locally
npx http-server -p 8080

# Visit: http://localhost:8080/
```

## 📁 Project Structure

```
mestri-test/
├── api/
│   ├── server.js              # Express API (port 3005)
│   ├── featureFlags.js        # YAML-based feature flag manager
│   ├── routes/
│   │   ├── tasks.js           # Base CRUD (always enabled)
│   │   ├── search.js          # Dev1's feature (toggled)
│   │   └── export.js          # Dev2's feature (toggled)
│   ├── db.json                # JSON database
│   └── package.json
│
├── config/
│   ├── features.stage.yml     # Stage: All features ON
│   └── features.prod.yml      # Prod: Selective features
│
├── index.html                 # Task Manager UI
├── js/
│   └── featureFlags.js        # Client-side feature flags
│
└── TRUNK_BASED_DEMO.md        # This file
```

## 🎨 Feature Flag Configuration (YAML)

### Stage Configuration (`config/features.stage.yml`)

```yaml
environment: stage
last_updated: "2025-01-08"

features:
  advanced_search:
    enabled: true                    # ON for testing
    type: release_toggle
    lifecycle: dynamic
    developer: dev1
    status: in_development
    description: "Advanced task search with filters"
    jira_ticket: "TASK-101"

  export_csv:
    enabled: true                    # ON for testing
    type: release_toggle
    lifecycle: dynamic
    developer: dev2
    status: completed
    description: "Export tasks to CSV format"
    jira_ticket: "TASK-102"
```

### Production Configuration (`config/features.prod.yml`)

```yaml
environment: production
last_updated: "2025-01-08"

features:
  advanced_search:
    enabled: false                   # OFF - not ready
    type: release_toggle
    lifecycle: dynamic
    developer: dev1
    status: in_development
    description: "Advanced task search with filters"

  export_csv:
    enabled: true                    # ON - shipped!
    type: release_toggle
    lifecycle: dynamic
    developer: dev2
    status: live
    description: "Export tasks to CSV format"
```

## 💡 Key Implementation Principles

### 1. Avoiding If-Else Hell

**❌ Bad (Triangle of Doom):**
```javascript
if (featureFlags.isEnabled('advanced_search')) {
  if (featureFlags.isEnabled('export_csv')) {
    if (featureFlags.isEnabled('another_feature')) {
      // Nested hell
    }
  }
}
```

**✅ Good (Strategy Pattern):**
```javascript
// api/server.js
const featureFlags = new FeatureFlagService(process.env.NODE_ENV);

// Conditionally load routes
if (featureFlags.isEnabled('advanced_search')) {
  app.use('/api/search', require('./routes/search'));
}

if (featureFlags.isEnabled('export_csv')) {
  app.use('/api/export', require('./routes/export'));
}
```

### 2. YAML Configuration (Not Text Files)

Following the YouTube talk's guidance:
- ✅ Use YAML for hierarchy and structure
- ✅ Version control all configs
- ✅ Centralized configuration
- ❌ Don't use scattered text files or env vars

### 3. Meaningful Toggle Names

**❌ Bad:**
```yaml
feature_x: true
feature_y: false
toggle1: true
```

**✅ Good:**
```yaml
advanced_search: true
export_csv: false
real_time_notifications: true
```

### 4. Never Reuse Toggle Names

```yaml
# NEVER do this:
# 2024: used 'new_dashboard'
# 2025: reusing 'new_dashboard' for different feature ❌

# ALWAYS do this:
# 2024: 'dashboard_v1'
# 2025: 'dashboard_v2' ✅
```

### 5. Toggle Lifecycle Management

| Toggle Type | Lifespan | Dynamic? | Example |
|-------------|----------|----------|---------|
| Release Toggle | Short (days/weeks) | Static/Dynamic | `advanced_search` |
| Experiment Toggle | Short | Dynamic | `new_ui_test` |
| Ops Toggle | Long | Dynamic | `maintenance_mode` |
| Permission Toggle | Long | Dynamic | `admin_panel` |

**Remove toggles after features are stable!**

```yaml
# After 2 weeks in production with no issues:
# Remove the toggle, make it permanent code
```

## 🔄 CI/CD Pipeline Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml

# Stage deployment (automatic)
deploy-stage:
  - Copy config/features.stage.yml → stage/config/features.json

# Production deployment (manual approval)
deploy-production:
  - Copy config/features.prod.yml → production/config/features.json
```

### Deployment Flow

```
Push to main
     ↓
┌─────────────────────────┐
│  Stage Deployment       │
│  (Automatic)            │
│  - All features ON      │
│  - For testing          │
└─────────────────────────┘
     ↓
┌─────────────────────────┐
│  Manual Approval        │
│  - Review features      │
│  - Check stage tests    │
└─────────────────────────┘
     ↓
┌─────────────────────────┐
│  Production Deployment  │
│  (Approved)             │
│  - Selective features   │
│  - Toggle-controlled    │
└─────────────────────────┘
```

## 📊 Benefits Demonstrated

### 1. No Merge Hell
- ✅ Both devs push to `main` daily
- ✅ No long-lived feature branches
- ✅ Always working with latest code

### 2. No Developer Blocking
- ✅ Dev2 ships without waiting for Dev1
- ✅ Independent release cycles
- ✅ Parallel development

### 3. No Cherry-Picking
- ✅ All code in `main`
- ✅ Toggles control visibility
- ✅ Clean deployment history

### 4. Easy Rollback
- ✅ Toggle off in YAML
- ✅ No code changes needed
- ✅ Instant rollback

### 5. Safe Testing
- ✅ Stage has everything
- ✅ Production is selective
- ✅ Test in production-like environment

### 6. No Stale Branches
- ✅ Everything in `main`
- ✅ Always fresh
- ✅ No outdated code

## 🎓 Learning from Knight Capital (45 Minutes of Hell)

**What happened:**
- Knight Capital lost $440 million in 45 minutes
- Bad feature toggle implementation
- Toggle accidentally enabled old, buggy code

**Lessons learned (applied in this demo):**

1. **✅ Never reuse toggle names**
   - Each feature gets unique name
   - Never reactivate old toggles

2. **✅ Centralized config management**
   - All toggles in `config/` directory
   - Version controlled
   - Easy to audit

3. **✅ Clear toggle lifecycle**
   - Document when toggle was created
   - Remove when feature is stable
   - Track status in YAML

4. **✅ Testing toggle states**
   - Test both ON and OFF states
   - Verify in stage before production
   - Monitor toggle changes

## 🛠️ API Endpoints

### Base Endpoints (Always Available)

```
GET    /api/tasks           # List all tasks
POST   /api/tasks           # Create task
PUT    /api/tasks/:id       # Update task
DELETE /api/tasks/:id       # Delete task
GET    /api/feature-flags   # Get current flags
```

### Feature-Toggled Endpoints

```
POST   /api/search          # Advanced search (Dev1)
                             # Only if advanced_search=true

GET    /api/export/csv      # Export to CSV (Dev2)
                             # Only if export_csv=true
```

## 📖 Usage Examples

### Frontend Feature Detection

```javascript
// index.html
const featureFlags = await fetch('/api/feature-flags').then(r => r.json());

// Show/hide advanced search
if (featureFlags.features.advanced_search?.enabled) {
  document.getElementById('advanced-search').style.display = 'block';
}

// Show/hide export button
if (featureFlags.features.export_csv?.enabled) {
  document.getElementById('export-btn').style.display = 'block';
}
```

### Backend Feature Implementation

```javascript
// api/server.js
const featureFlags = new FeatureFlagService(process.env.NODE_ENV);

// Load routes conditionally
if (featureFlags.isEnabled('advanced_search')) {
  app.use('/api/search', require('./routes/search'));
}
```

## 🎯 Summary

This demo proves that:

1. **Multiple developers can work on main simultaneously** without conflicts
2. **Fast developers don't wait for slow developers**
3. **Production deployments are safe and selective**
4. **Rollbacks are instant** (just toggle off)
5. **Testing happens in production-like environments** (stage)
6. **Code stays fresh** (no stale branches)

All achieved through **trunk-based development** + **feature flags** following industry best practices.

## 🔗 References

- YouTube Talk: "Feature Toggles and Trunk-Based Development"
- Martin Fowler: Feature Toggles
- Knight Capital Case Study: 45 Minutes of Hell
- Trunk Based Development: https://trunkbaseddevelopment.com/

## 📝 Next Steps

1. **Run the demo locally**
2. **Experiment with toggling features**
3. **Read the API code** to see strategy pattern
4. **Try adding your own feature** with a toggle
5. **Practice trunk-based workflow**

---

**Remember:** Feature flags are powerful tools. Use them wisely, remove them when done, and never create a "triangle of doom" with nested if-else statements!
