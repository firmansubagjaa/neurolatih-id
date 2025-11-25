
import React from 'react';
import { X, Award, Lock } from 'lucide-react';
import { Achievement, UserProfile } from '../types';
import { ACHIEVEMENTS_DB } from '../services/authService';
import { playSound } from '../services/audioService';

interface AchievementsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
}

export const AchievementsModal: React.FC<AchievementsModalProps> = ({ isOpen, onClose, profile }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl bg-black border-4 border-retro-yellow p-1 shadow-retro-lg h-[80vh] flex flex-col">
         {/* Header */}
         <div className="bg-retro-yellow p-3 flex justify-between items-center mb-1">
             <div className="flex items-center gap-2 text-black">
                 <Award className="w-6 h-6" />
                 <h2 className="font-pixel text-lg font-bold">PENCAPAIAN NEURAL</h2>
             </div>
             <button onClick={() => { playSound('click'); onClose(); }} className="bg-black text-retro-yellow hover:bg-white hover:text-black p-1 border-2 border-black transition-colors">
                 <X className="w-5 h-5" />
             </button>
         </div>

         {/* Content */}
         <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-900 border-2 border-slate-700">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {ACHIEVEMENTS_DB.map((achievement) => {
                     const isUnlocked = profile.unlockedAchievements.includes(achievement.id);
                     
                     return (
                         <div 
                            key={achievement.id} 
                            className={`relative p-4 border-2 flex items-center gap-4 transition-all ${
                                isUnlocked 
                                ? 'bg-black border-retro-yellow shadow-[4px_4px_0_0_rgba(250,204,21,0.2)]' 
                                : 'bg-slate-800 border-slate-700 opacity-60 grayscale'
                            }`}
                         >
                             <div className={`w-12 h-12 flex items-center justify-center text-2xl border-2 rounded-full ${
                                 isUnlocked ? 'bg-retro-yellow/20 border-retro-yellow' : 'bg-slate-700 border-slate-600'
                             }`}>
                                 {isUnlocked ? achievement.icon : <Lock className="w-5 h-5 text-slate-500" />}
                             </div>
                             <div>
                                 <h3 className={`font-pixel text-xs md:text-sm mb-1 ${isUnlocked ? 'text-white' : 'text-slate-400'}`}>
                                     {achievement.title}
                                 </h3>
                                 <p className="font-mono text-xs text-slate-400 leading-tight">
                                     {achievement.description}
                                 </p>
                             </div>
                             {isUnlocked && (
                                 <div className="absolute top-2 right-2 text-[10px] text-retro-yellow font-bold font-pixel bg-black px-1 border border-retro-yellow">
                                     UNLOCKED
                                 </div>
                             )}
                         </div>
                     );
                 })}
             </div>
         </div>
         
         {/* Footer Stats */}
         <div className="p-4 bg-black border-t-2 border-slate-700 flex justify-between items-center text-xs font-mono text-slate-400">
             <span>TOTAL: {ACHIEVEMENTS_DB.length} BADGES</span>
             <span className="text-retro-yellow">TERBUKA: {profile.unlockedAchievements.length}</span>
         </div>
      </div>
    </div>
  );
};
