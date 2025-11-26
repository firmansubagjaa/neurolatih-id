
import React from 'react';
import { GameMode } from '../types';
import { Button } from './ui/Button';
import { X, Brain, Microscope, Target, Activity, ArrowRight } from 'lucide-react';
import { playSound } from '../services/audioService';

interface GameInfoModalProps {
  isOpen: boolean;
  gameMode: GameMode | null;
  onProceed: () => void;
  onClose: () => void;
}

const GAME_RESEARCH_DATA: Record<string, { title: string; cortex: string; function: string; description: string; benefit: string; }> = {
  [GameMode.MEMORY]: { title: "PATTERN RECALL", cortex: "Hippocampus & Parietal", function: "Visuospatial Sketchpad", description: "Latihan ini menargetkan kemampuan otak untuk menyimpan informasi visual spasial sementara.", benefit: "Navigasi & visualisasi objek." },
  [GameMode.SEQUENCE]: { title: "LOGIC SEQUENCE", cortex: "Prefrontal Cortex", function: "Fluid Intelligence (Gf)", description: "Mengidentifikasi pola abstrak menuntut otak untuk melakukan penalaran induktif.", benefit: "Pemecahan masalah kompleks." },
  [GameMode.PROBLEM]: { title: "RIDDLES / LATERAL", cortex: "Temporal Lobe", function: "Semantic Memory", description: "Memecahkan teka-teki membutuhkan koneksi antar konsep yang tidak berhubungan.", benefit: "Kreativitas & fleksibilitas." },
  [GameMode.WORD]: { title: "WORD ASSOCIATION", cortex: "Broca's Area", function: "Verbal Fluency", description: "Mengelompokkan kata melatih akses cepat ke 'lexicon' mental.", benefit: "Komunikasi verbal." },
  [GameMode.N_BACK]: { title: "N-BACK MEMORY", cortex: "Dorsolateral PFC", function: "Working Memory Updating", description: "Tugas kognitif standar emas untuk IQ Cair. Memaksa update informasi konstan.", benefit: "Fokus & multitasking." },
  [GameMode.COLOR_MATCH]: { title: "STROOP TEST", cortex: "Anterior Cingulate", function: "Inhibitory Control", description: "Melatih otak menekan respon otomatis untuk memilih respon yang benar.", benefit: "Kontrol diri & fokus." },
  [GameMode.MATH_RUSH]: { title: "MATH RUSH", cortex: "Intraparietal Sulcus", function: "Numerical Processing", description: "Aritmatika cepat melatih efisiensi pemrosesan numerik.", benefit: "Perhitungan mental." },
  [GameMode.ANAGRAM]: { title: "ANAGRAM", cortex: "Occipito-Temporal", function: "Orthographic Processing", description: "Memanipulasi huruf melatih fleksibilitas leksikal.", benefit: "Kemampuan membaca." },
  [GameMode.VISUAL_SEARCH]: { title: "VISUAL SEARCH", cortex: "Superior Colliculus", function: "Selective Attention", description: "Mencari target di antara distractor melatih 'Top-Down Attention'.", benefit: "Ketelitian." },
  [GameMode.NAVIGATION]: { title: "SPATIAL NAV", cortex: "Entorhinal Cortex", function: "Mental Rotation", description: "Simulasi navigasi mengaktifkan 'Grid Cells'. Melatih rotasi mental.", benefit: "Orientasi arah." },
  [GameMode.TASK_SWITCH]: { title: "TASK SWITCHING", cortex: "Basal Ganglia", function: "Cognitive Flexibility", description: "Kemampuan beralih antar aturan berbeda. Meminimalkan 'Switch Cost'.", benefit: "Adaptasi cepat." },
  [GameMode.PATHFINDING]: { title: "PATHFINDING", cortex: "Frontal Lobe", function: "Strategic Planning", description: "Merencanakan rute sebelum bertindak melibatkan fungsi eksekutif.", benefit: "Logika algoritmik." }
};

export const GameInfoModal: React.FC<GameInfoModalProps> = ({ isOpen, gameMode, onProceed, onClose }) => {
  if (!isOpen || !gameMode) return null;
  const data = GAME_RESEARCH_DATA[gameMode] || { title: "UNKNOWN", cortex: "Unknown", function: "General", description: "Modul pelatihan umum.", benefit: "Kesehatan otak." };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-black border-4 border-retro-cyan p-1 shadow-[0_0_40px_rgba(34,211,238,0.15)] transform transition-all max-h-[90vh] flex flex-col">
        <div className="bg-retro-cyan p-3 flex justify-between items-start gap-2 text-black mb-1 shrink-0">
            <div className="flex items-start gap-2 flex-1 min-w-0"><Brain className="w-6 h-6 mt-0.5 animate-pulse shrink-0" /><h2 className="font-pixel text-lg md:text-xl font-bold tracking-widest leading-tight"><span className="opacity-70 mr-2">NEURAL DB:</span>{data.title}</h2></div>
            <button onClick={() => { playSound('click'); onClose(); }} className="hover:bg-white hover:text-black p-1 transition-colors shrink-0"><X className="w-6 h-6" /></button>
        </div>
        <div className="bg-slate-900 border-2 border-slate-700 p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 relative">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none"><Brain className="w-64 h-64 text-retro-cyan" /></div>
            <div className="flex items-start gap-3 md:gap-4 z-10"><div className="p-2 md:p-3 bg-slate-800 border border-retro-cyan text-retro-cyan shrink-0"><Target className="w-8 h-8" /></div><div><h3 className="text-retro-cyan font-pixel text-xs mb-1 uppercase">Target Area</h3><p className="text-white font-mono text-xl font-bold leading-tight">{data.cortex}</p></div></div>
            <div className="flex items-start gap-3 md:gap-4 z-10"><div className="p-2 md:p-3 bg-slate-800 border border-retro-yellow text-retro-yellow shrink-0"><Microscope className="w-8 h-8" /></div><div><h3 className="text-retro-yellow font-pixel text-xs mb-1 uppercase">Fungsi Kognitif</h3><p className="text-white font-mono text-xl font-bold leading-tight">{data.function}</p></div></div>
            <div className="bg-black/50 border-l-4 border-white p-4 z-10"><p className="text-slate-300 font-mono text-sm leading-relaxed">"{data.description}"</p></div>
            <div className="flex items-center gap-3 z-10 bg-emerald-900/20 p-3 border border-emerald-500/30 rounded"><Activity className="w-5 h-5 text-emerald-400 shrink-0" /><p className="text-emerald-100 font-mono text-sm leading-tight"><span className="font-bold text-emerald-400">IMPACT: </span> {data.benefit}</p></div>
        </div>
        <div className="p-4 bg-slate-900 border-t-2 border-slate-700 shrink-0"><Button onClick={() => { playSound('correct'); onProceed(); }} className="w-full py-4 text-lg animate-pulse justify-center">AKSES SIMULASI <ArrowRight className="w-5 h-5 ml-2" /></Button></div>
      </div>
    </div>
  );
};
