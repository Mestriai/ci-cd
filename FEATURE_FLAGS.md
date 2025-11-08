# Feature Flags System Documentation

## Overview

This project uses a feature flag system to control which features are enabled in different environments. This allows you to:

- Deploy all code to production while selectively enabling features
- Test features in staging before production release
- Enable/disable features without code changes
- Control feature rollout across environments

## Architecture

```
┌─────────────────────────────────────────────┐
│ All Developers Push to Main Branch         │
│ - Dev 1: feature_a (User Dashboard)        │
│ - Dev 2: feature_b (Analytics)             │
│ - Dev 3: feature_c (Notifications)         │
└─────────────────────────────────────────────┘
                    │
                    ↓
        ┌───────────────────────┐
        │  STAGE Environment    │
        │  URL: /stage/         │
        │  Config:              │
        │  features.stage.json  │
        │                       │
        │  ALL features ON      │
        │  ✓ feature_a         │
        │  ✓ feature_b         │
        │  ✓ feature_c         │
        └───────────────────────┘
                    │
        ┌───────────┴───────────┐
        │   Manual Approval     │
        └───────────────────────┘
                    │
                    ↓
        ┌───────────────────────┐
        │  PRODUCTION Env       │
        │  URL: /production/    │
        │  Config:              │
        │  features.prod.json   │
        │                       │
        │  SELECTIVE features   │
        │  ✓ feature_a         │
        │  ✓ feature_b         │
        │  ✗ feature_c         │
        └───────────────────────┘
```

## File Structure

```
mestri-test/
├── config/
│   ├── features.stage.json       # Stage environment config
│   ├── features.production.json  # Production environment config
│   └── features.json             # (Auto-generated during deployment)
├── js/
│   └── featureFlags.js           # Feature flag manager
├── demo-features.html            # Demo page showing feature flags
└── .github/
    └── workflows/
        └── deploy.yml            # Pipeline with environment configs
```

## Configuration Files

### Stage Config (`config/features.stage.json`)

```json
{
  "environment": "stage",
  "features": {
    "feature_a": {
      "enabled": true,
      "description": "Developer 1's feature - New user dashboard",
      "owner": "dev1"
    },
    "feature_b": {
      "enabled": true,
      "description": "Developer 2's feature - Advanced analytics",
      "owner": "dev2"
    },
    "feature_c": {
      "enabled": true,
      "description": "Developer 3's feature - Real-time notifications",
      "owner": "dev3"
    }
  }
}
```

### Production Config (`config/features.production.json`)

```json
{
  "environment": "production",
  "features": {
    "feature_a": {
      "enabled": true,
      "description": "Developer 1's feature - New user dashboard",
      "owner": "dev1"
    },
    "feature_b": {
      "enabled": true,
      "description": "Developer 2's feature - Advanced analytics",
      "owner": "dev2"
    },
    "feature_c": {
      "enabled": false,  // ← Disabled in production
      "description": "Developer 3's feature - Real-time notifications",
      "owner": "dev3"
    }
  }
}
```

## Usage

### 1. HTML/CSS - Hide/Show Elements

Add the `data-feature` attribute to any HTML element:

```html
<!-- This div only shows if feature_a is enabled -->
<div data-feature="feature_a">
  <h2>New User Dashboard</h2>
  <p>This is the new dashboard feature!</p>
</div>

<!-- This button only shows if feature_c is enabled -->
<button data-feature="feature_c">
  Enable Notifications
</button>
```

The feature flag system will automatically hide elements with `data-feature` attributes for disabled features.

### 2. JavaScript - Conditional Logic

```javascript
// Check if a feature is enabled
if (featureFlags.isEnabled('feature_a')) {
  initializeUserDashboard();
}

// Execute callback if feature is enabled
featureFlags.whenEnabled('feature_b', () => {
  loadAdvancedAnalytics();
});

// Get all enabled features
const enabledFeatures = featureFlags.getEnabledFeatures();
console.log('Active features:', enabledFeatures);

// Get feature metadata
const info = featureFlags.getFeatureInfo('feature_a');
console.log(`${info.description} by ${info.owner}`);
```

### 3. Including the Feature Flag System

Add this to your HTML pages:

```html
<!DOCTYPE html>
<html>
<head>
  <title>My App</title>
</head>
<body>
  <!-- Your content -->

  <!-- Feature A: Only shows in environments where it's enabled -->
  <div data-feature="feature_a">
    <h2>New Dashboard</h2>
  </div>

  <!-- Load feature flag manager -->
  <script src="js/featureFlags.js"></script>

  <!-- Your app code -->
  <script>
    // Feature flags are automatically initialized
    // Use them after DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
      if (featureFlags.isEnabled('feature_b')) {
        console.log('Analytics enabled!');
      }
    });
  </script>
</body>
</html>
```

## Deployment Pipeline

The pipeline automatically handles environment-specific configs:

1. **Build Job**: Creates site structure for both environments
2. **Deploy Stage**:
   - Copies `features.stage.json` → `stage/config/features.json`
   - All features typically enabled for testing
3. **Deploy Production** (Manual Approval):
   - Copies `features.production.json` → `production/config/features.json`
   - Only approved features enabled

## Workflow for Developers

### Scenario: 3 Developers, Select 2 Features for Production

1. **All developers work on main branch**:
   ```bash
   # Dev 1
   git checkout main
   git pull
   # Make changes for feature_a
   git commit -m "Add user dashboard feature"
   git push

   # Dev 2
   git checkout main
   git pull
   # Make changes for feature_b
   git commit -m "Add analytics feature"
   git push

   # Dev 3
   git checkout main
   git pull
   # Make changes for feature_c
   git commit -m "Add notifications feature"
   git push
   ```

2. **Pipeline automatically deploys to Stage**:
   - All features are visible in `/stage/`
   - Test all features: A, B, and C

3. **Team decides to release only A and B**:
   - Edit `config/features.production.json`:
     ```json
     {
       "features": {
         "feature_a": { "enabled": true },
         "feature_b": { "enabled": true },
         "feature_c": { "enabled": false }  // ← Not ready yet
       }
     }
     ```
   - Commit and push the config change

4. **Approve production deployment**:
   - Go to GitHub Actions
   - Approve the "Production" environment
   - Production now shows only features A and B

5. **Later, when feature C is ready**:
   - Edit `config/features.production.json`:
     ```json
     "feature_c": { "enabled": true }
     ```
   - Deploy to production
   - No code changes needed!

## API Reference

### FeatureFlagManager

#### `isEnabled(featureName)`
Check if a feature is enabled.
```javascript
if (featureFlags.isEnabled('feature_a')) {
  // Feature is enabled
}
```

#### `getEnabledFeatures()`
Get array of all enabled feature names.
```javascript
const enabled = featureFlags.getEnabledFeatures();
// ['feature_a', 'feature_b']
```

#### `getFeatureInfo(featureName)`
Get metadata for a feature.
```javascript
const info = featureFlags.getFeatureInfo('feature_a');
// { enabled: true, description: "...", owner: "dev1" }
```

#### `getEnvironment()`
Get current environment name.
```javascript
const env = featureFlags.getEnvironment();
// 'stage' or 'production'
```

#### `whenEnabled(featureName, callback)`
Execute callback if feature is enabled.
```javascript
featureFlags.whenEnabled('feature_a', () => {
  console.log('Feature A is active!');
});
```

#### `applyFeatureFlags()`
Manually apply feature flags to DOM elements with `data-feature` attributes.
```javascript
featureFlags.applyFeatureFlags();
```

## Demo

Visit [demo-features.html](demo-features.html) to see the feature flag system in action:

- **Stage**: `/stage/demo-features.html` - All features enabled
- **Production**: `/production/demo-features.html` - Selective features enabled

## Best Practices

1. **Always enable new features in stage first** for testing
2. **Use descriptive feature names** (e.g., `user_dashboard` not `feature1`)
3. **Add metadata** (description, owner) to track feature ownership
4. **Clean up old flags** after features are permanently enabled
5. **Document feature dependencies** in the config files
6. **Use feature flags for gradual rollouts**, not permanent conditions

## Troubleshooting

### Feature not hiding in production
- Check that `config/features.production.json` has `"enabled": false`
- Verify the pipeline copied the config correctly
- Check browser console for feature flag loading errors

### Feature flags not loading
- Ensure `js/featureFlags.js` is loaded before your app code
- Check browser console for 404 errors on config file
- Verify the config file path is correct for your environment

### Environment detection not working
- Check URL contains `/stage/` or `/production/`
- Manually specify environment: `featureFlags.init('stage')`

## Advanced: Dynamic Feature Flags

For more advanced use cases, you can integrate with external feature flag services:

- LaunchDarkly
- Split.io
- ConfigCat
- Unleash

This simple file-based system is great for getting started and works well for most use cases.
