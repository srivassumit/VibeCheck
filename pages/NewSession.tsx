import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileCode, FileText } from 'lucide-react';

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

  const handleStart = () => {
    // In a real app, we'd persist this to context or DB
    // Here we just pass state via navigation
    navigate('/session/active', { state: { prLink, code, requirements } });
  };

  const loadDemo = () => {
    setPrLink('https://github.com/org/repo/pull/42');
    setCode(DEMO_CODE);
    setRequirements(DEMO_REQ);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">New Vibe Check</h1>
        <p className="text-slate-400">Validate code against requirements using Gemini 3.</p>
      </div>

      <div className="space-y-6">
        {/* Input Section */}
        <div className="bg-vibe-panel border border-slate-700 rounded-xl p-6">
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Pull Request URL (GitHub/GitLab)
            </label>
            <input
              type="text"
              value={prLink}
              onChange={(e) => setPrLink(e.target.value)}
              placeholder="https://github.com/..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            />
          </div>

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
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="// Paste the changed code here..."
                className="w-full h-96 bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm font-mono text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
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
                placeholder="Paste the requirements here..."
                className="w-full h-96 bg-slate-900 border border-slate-700 rounded-lg p-4 text-sm text-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-none"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleStart}
            disabled={!code || !requirements}
            className={`flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-lg transition-all ${
              !code || !requirements 
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