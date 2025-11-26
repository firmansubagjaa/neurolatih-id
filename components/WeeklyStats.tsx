
import React, { useMemo, useState } from 'react';
import { getWeeklyStats } from '../services/authService';
import { UserProfile } from '../types';
import { BarChart3, TrendingUp } from 'lucide-react';

interface WeeklyStatsProps {
  user?: UserProfile;
}

export const WeeklyStats: React.FC<WeeklyStatsProps> = () => {
  const { stats, maxScore, todayScore } = useMemo(() => {
    const data = getWeeklyStats();
    const max = Math.max(...data.map(d => d.score), 200); 
    const today = data[data.length - 1]?.score || 0;
    return { stats: data, maxScore: max, todayScore: today };
  }, []); 

  const [activeTooltip, setActiveTooltip] = useState<number | null>(null);

  const handleInteraction = (idx: number) => {
    setActiveTooltip(activeTooltip === idx ? null : idx);
  };

  return (
    <div className="w-full h-full flex flex-col p-4">
      {/* Background Grid */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
      
      <div className="flex justify-between items-start mb-4 md:mb-6 border-b-2 border-slate-700 pb-4 relative z-10">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-slate-800 border border-slate-600 text-retro-cyan">
                <BarChart3 className="w-6 h-6" />
            </div>
            <div>
                <h3 className="text-sm font-bold text-white uppercase font-pixel tracking-wide">STATISTIK</h3>
                <p className="text-[10px] md:text-xs text-slate-400 font-mono">AKTIVITAS 7 HARI TERAKHIR</p>
            </div>
        </div>
        <div className="text-right">
            <span className="block text-2xl font-mono font-bold text-retro-green text-shadow-retro">{todayScore} XP</span>
            <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center justify-end gap-1">
                <TrendingUp className="w-3 h-3 text-retro-green" /> HARI INI
            </span>
        </div>
      </div>

      <div className="flex-1 flex items-end justify-between gap-2 md:gap-4 px-2 h-full min-h-[120px] pb-6 relative z-10">
        {stats.map((stat, idx) => {
          const heightPercent = (stat.score / maxScore) * 100;
          const visualHeight = Math.max(heightPercent, 5); 
          const dayName = new Date(stat.date).toLocaleDateString('id-ID', { weekday: 'narrow' });
          const isToday = idx === stats.length - 1;
          const hasScore = stat.score > 0;
          let barColorClass = "bg-slate-800 border-slate-700"; 
          if (hasScore) {
              if (isToday) barColorClass = "bg-retro-green border-white shadow-[0_0_15px_rgba(74,222,128,0.4)]";
              else barColorClass = "bg-emerald-600 border-emerald-400 opacity-80 hover:opacity-100";
          } else if (isToday) barColorClass = "bg-slate-700 border-retro-green/50 animate-pulse";

          return (
            <div key={idx} className="flex flex-col items-center gap-2 w-full h-full justify-end relative cursor-pointer group"
                onClick={() => handleInteraction(idx)} onMouseEnter={() => setActiveTooltip(idx)} onMouseLeave={() => setActiveTooltip(null)}
            >
              {activeTooltip === idx && (
                  <div className="absolute bottom-full mb-2 z-20 pointer-events-none animate-fade-in">
                      <div className="bg-black border-2 border-white px-2 py-1 text-[10px] font-pixel text-white shadow-retro whitespace-nowrap text-center">
                          <div>{new Date(stat.date).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</div>
                          <div className="text-retro-yellow">{stat.score} XP</div>
                      </div>
                  </div>
              )}
              <div className={`w-full max-w-[40px] border-t-2 border-x-2 transition-all duration-1000 ease-out relative ${barColorClass}`} style={{ height: `${visualHeight}%` }}>
                  {hasScore && <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(0,0,0,0.1)_25%,transparent_25%,transparent_50%,rgba(0,0,0,0.1)_50%,rgba(0,0,0,0.1)_75%,transparent_75%,transparent)] bg-[length:4px_4px]"></div>}
              </div>
              <span className={`text-[10px] font-bold font-pixel uppercase ${isToday ? 'text-retro-green' : 'text-slate-500'}`}>{dayName}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
