# Distributed Feature Flags Architecture

## Overview

For distributed systems (Web + API + DB), you need a centralized feature flag system that all services can access.

## Architecture Options

### Option 1: Professional Feature Flag Service (Recommended)

Use a managed service like LaunchDarkly, Split.io, or self-hosted Unleash.

#### Architecture Diagram

```
┌────────────────────────────────────────────────────────┐
│         LaunchDarkly / Split.io / Unleash              │
│         (Centralized Feature Flag Service)             │
│                                                         │
│  Stage Environment:                                    │
│    feature_a: enabled=true, rollout=100%              │
│    feature_b: enabled=true, rollout=100%              │
│    feature_c: enabled=true, rollout=100%              │
│                                                         │
│  Production Environment:                               │
│    feature_a: enabled=true, rollout=100%              │
│    feature_b: enabled=true, rollout=50%  ← Gradual!   │
│    feature_c: enabled=false                           │
└────────────────────────────────────────────────────────┘
            ▲              ▲              ▲
            │              │              │
    ┌───────┴───────┐  ┌──┴──┐  ┌────────┴────────┐
    │               │  │     │  │                 │
┌───┴────┐    ┌────┴──┴┐  ┌─┴──┴─────┐  ┌────────┴──────┐
│  Web   │    │  API 1 │  │  API 2   │  │ Background    │
│(React) │    │(Node.js)│  │(Node.js) │  │ Jobs (Node)   │
└────────┘    └─────────┘  └──────────┘  └───────────────┘
                   │              │
                   ▼              ▼
            ┌──────────────────────────┐
            │     PostgreSQL DB        │
            │  (Schema Migrations)     │
            └──────────────────────────┘
```

#### Implementation Example

**1. Web Layer (React/Next.js)**

```javascript
// web/src/lib/featureFlags.ts
import { LDClient, initialize } from 'launchdarkly-js-client-sdk';

const ENVIRONMENTS = {
  stage: 'sdk-client-stage-key',
  production: 'sdk-client-prod-key'
};

export class FeatureFlagClient {
  private client: LDClient;

  async init(userId: string) {
    const env = window.location.hostname.includes('stage') ? 'stage' : 'production';

    this.client = initialize(ENVIRONMENTS[env], {
      key: userId,
      email: user.email,
      custom: {
        environment: env
      }
    });

    await this.client.waitUntilReady();
  }

  isEnabled(featureName: string): boolean {
    return this.client.variation(featureName, false);
  }

  // Gradual rollout check
  async checkFeatureWithRollout(featureName: string, userId: string): Promise<boolean> {
    // LaunchDarkly automatically handles percentage rollouts
    return this.client.variation(featureName, false);
  }
}

// Usage in React component
import { useFeatureFlag } from './hooks/useFeatureFlag';

function Dashboard() {
  const isFeatureAEnabled = useFeatureFlag('feature_a');
  const isFeatureBEnabled = useFeatureFlag('feature_b');

  return (
    <div>
      {isFeatureAEnabled && <NewUserDashboard />}
      {isFeatureBEnabled && <AdvancedAnalytics />}
      {!isFeatureAEnabled && <OldDashboard />}
    </div>
  );
}
```

**2. API Layer (Node.js/Express)**

```javascript
// api/src/lib/featureFlags.js
const LaunchDarkly = require('launchdarkly-node-server-sdk');

const ENVIRONMENTS = {
  stage: 'sdk-server-stage-key',
  production: 'sdk-server-prod-key'
};

class FeatureFlagService {
  constructor() {
    const env = process.env.NODE_ENV === 'production' ? 'production' : 'stage';
    this.client = LaunchDarkly.init(ENVIRONMENTS[env]);
  }

  async waitForInitialization() {
    await this.client.waitForInitialization();
  }

  async isEnabled(featureName, user) {
    const userContext = {
      key: user.id,
      email: user.email,
      custom: {
        role: user.role,
        company: user.companyId
      }
    };

    return await this.client.variation(featureName, userContext, false);
  }

  async close() {
    await this.client.close();
  }
}

module.exports = new FeatureFlagService();

// Usage in API endpoint
const featureFlags = require('./lib/featureFlags');

app.post('/api/v1/users', async (req, res) => {
  const user = req.user;

  // Check if feature_a is enabled for this user
  if (await featureFlags.isEnabled('feature_a', user)) {
    // Use new user creation logic
    const result = await createUserWithNewDashboard(req.body);
    res.json(result);
  } else {
    // Use old logic
    const result = await createUserOld(req.body);
    res.json(result);
  }
});

// Gradual rollout example
app.get('/api/v1/analytics', async (req, res) => {
  const user = req.user;

  // feature_b might be enabled for 50% of users
  if (await featureFlags.isEnabled('feature_b', user)) {
    // New analytics endpoint
    const data = await getAdvancedAnalytics(user.id);
    res.json(data);
  } else {
    // Old analytics endpoint
    const data = await getBasicAnalytics(user.id);
    res.json(data);
  }
});
```

**3. Database Layer (Migrations)**

```javascript
// db/migrations/20250108_feature_a_new_tables.js
const featureFlags = require('../lib/featureFlags');

exports.up = async function(knex) {
  // Only run migration if feature_a is enabled in this environment
  const adminUser = { key: 'system', email: 'system@mestri.ai' };
  const isEnabled = await featureFlags.isEnabled('feature_a', adminUser);

  if (!isEnabled) {
    console.log('Skipping migration: feature_a is disabled');
    return;
  }

  await knex.schema.createTable('user_dashboard_widgets', function(table) {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.string('widget_type').notNullable();
    table.jsonb('config');
    table.timestamps(true, true);
  });

  await knex.schema.createTable('user_dashboard_layouts', function(table) {
    table.increments('id').primary();
    table.integer('user_id').notNullable();
    table.jsonb('layout');
    table.timestamps(true, true);
  });
};

exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('user_dashboard_layouts');
  await knex.schema.dropTableIfExists('user_dashboard_widgets');
};
```

**4. Background Jobs**

```javascript
// workers/emailWorker.js
const featureFlags = require('../lib/featureFlags');

async function sendUserEmail(userId) {
  const user = await getUserById(userId);

  // Check if new email template is enabled
  if (await featureFlags.isEnabled('feature_a', user)) {
    await sendEmailWithNewTemplate(user);
  } else {
    await sendEmailWithOldTemplate(user);
  }
}
```

### Option 2: Custom Feature Flag API

Build your own centralized API using your current JSON configs.

#### Architecture Diagram

```
┌────────────────────────────────────────────────┐
│    Feature Flag API (Your Node.js Service)    │
│    GET /api/feature-flags?env={env}            │
│                                                 │
│    ┌──────────────┐    ┌──────────────┐       │
│    │ Stage Config │    │  Prod Config │       │
│    │features.stage│    │features.prod │       │
│    └──────────────┘    └──────────────┘       │
└────────────────────────────────────────────────┘
            ▲              ▲              ▲
            │              │              │
    ┌───────┴───────┐  ┌──┴──┐  ┌────────┴────────┐
    │               │  │     │  │                 │
┌───┴────┐    ┌────┴──┴┐  ┌─┴──┴─────┐  ┌────────┴──────┐
│  Web   │    │  API 1 │  │  API 2   │  │ Background    │
│        │    │        │  │          │  │ Jobs          │
└────────┘    └─────────┘  └──────────┘  └───────────────┘
```

#### Implementation

**1. Feature Flag API Service**

```javascript
// feature-flag-api/server.js
const express = require('express');
const fs = require('fs').promises;
const app = express();

// In-memory cache
let configCache = {
  stage: null,
  production: null,
  lastUpdated: null
};

// Load configs on startup
async function loadConfigs() {
  configCache.stage = JSON.parse(
    await fs.readFile('./config/features.stage.json', 'utf8')
  );
  configCache.production = JSON.parse(
    await fs.readFile('./config/features.production.json', 'utf8')
  );
  configCache.lastUpdated = Date.now();
}

// Reload configs every 30 seconds
setInterval(loadConfigs, 30000);

// API endpoint
app.get('/api/feature-flags', async (req, res) => {
  const env = req.query.env || 'production';

  if (!['stage', 'production'].includes(env)) {
    return res.status(400).json({ error: 'Invalid environment' });
  }

  res.json(configCache[env]);
});

// Admin endpoint to update flags
app.post('/api/feature-flags/:env/:feature', express.json(), async (req, res) => {
  const { env, feature } = req.params;
  const { enabled } = req.body;

  const config = configCache[env];
  if (!config.features[feature]) {
    return res.status(404).json({ error: 'Feature not found' });
  }

  config.features[feature].enabled = enabled;

  // Save to file
  await fs.writeFile(
    `./config/features.${env}.json`,
    JSON.stringify(config, null, 2)
  );

  // Reload cache
  await loadConfigs();

  res.json({ success: true, feature, enabled });
});

app.listen(3001, async () => {
  await loadConfigs();
  console.log('Feature Flag API running on port 3001');
});
```

**2. Shared Client Library**

```javascript
// shared/featureFlagClient.js
class FeatureFlagClient {
  constructor(apiUrl, environment) {
    this.apiUrl = apiUrl;
    this.environment = environment;
    this.cache = null;
    this.lastFetch = 0;
    this.cacheTTL = 60000; // 1 minute
  }

  async fetchFlags() {
    if (this.cache && (Date.now() - this.lastFetch < this.cacheTTL)) {
      return this.cache;
    }

    const response = await fetch(
      `${this.apiUrl}/api/feature-flags?env=${this.environment}`
    );
    this.cache = await response.json();
    this.lastFetch = Date.now();
    return this.cache;
  }

  async isEnabled(featureName) {
    const config = await this.fetchFlags();
    return config.features[featureName]?.enabled || false;
  }
}

module.exports = FeatureFlagClient;
```

**3. Use in All Services**

```javascript
// web/api/db all use the same client
const FeatureFlagClient = require('@yourcompany/feature-flag-client');

const featureFlags = new FeatureFlagClient(
  'https://feature-flags.yourcompany.com',
  process.env.ENVIRONMENT // 'stage' or 'production'
);

// Usage is the same everywhere
if (await featureFlags.isEnabled('feature_a')) {
  // New logic
}
```

## Deployment Pipeline Integration

Your CI/CD pipeline config deployment:

```yaml
# .github/workflows/deploy-feature-flags.yml
name: Deploy Feature Flags

on:
  push:
    paths:
      - 'config/features.*.json'
    branches:
      - main

jobs:
  deploy-configs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Deploy to Feature Flag API
        run: |
          # Upload configs to your feature flag service
          curl -X POST https://feature-flags.yourcompany.com/api/sync \
            -H "Authorization: Bearer ${{ secrets.FF_API_TOKEN }}" \
            -F "stage=@config/features.stage.json" \
            -F "production=@config/features.production.json"
```

## Best Practices

1. **Cache feature flags** - Don't fetch on every request
2. **Fail open** - If service is down, default to safe behavior
3. **Monitor usage** - Track which features are being used
4. **Gradual rollouts** - Start with 1% → 10% → 50% → 100%
5. **User targeting** - Enable for specific users/companies first
6. **Clean up old flags** - Remove flags after features are stable

## Comparison

| Feature | File-Based (Current) | Custom API | LaunchDarkly/Split.io |
|---------|---------------------|------------|----------------------|
| Cost | Free | Low (hosting) | $$$ |
| Real-time updates | No (requires deploy) | Yes | Yes |
| Gradual rollouts | No | Manual | Automatic |
| User targeting | No | Custom code | Built-in |
| A/B testing | No | Custom code | Built-in |
| Analytics | No | Custom | Built-in |
| Multi-service | Manual sync | Yes | Yes |
| Setup complexity | Low | Medium | Low |

## Recommendation

- **Start with**: File-based (your current setup) for small projects
- **Scale to**: Custom API when you have multiple services
- **Production**: Use LaunchDarkly/Split.io/Unleash for enterprise
