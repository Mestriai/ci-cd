# Trunk-Based Development API

## Quick Start

```bash
# Install dependencies
npm install

# Start server (Stage environment)
npm start

# Start server (Production environment)
NODE_ENV=production npm start

# Development mode with auto-reload
npm run dev
```

Server runs on: **http://localhost:3005**

## Environment Variables

```bash
# Set environment (stage or production)
NODE_ENV=stage        # Loads config/features.stage.yml
NODE_ENV=production   # Loads config/features.prod.yml

# Set port (optional, defaults to 3005)
PORT=3005
```

## API Endpoints

### Core Endpoints (Always Available)

```
GET    /api/health              # Health check
GET    /api/feature-flags       # Get current feature configuration
POST   /api/feature-flags/reload # Reload feature flags from disk

GET    /api/tasks               # List all tasks
GET    /api/tasks/:id           # Get single task
POST   /api/tasks               # Create new task
PUT    /api/tasks/:id           # Update task
DELETE /api/tasks/:id           # Delete task
```

### Feature-Toggled Endpoints

**Advanced Search** (Dev 1's feature):
```
POST   /api/search              # Search with filters
GET    /api/search/facets       # Get filter options
```

**Export CSV** (Dev 2's feature):
```
GET    /api/export/csv          # Export all tasks
POST   /api/export/csv          # Export filtered tasks
GET    /api/export/preview      # Preview CSV output
```

## Testing Feature Flags

### Stage Environment (All Features ON)

```bash
# Start in stage mode
NODE_ENV=stage npm start

# Both features available:
curl http://localhost:3005/api/search -X POST -H "Content-Type: application/json" -d '{"query":"setup"}'
curl http://localhost:3005/api/export/csv
```

### Production Environment (Selective Features)

```bash
# Start in production mode
NODE_ENV=production npm start

# Only export_csv available:
curl http://localhost:3005/api/export/csv  # ✅ Works
curl http://localhost:3005/api/search      # ❌ 404 (disabled)
```

## Changing Feature Flags

### Method 1: Edit YAML File

```bash
# Edit the config file
vim ../config/features.prod.yml

# Change a feature
advanced_search:
  enabled: true  # Changed from false to true

# Reload without restart
curl -X POST http://localhost:3005/api/feature-flags/reload
```

### Method 2: Restart Server

```bash
# Edit config file
vim ../config/features.prod.yml

# Restart server
npm start
```

## Example Requests

### Create Task

```bash
curl -X POST http://localhost:3005/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test trunk-based workflow",
    "description": "Verify feature flags work",
    "priority": "high",
    "tags": ["test", "devops"]
  }'
```

### Advanced Search (if enabled)

```bash
curl -X POST http://localhost:3005/api/search \
  -H "Content-Type: application/json" \
  -d '{
    "query": "test",
    "status": "pending",
    "priority": "high",
    "tags": ["devops"]
  }'
```

### Export to CSV (if enabled)

```bash
# Download CSV file
curl http://localhost:3005/api/export/csv > tasks.csv

# With custom columns
curl "http://localhost:3005/api/export/csv?columns=id,title,status" > tasks.csv

# Preview without download
curl http://localhost:3005/api/export/preview
```

## Architecture

```
api/
├── server.js          # Express app with feature flag routing
├── featureFlags.js    # YAML-based feature flag service
├── routes/
│   ├── tasks.js       # Base CRUD (always on)
│   ├── advanced_search.js  # Dev 1's feature (toggled)
│   └── export_csv.js       # Dev 2's feature (toggled)
├── db.json            # Simple JSON database
└── package.json
```

## Feature Flag Strategy Pattern

The API uses **Strategy Pattern** to avoid if-else hell:

```javascript
// ❌ Bad: If-else hell
if (featureFlags.isEnabled('feature_a')) {
  if (featureFlags.isEnabled('feature_b')) {
    if (featureFlags.isEnabled('feature_c')) {
      // Triangle of doom
    }
  }
}

// ✅ Good: Strategy pattern
const searchRouter = featureFlags.getFeatureRouter('advanced_search');
if (searchRouter) {
  app.use('/api/search', searchRouter);
}
```

Routes are loaded dynamically based on feature flags, keeping code clean and maintainable.

## Troubleshooting

### Feature not loading

```bash
# Check current feature flags
curl http://localhost:3005/api/feature-flags

# Check server logs for errors
npm start  # Look for "Feature loaded" or "Feature skipped" messages
```

### YAML syntax error

```bash
# Validate YAML
npm install -g js-yaml
js-yaml ../config/features.stage.yml
```

### Port already in use

```bash
# Change port
PORT=3006 npm start
```

## Development Tips

1. **Use stage mode for development**: `NODE_ENV=stage npm run dev`
2. **Test both environments**: Switch between stage and production
3. **Hot reload configs**: Use `/api/feature-flags/reload` endpoint
4. **Check logs**: Server shows which features are loaded on startup
