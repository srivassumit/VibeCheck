export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface PRContext {
  id: string;
  url: string;
  title: string;
  description: string;
  codeDiff: string; // The code to check
  requirements: string; // Jira ticket content
}

export interface TestResult {
  name: string;
  passed: boolean;
  logs: string;
}

export interface AnalysisResult {
  compliant: boolean;
  score: number;
  summary: string;
  issues: string[];
  suggestedFix: string;
  generatedTests: string;
  reasoning: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}
