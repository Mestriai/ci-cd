# Trunk-Based Development with Feature Flags Demo

[![Deploy to Pages](https://github.com/mestriai/ci-cd/actions/workflows/deploy.yml/badge.svg)](https://github.com/mestriai/ci-cd/actions/workflows/deploy.yml)

A complete demonstration of trunk-based development using YAML-based feature flags, showcasing how multiple developers can push to main daily without merge conflicts or blocking.

## 🎯 What This Demonstrates

**The Problem**: Multiple developers working on the same codebase leads to:
- Merge hell
- Blocking (fast devs waiting for slow devs)
- Stale feature branches
- Complex cherry-picking

**The Solution**: Trunk-based development with feature flags:
- Everyone pushes to `main` daily
- Features controlled by YAML configuration
- Fast developers ship to production while others continue working
- No merge conflicts, no blocking, no cherry-picking

## 🚀 Quick Start

### 1. Start the API Server

```bash
cd api
npm install
npm start
```

Server runs at: **http://localhost:3005**

### 2. Open the Web App

**Option A: Simple (single environment)**
```bash
python3 -m http.server 8001
# Then visit: http://localhost:8001
```

**Option B: Full local setup (stage + production)**
```bash
./local-dev.sh  # Build local environments
cd _local && python3 -m http.server 8001

# Then visit:
# - http://localhost:8001/           (environment selector)
# - http://localhost:8001/stage/     (all features enabled)
# - http://localhost:8001/production/ (selective features)
```

### 3. See Feature Flags in Action

**Stage** - All features enabled for testing
**Production** - Selective features for users

## 📁 Project Structure

```
.
├── config/
│   ├── features.stage.yml      # Stage config (all features ON)
│   └── features.prod.yml       # Production config (selective)
│
├── api/                        # Node.js API (port 3005)
│   ├── server.js              # Express server
│   ├── featureFlags.js        # YAML feature flag service
│   └── routes/                # Feature routes
│
├── index.html                  # Task Manager UI
└── .github/workflows/
    └── deploy.yml             # CI/CD pipeline
```

## 📚 Full Documentation

- **[QUICK_START.md](QUICK_START.md)** - Quick reference guide
- **[TRUNK_BASED_DEMO.md](TRUNK_BASED_DEMO.md)** - Detailed walkthrough
- **[DISTRIBUTED_FEATURE_FLAGS.md](DISTRIBUTED_FEATURE_FLAGS.md)** - Scaling guide
- **[api/README.md](api/README.md)** - API documentation

## 🌐 Deployed URLs

- **Stage**: https://mestriai.github.io/ci-cd/stage/
- **Production**: https://mestriai.github.io/ci-cd/production/

---

**Built with ❤️ following trunk-based development best practices**