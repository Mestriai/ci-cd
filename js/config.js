/**
 * Application Configuration
 */

export const CONFIG = {
    API_BASE: 'http://localhost:3005/api',
    FEATURE_FLAGS_PATH: 'config/features.json',
    POLL_INTERVAL: 30000, // 30 seconds
};

export const DEMO_TASKS = [
    {
        id: 1,
        title: 'Setup trunk-based development workflow',
        description: 'Configure YAML feature flags and deployment pipeline',
        priority: 'high',
        status: 'completed',
        tags: ['devops', 'setup']
    },
    {
        id: 2,
        title: 'Implement advanced search feature',
        description: 'Dev 1 working on this (14 days)',
        priority: 'medium',
        status: 'in_progress',
        tags: ['feature', 'dev1']
    },
    {
        id: 3,
        title: 'Ship CSV export to production',
        description: 'Dev 2 completed this (2 days) - now live!',
        priority: 'high',
        status: 'completed',
        tags: ['feature', 'dev2', 'shipped']
    }
];
