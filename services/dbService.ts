import { AnalysisResult, DashboardStats, HistoryItem } from '../types';

const STORAGE_KEY = 'vibecheck_db_v1';

interface DbSchema {
  stats: DashboardStats;
  history: HistoryItem[];
}

const DEFAULT_DATA: DbSchema = {
  stats: {
    passed: 12,
    issues: 3,
    avgTime: '8m',
    avgTimeMinutes: 8,
    totalRuns: 15
  },
  history: [
    {
      id: '1',
      title: 'fix(auth): correct token expiration logic',
      description: 'PROJ-123 • Implement JWT refresh flow',
      status: 'passed',
      score: 98,
      date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2h ago
      timestamp: Date.now() - 1000 * 60 * 60 * 2
    },
    {
      id: '2',
      title: 'feat(ui): add dashboard widgets',
      description: 'PROJ-129 • New analytics chart components',
      status: 'failed',
      score: 64,
      date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5h ago
      timestamp: Date.now() - 1000 * 60 * 60 * 5
    }
  ]
};

const getDb = (): DbSchema => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
      return DEFAULT_DATA;
    }
    return JSON.parse(stored);
  } catch (e) {
    console.error("Failed to load DB", e);
    return DEFAULT_DATA;
  }
};

const saveDb = (data: DbSchema) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getDashboardData = () => {
  const db = getDb();
  return {
    stats: db.stats,
    history: db.history
  };
};

export const saveSession = (
  prLink: string, 
  result: AnalysisResult, 
  durationMs: number
) => {
  const db = getDb();
  
  // Update Stats
  const isPass = result.compliant;
  db.stats.totalRuns += 1;
  if (isPass) db.stats.passed += 1;
  else db.stats.issues += 1;

  // Update Avg Time (simple moving average)
  // Avoid division by zero, though initialized with data
  const totalMinutes = (db.stats.avgTimeMinutes * (db.stats.totalRuns - 1)) + (durationMs / 60000);
  const newAvg = Math.round(totalMinutes / db.stats.totalRuns);
  
  db.stats.avgTimeMinutes = newAvg < 1 ? 1 : newAvg;
  db.stats.avgTime = `${db.stats.avgTimeMinutes}m`;

  // Add History
  const newItem: HistoryItem = {
    id: Date.now().toString(),
    title: prLink ? `PR Analysis #${prLink.split('/').pop() || 'Unknown'}` : 'Local Code Analysis',
    description: result.summary.length > 80 ? result.summary.substring(0, 80) + '...' : result.summary,
    status: isPass ? 'passed' : 'failed',
    score: result.score,
    date: new Date().toISOString(),
    timestamp: Date.now()
  };
  
  // Add to top of list
  db.history.unshift(newItem); 
  
  // Keep history size reasonable (optional)
  if (db.history.length > 50) {
    db.history = db.history.slice(0, 50);
  }

  saveDb(db);
  return newItem;
};