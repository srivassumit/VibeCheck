import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, CheckCircle, AlertTriangle, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDashboardData } from '../services/dbService';
import { DashboardStats, HistoryItem } from '../types';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<{ stats: DashboardStats; history: HistoryItem[] } | null>(null);

  useEffect(() => {
    // Fetch data in effect to avoid render-time side effects
    const dashboardData = getDashboardData();
    setData(dashboardData);
  }, []);

  if (!data) {
    return (
      <div className="p-8 text-slate-400">Loading dashboard data...</div>
    );
  }

  const { stats, history } = data;

  const formatDateSafe = (dateStr: string) => {
    try {
      if (!dateStr) return 'Recently';
      return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
    } catch (e) {
      return 'Recently';
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-slate-400">Manage your autonomous PR verifications</p>
        </div>
        <Link 
          to="/session/new"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-all shadow-lg shadow-blue-900/20"
        >
          <Plus className="w-4 h-4" />
          New Check
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <div className="bg-vibe-panel border border-slate-700 p-6 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-2xl font-bold text-white">{stats?.passed || 0}</span>
          </div>
          <p className="text-slate-400 text-sm">PRs Passed</p>
        </div>
        <div className="bg-vibe-panel border border-slate-700 p-6 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
            <span className="text-2xl font-bold text-white">{stats?.issues || 0}</span>
          </div>
          <p className="text-slate-400 text-sm">Issues Detected</p>
        </div>
        <div className="bg-vibe-panel border border-slate-700 p-6 rounded-xl">
          <div className="flex justify-between items-start mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-2xl font-bold text-white">{stats?.avgTime || '0m'}</span>
          </div>
          <p className="text-slate-400 text-sm">Avg. Analysis Time</p>
        </div>
      </div>

      <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
      <div className="bg-vibe-panel border border-slate-700 rounded-xl overflow-hidden">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-700 text-sm font-medium text-slate-400">
          <div className="col-span-6">PR / Description</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Score</div>
          <div className="col-span-2 text-right">Date</div>
        </div>
        
        {/* Added strict array check for history */}
        {!Array.isArray(history) || history.length === 0 ? (
           <div className="p-8 text-center text-slate-500">
             No analyses run yet. Start a new session!
           </div>
        ) : (
          <div className="divide-y divide-slate-700">
             {history.map((item) => (
               <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800/50 transition-colors cursor-pointer group">
                 <div className="col-span-6">
                   <div className="font-medium text-blue-400 group-hover:text-blue-300 truncate" title={item.title}>
                     {item.title}
                   </div>
                   <div className="text-xs text-slate-500 mt-1 truncate" title={item.description}>
                     {item.description}
                   </div>
                 </div>
                 <div className="col-span-2">
                   {item.status === 'passed' ? (
                     <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                       <CheckCircle className="w-3 h-3" />
                       Passed
                     </span>
                   ) : (
                     <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                       <AlertTriangle className="w-3 h-3" />
                       Failed
                     </span>
                   )}
                 </div>
                 <div className="col-span-2 text-white font-mono">
                   <span className={item.score > 80 ? 'text-green-400' : item.score > 50 ? 'text-yellow-400' : 'text-red-400'}>
                     {item.score}/100
                   </span>
                 </div>
                 <div className="col-span-2 text-right text-slate-500 text-sm">
                   {formatDateSafe(item.date)}
                 </div>
               </div>
             ))}
          </div>
        )}
      </div>
    </div>
  );
};