
import React, { useMemo, useState } from 'react';
import { getWeeklyStats } from '../services/authService';
import { User, DailyStat } from '../types';
import { BarChart3, TrendingUp } from 'lucide-react';

interface WeeklyStatsProps {
  user: User;
}

export const WeeklyStats: React.FC<WeeklyStatsProps> = ({ user }) => {
  // Optimization: Memoize the stats calculation.
  // Parsing localStorage is a synchronous I/O operation (blocking).
  // We only want to run this when the user ID changes, not on every parent re-render.
  const { stats, maxScore, todayScore } = useMemo(() => {
    const data = getWeeklyStats(user.id);
    const max = Math.max(...data.map(d => d.score), 100); // Normalize chart to at least 100
    const today = data[data.length - 1]?.score || 0;
    return { stats: data, maxScore: max, todayScore: today };
  }, [user.id]);

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-2">
            <div className="p-2 bg-slate-700/50 rounded-lg text-neuro-400">
                <BarChart3 className="w-5 h-5" />
            </div>
            <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">Statistik Mingguan</h3>
                <p className="text-xs text-slate-400">Aktivitas XP 7 Hari Terakhir</p>
            </div>
        </div>
        <div className="text-right">
            <span className="block text-2xl font-mono font-bold text-neuro-400">{todayScore}</span>
            <span className="text-xs text-emerald-500 flex items-center justify-end gap-1">
                <TrendingUp className="w-3 h-3" /> Hari Ini
            </span>
        </div>
      </div>

      <div className="flex-1 flex items-end justify-between gap-2 px-2">
        {stats.map((stat, idx) => {
          const heightPercent = (stat.score / maxScore) * 100;
          const dayName = new Date(stat.date).toLocaleDateString('id-ID', { weekday: 'narrow' });
          const isToday = idx === stats.length - 1;

          return (
            <div key={idx} className="flex flex-col items-center gap-2 w-full group">
              <div className="w-full relative flex items-end h-24 bg-slate-800/50 rounded-t-lg overflow-hidden">
                 <div 
                    className={`w-full transition-all duration-1000 ease-out rounded-t-lg ${isToday ? 'bg-neuro-500' : 'bg-slate-600 group-hover:bg-slate-500'}`}
                    style={{ height: `${Math.max(heightPercent, 5)}%` }}
                 ></div>
                 
                 {/* Tooltip */}
                 <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-xs px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                    {stat.score} XP
                 </div>
              </div>
              <span className={`text-[10px] font-bold ${isToday ? 'text-neuro-400' : 'text-slate-500'}`}>
                {dayName}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
