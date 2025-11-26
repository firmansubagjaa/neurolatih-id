
import React, { useState, useMemo } from 'react';
import { X, Award, Lock, Filter } from 'lucide-react';
import { Achievement, AchievementTier, UserProfile } from '../types';
import { ACHIEVEMENTS_DB } from '../services/authService';
import { playSound } from '../services/audioService';

interface AchievementsModalProps { isOpen: boolean; onClose: () => void; profile: UserProfile; }

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose, profile }) => {
  const [filter, setFilter] = useState<'ALL' | 'UNLOCKED' | 'LOCKED'>('ALL');
  const filteredAchievements = useMemo(() => {
    return ACHIEVEMENTS_DB.filter(ach => {
      const isUnlocked = profile.unlockedAchievements.includes(ach.id);
      if (filter === 'UNLOCKED') return isUnlocked;
      if (filter === 'LOCKED') return !isUnlocked;
      return true;
    });
  }, [filter, profile.unlockedAchievements]);

  if (!isOpen) return null;

  const getTierColor = (tier: AchievementTier) => {
      switch(tier) {
          case 'BRONZE': return 'border-orange-700 text-orange-500 bg-orange-900/20';
          case 'SILVER': return 'border-slate-400 text-slate-300 bg-slate-800/50';
          case 'GOLD': return 'border-yellow-500 text-yellow-400 bg-yellow-900/30 shadow-[0_0_15px_rgba(234,179,8,0.2)]';
          case 'PLATINUM': return 'border-purple-500 text-purple-400 bg-purple-900/30 shadow-[0_0_15px_rgba(168,85,247,0.3)]';
          default: return 'border-slate-700 text-slate-500';
      }
  };

  const total = ACHIEVEMENTS_DB.length;
  const unlocked = profile.unlockedAchievements.length;
  const percentage = Math.round((unlocked / total) * 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-3xl bg-black border-4 border-retro-yellow p-1 shadow-retro-lg h-[85vh] flex flex-col">
         <div className="bg-retro-yellow p-3 flex justify-between items-center mb-1 shrink-0">
             <div className="flex items-center gap-2 text-black"><Award className="w-6 h-6" /><h2 className="font-pixel text-lg font-bold">HALL OF FAME</h2></div>
             <button onClick={() => { playSound('click'); onClose(); }} className="bg-black text-retro-yellow hover:bg-white hover:text-black p-1 border-2 border-black transition-colors"><X className="w-5 h-5" /></button>
         </div>
         <div className="bg-slate-900 border-x-2 border-slate-800 p-4 shrink-0">
             <div className="flex justify-between items-end mb-4">
                 <div><p className="text-xs font-mono text-slate-400 mb-1">COMPLETION STATUS</p><div className="flex items-baseline gap-2"><span className="text-3xl font-pixel text-white">{percentage}%</span><span className="text-xs font-mono text-retro-green">({unlocked}/{total})</span></div></div>
                 <div className="w-1/2 h-4 bg-black border border-slate-600 relative"><div className="h-full bg-gradient-to-r from-retro-green to-emerald-400 transition-all duration-1000" style={{ width: `${percentage}%` }}></div></div>
             </div>
             <div className="flex gap-2 border-t border-slate-700 pt-3">
                 <button onClick={() => { playSound('click'); setFilter('ALL'); }} className={`flex-1 py-2 text-xs font-pixel uppercase border-b-2 transition-all ${filter === 'ALL' ? 'border-retro-yellow text-retro-yellow bg-slate-800' : 'border-transparent text-slate-500 hover:text-white'}`}>ALL</button>
                 <button onClick={() => { playSound('click'); setFilter('UNLOCKED'); }} className={`flex-1 py-2 text-xs font-pixel uppercase border-b-2 transition-all ${filter === 'UNLOCKED' ? 'border-retro-green text-retro-green bg-slate-800' : 'border-transparent text-slate-500 hover:text-white'}`}>UNLOCKED</button>
                 <button onClick={() => { playSound('click'); setFilter('LOCKED'); }} className={`flex-1 py-2 text-xs font-pixel uppercase border-b-2 transition-all ${filter === 'LOCKED' ? 'border-retro-red text-retro-red bg-slate-800' : 'border-transparent text-slate-500 hover:text-white'}`}>LOCKED</button>
             </div>
         </div>
         <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-black border-2 border-slate-700">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                 {filteredAchievements.map((achievement) => {
                     const isUnlocked = profile.unlockedAchievements.includes(achievement.id);
                     const tierStyle = getTierColor(achievement.tier);
                     const isHidden = achievement.isSecret && !isUnlocked;
                     return (
                         <div key={achievement.id} className={`relative p-3 border-2 flex items-center gap-3 transition-all min-h-[90px] ${isUnlocked ? `${tierStyle} bg-opacity-20` : 'bg-slate-900 border-slate-800 opacity-60'}`}>
                             <div className={`w-14 h-14 flex flex-col items-center justify-center border-2 shrink-0 ${isUnlocked ? tierStyle : 'bg-black border-slate-700'}`}>{isUnlocked ? <span className="text-2xl">{achievement.icon}</span> : <Lock className="w-5 h-5 text-slate-600" />}</div>
                             <div className="flex-1 min-w-0"><h3 className={`font-pixel text-xs mb-1 truncate ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>{isHidden ? "??? SECRET ???" : achievement.title}</h3><p className="font-mono text-[10px] text-slate-400 leading-tight">{isHidden ? "Unlock to reveal condition." : achievement.description}</p></div>
                             <div className={`absolute top-2 right-2 px-1.5 py-0.5 text-[8px] font-bold font-pixel border bg-black uppercase ${isUnlocked ? tierStyle.replace('bg-', 'text-') : 'text-slate-700 border-slate-700'}`}>{achievement.tier}</div>
                         </div>
                     );
                 })}
             </div>
         </div>
      </div>
    </div>
  );
};
