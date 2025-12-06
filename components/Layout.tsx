import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, GitPullRequest, Settings, Terminal, Zap } from 'lucide-react';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path ? "bg-blue-600/10 text-blue-400 border-r-2 border-blue-500" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200";

  return (
    <div className="flex h-screen bg-vibe-dark overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-vibe-panel border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Zap className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">VibeDebug</h1>
        </div>

        <nav className="flex-1 py-6 space-y-1">
          <Link to="/" className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${isActive('/')}`}>
            <LayoutDashboard className="w-5 h-5" />
            Dashboard
          </Link>
          <Link to="/session/new" className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${isActive('/session/new')}`}>
            <GitPullRequest className="w-5 h-5" />
            New Vibe Check
          </Link>
          <div className="px-6 pt-6 pb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Tools
          </div>
          <Link to="/debugger" className={`flex items-center gap-3 px-6 py-3 text-sm font-medium transition-colors ${isActive('/debugger')}`}>
            <Terminal className="w-5 h-5" />
            Live Debugger
          </Link>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center gap-3 px-2 py-2 text-slate-500 text-sm">
            <Settings className="w-4 h-4" />
            <span>Settings</span>
          </div>
          <div className="mt-4 px-2">
            <div className="text-xs text-slate-600">Model: Gemini 3 Pro</div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative">
        {children}
      </main>
    </div>
  );
};