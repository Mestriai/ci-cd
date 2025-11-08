#!/bin/bash

# Local Development Environment Setup
# This script simulates stage and production environments locally

set -e

echo "🚀 Setting up local development environments..."

# Create temporary build directory
rm -rf _local
mkdir -p _local/stage _local/production

# Copy files to stage (exclude api, node_modules, build artifacts)
echo "📦 Building STAGE environment..."
rsync -a --exclude='_local' --exclude='_site' --exclude='api' --exclude='node_modules' --exclude='.git' --exclude='*.sh' ./ _local/stage/

# Copy files to production
echo "📦 Building PRODUCTION environment..."
rsync -a --exclude='_local' --exclude='_site' --exclude='api' --exclude='node_modules' --exclude='.git' --exclude='*.sh' ./ _local/production/

# Convert YAML to JSON for stage
echo "🔧 Converting YAML configs to JSON..."
mkdir -p _local/stage/config
npx js-yaml config/features.stage.yml > _local/stage/config/features.json

# Convert YAML to JSON for production
mkdir -p _local/production/config
npx js-yaml config/features.prod.yml > _local/production/config/features.json

# Create landing page
cat > _local/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Local Development - Environment Selector</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }
        .container {
            background: white;
            padding: 50px;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0,0,0,0.3);
            max-width: 600px;
            text-align: center;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 40px;
        }
        .env-buttons {
            display: grid;
            gap: 20px;
            margin-bottom: 30px;
        }
        .env-button {
            display: block;
            padding: 20px 40px;
            text-decoration: none;
            border-radius: 12px;
            font-weight: bold;
            font-size: 18px;
            transition: transform 0.2s, box-shadow 0.2s;
        }
        .env-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        }
        .stage {
            background: #f6a623;
            color: white;
        }
        .production {
            background: #28a745;
            color: white;
        }
        .info {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 12px;
            margin-top: 30px;
            text-align: left;
        }
        .info h3 {
            color: #333;
            margin-bottom: 10px;
        }
        .info ul {
            color: #666;
            line-height: 1.8;
        }
        .badge {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            margin-left: 10px;
        }
        .badge-on {
            background: #28a745;
            color: white;
        }
        .badge-off {
            background: #dc3545;
            color: white;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 Local Development</h1>
        <p class="subtitle">Choose your environment</p>

        <div class="env-buttons">
            <a href="stage/" class="env-button stage">
                STAGE Environment
            </a>
            <a href="production/" class="env-button production">
                PRODUCTION Environment
            </a>
        </div>

        <div class="info">
            <h3>Environment Configuration</h3>
            <ul>
                <li><strong>Stage:</strong>
                    <span class="badge badge-on">Advanced Search ON</span>
                    <span class="badge badge-on">CSV Export ON</span>
                </li>
                <li><strong>Production:</strong>
                    <span class="badge badge-off">Advanced Search OFF</span>
                    <span class="badge badge-on">CSV Export ON</span>
                </li>
            </ul>
        </div>

        <div class="info" style="margin-top: 15px;">
            <h3>API Server</h3>
            <ul>
                <li>Make sure API is running: <code>cd api && npm start</code></li>
                <li>API URL: <strong>http://localhost:3005</strong></li>
            </ul>
        </div>
    </div>
</body>
</html>
EOF

echo ""
echo "✅ Local environments created successfully!"
echo ""
echo "📂 Directory structure:"
echo "   _local/"
echo "   ├── index.html (environment selector)"
echo "   ├── stage/ (all features enabled)"
echo "   └── production/ (selective features)"
echo ""
echo "🌐 To start local server:"
echo "   cd _local && python3 -m http.server 8001"
echo ""
echo "   Then visit:"
echo "   - http://localhost:8001/ (environment selector)"
echo "   - http://localhost:8001/stage/ (stage environment)"
echo "   - http://localhost:8001/production/ (production environment)"
echo ""
echo "🔧 API Server (run in separate terminal):"
echo "   cd api && npm start"
echo ""
