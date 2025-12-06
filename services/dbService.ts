import { AnalysisResult, DashboardStats, HistoryItem } from '../types';
import { MOCK_DB } from './mockData';

const STORAGE_KEY = 'vibecheck_db_v1';
const API_URL = 'http://localhost:3001/api';

interface DbSchema {
  stats: DashboardStats;
  history: HistoryItem[];
}

/**
 * Client-side persistence helper (Fallback)
 */
const getLocalDb = (): DbSchema => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DB));
      return MOCK_DB;
    }
    const parsed = JSON.parse(stored);
    // Basic validation
    if (!parsed || !parsed.stats || !Array.isArray(parsed.history)) {
      return MOCK_DB;
    }
    return parsed as DbSchema;
  } catch (e) {
    console.error("Failed to load local DB", e);
    return MOCK_DB;
  }
};

const saveLocalDb = (data: DbSchema) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save to localStorage", e);
  }
};

/**
 * Fetches dashboard data from MongoDB via API, falls back to LocalStorage
 */
export const getDashboardData = async (): Promise<{ stats: DashboardStats; history: HistoryItem[] }> => {
  try {
    // Attempt to fetch from local MongoDB backend
    // Short timeout to prevent UI blocking if server is down
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);
    
    const response = await fetch(`${API_URL}/dashboard`, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!response.ok) throw new Error('Backend unavailable');
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.warn("Backend offline or unreachable, using LocalStorage fallback.");
    const db = getLocalDb();
    return {
      stats: db.stats || MOCK_DB.stats,
      history: Array.isArray(db.history) ? db.history : MOCK_DB.history
    };
  }
};

/**
 * Saves a new session to MongoDB via API, falls back to LocalStorage
 */
export const saveSession = async (
  prLink: string, 
  result: AnalysisResult, 
  durationMs: number,
  customTitle?: string
): Promise<HistoryItem> => {
  const isPass = result.compliant;
  // Use custom title if available (from real GitHub data), else fallback to generated one
  const title = customTitle || (prLink ? `PR #${prLink.split('/').pop() || 'Unknown'}` : 'Local Code Analysis');
  const description = result.summary.length > 100 ? result.summary.substring(0, 100) + '...' : result.summary;

  const payload = {
    title,
    description,
    prLink,
    status: isPass ? 'passed' : 'failed',
    score: result.score,
    durationMs,
    issues: result.issues,
    issueCount: result.issues.length,
    summary: result.summary
  };

  try {
    const response = await fetch(`${API_URL}/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) throw new Error('Failed to save to backend');
    
    const savedDoc = await response.json();
    
    return {
      id: savedDoc._id || Date.now().toString(),
      title: savedDoc.title,
      description: savedDoc.description,
      status: savedDoc.status,
      score: savedDoc.score,
      date: savedDoc.createdAt || new Date().toISOString(),
      timestamp: new Date(savedDoc.createdAt).getTime()
    };

  } catch (error) {
    console.warn("Backend offline, saving to LocalStorage.");
    
    // Fallback Logic
    const db = getLocalDb();
    
    // Update Stats
    db.stats.totalRuns += 1;
    if (isPass) db.stats.passed += 1;
    else db.stats.issues += 1;

    // Recalculate Average Time (Approximation)
    const currentAvgMs = db.stats.avgTimeMinutes * 60000;
    // Avoid division by zero if it's the first run
    const prevRuns = Math.max(0, db.stats.totalRuns - 1);
    const totalMs = (currentAvgMs * prevRuns) + durationMs;
    const newAvgMs = totalMs / db.stats.totalRuns;
    const newAvgMins = newAvgMs / 60000;
    
    db.stats.avgTimeMinutes = Number(newAvgMins.toFixed(1));
    const mins = Math.floor(newAvgMins);
    const secs = Math.round((newAvgMins - mins) * 60);
    db.stats.avgTime = `${mins}m ${secs}s`;

    const newItem: HistoryItem = {
      id: Date.now().toString(),
      title,
      description,
      status: isPass ? 'passed' : 'failed',
      score: result.score,
      date: new Date().toISOString(),
      timestamp: Date.now()
    };
    
    db.history.unshift(newItem); 
    if (db.history.length > 50) db.history = db.history.slice(0, 50);

    saveLocalDb(db);
    return newItem;
  }
};