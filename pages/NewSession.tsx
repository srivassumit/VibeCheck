
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileCode, FileText, Download, Terminal, Loader2, Check, AlertCircle, Plus } from 'lucide-react';
import { fetchPRData, parseGitHubUrl } from '../services/githubService';
import { generateUnitTest } from '../services/geminiService';

const DEMO_CODE = `// src/components/UserProfile.tsx
import React, { useState, useEffect } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
}

export const UserProfile = ({ userId }: { userId: string }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    fetch(\`/api/users/\${userId}\`)
      .then(res => res.json())
      .then(data => setUser(data));
  }, []); // Missing dependency: userId

  if (!user) return <div>Loading...</div>;

  return (
    <div className="p-4 border rounded">
      <h1>{user.name}</h1>
      <p>{user.email}</p>
      {/* Requirement says Admins should see a delete button, but it's missing */}
    </div>
  );
};`;

const DEMO_REQ = `Story: PROJ-882 - User Profile Update

Requirements:
1. The component must fetch user data based on the provided userId prop.
2. If the userId changes, the component must re-fetch the data.
3. Display the user's name and email.
4. If the user has the 'admin' role, a 'Delete User' button must be visible in red.
5. The component must handle loading states and potential fetch errors gracefully.`;

export const NewSession: React.FC = () => {
  const navigate = useNavigate();
  const [prLink, setPrLink] = useState('');
  const [code, setCode] = useState('');
  const [requirements, setRequirements] = useState('');
  const [prTitle, setPrTitle] = useState('');

  // Checkout State
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [isGeneratingTests, setIsGeneratingTests] = useState(false);
  const [checkoutLogs, setCheckoutLogs] = useState<string[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [checkoutLogs]);

  const handleStart = () => {
    navigate('/session/active', { state: { prLink, code, requirements, prTitle } });
  };

  const loadDemo = () => {
    setPrLink('https://github.com/org/repo/pull/42');
    setCode(DEMO_CODE);
    setRequirements(DEMO_REQ);
    setPrTitle('feat: user profile component implementation');
    setCheckoutLogs([]);
  };

  const handleAddUnitTests = async () => {
    if (!code) return;
    setIsGeneratingTests(true);
    try {
      const tests = await generateUnitTest(code);
      navigate('/unit-tests', {
        state: {
          prLink,
          code,
          generatedTests: tests
        }
      });
    } catch (error) {
      console.error("Failed to generate tests", error);
      alert("Failed to generate tests. Check console.");
      setIsGeneratingTests(false);
    }
  };

  const handleCheckout = async () => {
    if (!prLink) return;
    setIsCheckingOut(true);
    setCheckoutLogs([]);
    setPrTitle('');

    const addLog = (msg: string) => setCheckoutLogs(prev => [...prev, msg]);
    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    try {
      const parsed = parseGitHubUrl(prLink);
      if (!parsed) {
        addLog(`> Error: Invalid GitHub PR URL format.`);
        addLog(`> Expected: https://github.com/owner/repo/pull/number`);
        throw new Error("Invalid URL");
      }

      addLog(`> Initializing git environment...`);
      await delay(400);

      addLog(`> git clone https://github.com/${parsed.owner}/${parsed.repo}.git`);
      await delay(600);

      addLog(`> cd ${parsed.repo}`);
      await delay(300);

      addLog(`> git fetch origin pull/${parsed.number}/head:pr-${parsed.number}`);
      await delay(800);

      addLog(`> git checkout pr-${parsed.number}`);

      // Actual fetch
      const data = await fetchPRData(prLink);

      await delay(400);
      addLog(`> Switched to branch 'pr-${parsed.number}'`);
      addLog(`> HEAD is now at ${data.title.substring(0, 30)}...`);
      addLog(`> Reading file contents...`);

      setCode(data.code);
      setPrTitle(data.title);

      // Only set requirements if empty, otherwise user might have pasted Jira tickets already
      if (!requirements) {
        setRequirements(`PR Title: ${data.title}\n\nDescription:\n${data.description}`);
        addLog(`> Extracted PR description for requirements context.`);
      }

      addLog(`> Success: Workspace ready.`);

    } catch (error: any) {
      addLog(`> Error: ${error.message}`);
      addLog(`> Checkout failed.`);
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">New Vibe Check</h1>
        <p className="text-slate-400">Validate code against requirements using Gemini 3.</p>
      </div>

      <div className="space-y-6">
        {/* Input Section */}
        <div className="bg-vibe-panel border border-slate-700 rounded-xl p-6 shadow-xl">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Pull Request URL (GitHub Public Repo)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={prLink}
                onChange={(e) => setPrLink(e.target.value)}
                placeholder="https://github.com/owner/repo/pull/123"
                disabled={isCheckingOut}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 font-mono text-sm"
              />
              <button
                onClick={handleCheckout}
                disabled={!prLink || isCheckingOut}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${!prLink || isCheckingOut
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-700 text-white hover:bg-slate-600 border border-slate-600'
                  }`}
              >
                {isCheckingOut ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                Checkout Code
              </button>
            </div>
          </div>

          {/* Terminal Output */}
          {checkoutLogs.length > 0 && (
            <div className="mb-6 bg-black rounded-lg border border-slate-800 p-4 font-mono text-xs shadow-inner max-h-48 overflow-y-auto">
              <div className="flex items-center gap-2 text-slate-500 mb-2 pb-2 border-b border-slate-900">
                <Terminal className="w-3 h-3" />
                <span>Terminal</span>
              </div>
              <div className="space-y-1">
                {checkoutLogs.map((log, i) => (
                  <div key={i} className={`${log.startsWith('> Error') ? 'text-red-400' : log.startsWith('> Success') ? 'text-green-400' : 'text-slate-300'}`}>
                    {log}
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  Code / Diff Snippet
                </label>
                <button onClick={loadDemo} className="text-xs text-blue-400 hover:text-blue-300">
                  Load Demo Data
                </button>
              </div>
              <div className="flex gap-2 mb-2">
                <button
                  onClick={handleAddUnitTests}
                  disabled={!code || isGeneratingTests || isCheckingOut}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium transition-colors ${!code || isGeneratingTests || isCheckingOut
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                    }`}
                >
                  {isGeneratingTests ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                  Add Unit Tests
                </button>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Code will appear here after checkout..."
                className="w-full h-96 bg-slate-900 border border-slate-700 rounded-lg p-4 text-xs font-mono text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none leading-relaxed"
              />
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-2">
                <FileText className="w-4 h-4 text-green-400" />
                Jira Requirements / Ticket Description
              </label>
              <textarea
                value={requirements}
                onChange={(e) => setRequirements(e.target.value)}
                placeholder="Paste the requirements here or checkout PR to auto-fill description..."
                className="w-full h-96 bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none leading-relaxed"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleStart}
            disabled={!code || !requirements || isCheckingOut}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all ${!code || !requirements || isCheckingOut
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:shadow-blue-500/25 active:scale-95'
              }`}
          >
            Start Vibe Debugging
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};