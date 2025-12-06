import { AnalysisResult, DashboardStats, HistoryItem } from '../types';

// Use relative URL to allow Vite proxy to handle the connection to localhost:3001
const API_URL = '/api';

/**
 * Fetches dashboard data from MongoDB via API
 * No local fallback - assumes backend is running
 */
export const getDashboardData = async (): Promise<{ stats: DashboardStats; history: HistoryItem[] }> => {
  try {
    const response = await fetch(`${API_URL}/dashboard`);
    if (!response.ok) {
      throw new Error(`Server responded with ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error: any) {
    console.error("API Fetch Error:", error);
    // Handle both Chrome and Safari/Firefox generic fetch errors
    if (error.name === 'TypeError' && (error.message === 'Failed to fetch' || error.message === 'Load failed')) {
      throw new Error("Connection refused. Is the backend server running on port 3001?");
    }
    throw error;
  }
};

/**
 * Saves a new session to MongoDB via API
 * No local fallback - assumes backend is running
 */
export const saveSession = async (
  prLink: string, 
  result: AnalysisResult, 
  durationMs: number,
  customTitle?: string,
  requirements?: string
): Promise<HistoryItem> => {
  const isPass = result.compliant;
  // Use custom title if available (from real GitHub data), else fallback to generated one
  const title = customTitle || (prLink ? `PR #${prLink.split('/').pop() || 'Unknown'}` : 'Local Code Analysis');
  const description = result.summary.length > 100 ? result.summary.substring(0, 100) + '...' : result.summary;

  const payload = {
    title,
    description,
    prLink,
    requirements,
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
    
    if (!response.ok) throw new Error(`Backend save failed: ${response.status}`);
    
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
  } catch (error: any) {
    console.error('Error saving session:', error);
    throw error;
  }
};