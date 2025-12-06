import { DashboardStats, HistoryItem } from '../types';

export const MOCK_DB: { stats: DashboardStats; history: HistoryItem[] } = {
  stats: {
    passed: 42,
    issues: 15,
    avgTime: '4m 12s',
    avgTimeMinutes: 4.2,
    totalRuns: 57
  },
  history: [
    {
      id: '101',
      title: 'feat(api): optimize database queries',
      description: 'PROJ-882 • Reduce latency by 50% using compound indexes',
      status: 'passed',
      score: 94,
      date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
      timestamp: Date.now() - 1000 * 60 * 30
    },
    {
      id: '102',
      title: 'fix(ui): resolve layout shift on mobile',
      description: 'PROJ-891 • Fix CLS issues in the main dashboard grid',
      status: 'failed',
      score: 45,
      date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
      timestamp: Date.now() - 1000 * 60 * 60 * 2
    },
    {
      id: '103',
      title: 'chore(deps): upgrade react to v19',
      description: 'PROJ-900 • Upgrade core dependencies and fix breaking changes',
      status: 'passed',
      score: 88,
      date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
      timestamp: Date.now() - 1000 * 60 * 60 * 24
    },
    {
      id: '104',
      title: 'feat(auth): add google sso support',
      description: 'PROJ-772 • Implement OAuth2 flow for enterprise users',
      status: 'passed',
      score: 92,
      date: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1 day ago
      timestamp: Date.now() - 1000 * 60 * 60 * 26
    },
    {
      id: '105',
      title: 'refactor(utils): simplify date parsing',
      description: 'PROJ-905 • Replace moment.js with date-fns to reduce bundle size',
      status: 'failed',
      score: 60,
      date: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(), // 2 days ago
      timestamp: Date.now() - 1000 * 60 * 60 * 48
    }
  ]
};