
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, CheckCircle, AlertTriangle, Clock, Server, Database } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { getDashboardData } from '../services/dbService';
import { DashboardStats, HistoryItem } from '../types';

export const Dashboard: React.FC = () => {
  const [data, setData] = useState<{ stats: DashboardStats; history: HistoryItem[] } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dashboardData = await getDashboardData();
        setData(dashboardData);
      } catch (err) {
        console.error("Dashboard load failed", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p>Syncing with VibeCheck Database...</p>
        </div>
      </div>
    );
  }

  const { stats, history } = data || { stats: null, history: [] };

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
        <div className="bg-vibe-panel border border-slate-700 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <CheckCircle className="w-24 h-24" />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-2xl font-bold text-white">{stats?.passed || 0}</span>
          </div>
          <p className="text-slate-400 text-sm relative z-10">PRs Passed</p>
        </div>
        
        <div className="bg-vibe-panel border border-slate-700 p-6 rounded-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-5">
            <AlertTriangle className="w-24 h-24" />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
            <span className="text-2xl font-bold text-white">{stats?.issues || 0}</span>
          </div>
          <p className="text-slate-400 text-sm relative z-10">Issues Detected</p>
        </div>

        <div className="bg-vibe-panel border border-slate-700 p-6 rounded-xl relative overflow-hidden">
           <div className="absolute top-0 right-0 p-4 opacity-5">
            <Clock className="w-24 h-24" />
          </div>
          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Clock className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-2xl font-bold text-white">{stats?.avgTime || '0m'}</span>
          </div>
          <p className="text-slate-400 text-sm relative z-10">Avg. Analysis Time</p>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-6 text-white">
        <Database className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-semibold">Recent Activity</h2>
      </div>
      
      <div className="bg-vibe-panel border border-slate-700 rounded-xl overflow-hidden shadow-xl">
        <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-700 text-sm font-medium text-slate-400 bg-slate-800/50">
          <div className="col-span-6">PR / Description</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Score</div>
          <div className="col-span-2 text-right">Date</div>
        </div>
        
        {!Array.isArray(history) || history.length === 0 ? (
           <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
             <Database className="w-12 h-12 opacity-20" />
             <p>No analyses found in the database.</p>
             <Link to="/session/new" className="text-blue-400 hover:underline">Start your first check</Link>
           </div>
        ) : (
          <div className="divide-y divide-slate-700">
             {history.map((item) => (
               <div key={item.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-slate-800/50 transition-colors cursor-pointer group">
                 <div className="col-span-6">
                   <div className="font-medium text-blue-400 group-hover:text-blue-300 truncate font-mono text-sm" title={item.title}>
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
                 <div className="col-span-2 text-white font-mono text-sm">
                   <span className={item.score > 80 ? 'text-green-400' : item.score > 50 ? 'text-yellow-400' : 'text-red-40