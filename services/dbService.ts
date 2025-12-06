import { AnalysisResult, DashboardStats, HistoryItem } from '../types';
import { MOCK_DB } from './mockData';

const STORAGE_KEY = 'vibecheck_db_v1';

interface DbSchema {
  stats: DashboardStats;
  history: HistoryItem[];
}

const getDb = (): DbSchema => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    
    // If nothing in storage, return Mock Data
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DB));
      return MOCK_DB;
    }

    const parsed = JSON.parse(stored);

    // CRITICAL VALIDATION: Ensure the structure is exactly what we expect.
    // If history is not an array, the Dashboard component will crash on .map()
    const isValid = 
      parsed && 
      parsed.stats && 
      typeof parsed.stats.passed === 'number' &&
      Array.isArray(parsed.history);

    if (!isValid) {
      console.warn("Database schema mismatch or corruption detected. Resetting to default data.");
      // Clear the bad data
      localStorage.removeItem(STORAGE_KEY);
      // Reset to defaults
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DB));
      return MOCK_DB;
    }

    return parsed as DbSchema;
  } catch (e) {
    console.error("Failed to load DB", e);
    // Fallback to mock data on error to prevent white screen
    return MOCK_DB;
  }
};

const saveDb = (data: DbSchema) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to localStorage", e);
  }
};

export const getDashboardData = () => {
  const db = getDb();
  // Ensure we always return valid objects even if DB returns something weird (double safety)
  return {
    stats: db?.stats || MOCK_DB.stats,
    history: Array.isArray(db?.history) ? db.history : MOCK_DB.history
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
  const currentAvgMs = db.stats.avgTimeMinutes * 60000;
  // Weighted average: (OldTotalTime + NewDuration) / NewTotalCount
  const totalMs = (currentAvgMs * (db.stats.totalRuns - 1)) + durationMs;
  const newAvgMs = totalMs / db.stats.totalRuns;
  
  const newAvgMins = newAvgMs / 60000;
  
  db.stats.avgTimeMinutes = Number(newAvgMins.toFixed(1));
  
  // Format human readable
  const mins = Math.floor(newAvgMins);
  const secs = Math.round((newAvgMins - mins) * 60);
  db.stats.avgTime = `${mins}m ${secs}s`;

  // Add History
  const newItem: HistoryItem = {
    id: Date.now().toString(),
    title: prLink ? `PR #${prLink.split('/').pop() || 'Unknown'}` : 'Local Code Analysis',
    description: result.summary.length > 100 ? result.summary.substring(0, 100) + '...' : result.summary,
    status: isPass ? 'passed' : 'failed',
    score: result.score,
    date: new Date().toISOString(),
    timestamp: Date.now()
  };
  
  // Add to top of list
  db.history.unshift(newItem); 
  
  // Keep history size reasonable
  if (db.history.length > 50) {
    db.history = db.history.slice(0, 50);
  }

  saveDb(db);
  return newItem;
};