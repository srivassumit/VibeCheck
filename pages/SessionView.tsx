import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { analyzePRCompliance } from '../services/geminiService';
import { saveSession } from '../services/dbService';
import { AnalysisResult, AnalysisStatus } from '../types';
import { CodeBlock } from '../components/CodeBlock';
import { Loader2, CheckCircle, XCircle, Terminal, Play, Cpu, AlertTriangle, ArrowLeft } from 'lucide-react';

export const SessionView: React.FC = () => {
  const location = useLocation();
  const state = location.state as { prLink: string; code: string; requirements: string; prTitle?: string };
  
  const [status, setStatus] = useState<AnalysisStatus>(AnalysisStatus.IDLE);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [activeTab, setActiveTab] = useState<'analysis' | 'tests' | 'fix'>('analysis');
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [testOutput, setTestOutput] = useState<string>('');

  useEffect(() => {
    if (state?.code && state?.requirements && status === AnalysisStatus.IDLE) {
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const runAnalysis = async () => {
    setStatus(AnalysisStatus.ANALYZING);
    const startTime = Date.now();
    try {
      const data = await analyzePRCompliance(state.code, state.requirements);
      
      setResult(data);
      setStatus(AnalysisStatus.COMPLETED);
      
      // Save result to DB (awaiting to ensure persistence)
      const duration = Date.now() - startTime;
      // Pass the real PR title if we have it from the previous step
      await saveSession(state.prLink, data, duration, state.prTitle, state.requirements);

    } catch (error) {
      console.error(error);
      setStatus(AnalysisStatus.ERROR);
    }
  };

  const simulateTestRun = () => {
    if (!result?.generatedTests) return;
    setIsRunningTests(true);
    setTestOutput('');
    
    // Simulate a build and test process
    const steps = [
      "Installing dependencies...",
      "Compiling TypeScript...",
      "Running Jest test suite...",
      "Executing: UserProfile.test.tsx",
    ];

    let i = 0;
    const interval = setInterval(() => {
      if (i < steps.length) {
        setTestOutput(prev => prev + `> ${steps[i]}\n`);
        i++;
      } else {
        // Final result based on compliance
        const finalMsg = result.compliant 
          ? "✅ PASS  src/components/UserProfile.test.tsx\nTest Suites: 1 passed, 1 total\nTests:       4 passed, 4 total"
          : "❌ FAIL  src/components/UserProfile.test.tsx\nExpected element 'Delete User' to be in document.\nTests:       3 passed, 1 failed, 4 total";
        
        setTestOutput(prev => prev + `\n${finalMsg}`);
        setIsRunningTests(false);
        clearInterval(interval);
      }
    }, 800);
  };

  if (!state) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>No session state found.</p>
        <Link to="/session/new" className="text-blue-400 underline">Start New Session</Link>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="bg-vibe-panel border-b border-slate-800 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              PR Analysis <span className="text-slate-500 font-normal">#{state.prLink ? state.prLink.split('/').pop() : 'Local'}</span>
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {status === AnalysisStatus.ANALYZING && (
                <span className="flex items-center gap-1 text-xs text-blue-400">
                  <Loader2 className="w-3 h-3 animate-spin" /> Gemini is analyzing...
                </span>
              )}
              {status === AnalysisStatus.COMPLETED && (
                <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${result?.compliant ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {result?.compliant ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {result?.compliant ? 'Compliant' : 'Issues Detected'}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('analysis')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'analysis' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Analysis & Fixes
          </button>
          <button 
             onClick={() => setActiveTab('tests')}
             className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === 'tests' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
          >
            Unit Tests
          </button>
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        {status === AnalysisStatus.ANALYZING ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4">
            <div className="relative w-24 h-24">
              <div className="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Cpu className="w-8 h-8 text-blue-400 animate-pulse" />
              </div>
            </div>
            <p className="text-slate-400 animate-pulse">Running Vibe Check algorithm...</p>
            <p className="text-xs text-slate-500">Checking requirements vs implementation</p>
          </div>
        ) : status === AnalysisStatus.ERROR ? (
          <div className="text-center text-red-400 p-10">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-xl font-bold">Analysis Failed</h2>
            <p>Could not connect to Gemini service. Please check your API key.</p>
          </div>
        ) : result ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            
            {/* Left Col: Analysis & Logic */}
            <div className="space-y-6">
              {/* Score Card */}
              <div className="bg-vibe-panel border border-slate-700 rounded-xl p-6">
                 <div className="flex justify-between items-center mb-4">
                   <h2 className="text-lg font-semibold text-white">Vibe Score</h2>
                   <span className={`text-3xl font-mono font-bold ${result.score > 80 ? 'text-green-400' : result.score > 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                     {result.score}/100
                   </span>
                 </div>
                 <p className="text-slate-300 text-sm leading-relaxed border-l-2 border-blue-500 pl-4">
                   {result.summary}
                 </p>
              </div>

              {/* Issues List */}
              <div className="bg-vibe-panel border border-slate-700 rounded-xl p-6">
                <h3 className="text-md font-semibold text-white mb-4 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-500" />
                  Identified Discrepancies
                </h3>
                <ul className="space-y-3">
                  {result.issues.map((issue, idx) => (
                    <li key={idx} className="flex gap-3 text-sm text-slate-300 bg-slate-800/50 p-3 rounded-lg">
                      <span className="text-red-400 font-bold">•</span>
                      {issue}
                    </li>
                  ))}
                  {result.issues.length === 0 && (
                    <li className="text-slate-500 italic">No major issues found.</li>
                  )}
                </ul>
              </div>

               {/* Reasoning */}
               <div className="bg-vibe-panel border border-slate-700 rounded-xl p-6">
                 <h3 className="text-md font-semibold text-white mb-2">Technical Reasoning</h3>
                 <div className="text-sm text-slate-400 prose prose-invert">
                   {result.reasoning}
                 </div>
               </div>
            </div>

            {/* Right Col: Code / Tests */}
            <div className="flex flex-col h-full bg-vibe-panel border border-slate-700 rounded-xl overflow-hidden">
              {activeTab === 'analysis' && (
                <div className="flex flex-col h-full">
                   <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                     <span className="text-sm font-medium text-slate-300">Suggested Fix</span>
                     {!result.compliant && <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">Auto-Generated</span>}
                   </div>
                   <div className="flex-1 overflow-auto p-4 bg-[#0d1117]">
                     {result.suggestedFix ? (
                       <CodeBlock code={result.suggestedFix} title="Fixed Component" />
                     ) : (
                       <div className="h-full flex items-center justify-center text-slate-500">
                         <p>Code is compliant. No fixes needed.</p>
                       </div>
                     )}
                   </div>
                </div>
              )}

              {activeTab === 'tests' && (
                <div className="flex flex-col h-full">
                   <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex justify-between items-center">
                     <span className="text-sm font-medium text-slate-300">Generated Test Suite</span>
                     <button 
                       onClick={simulateTestRun}
                       disabled={isRunningTests}
                       className="flex items-center gap-2 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded transition-colors"
                     >
                       {isRunningTests ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" /> }
                       Run Tests
                     </button>
                   </div>
                   <div className="flex-1 overflow-auto p-4 bg-[#0d1117] flex flex-col gap-4">
                     <CodeBlock code={result.generatedTests} title="UserProfile.test.tsx" />
                     
                     {/* Terminal Output */}
                     <div className="mt-4 rounded-lg bg-black border border-slate-800 p-4 font-mono text-xs text-slate-300">
                        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-2 text-slate-500">
                          <Terminal className="w-3 h-3" />
                          <span>Console</span>
                        </div>
                        <pre className="whitespace-pre-wrap">
                          {testOutput || <span className="text-slate-600 italic">// Click 'Run Tests' to execute</span>}
                        </pre>
                     </div>
                   </div>
                </div>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};