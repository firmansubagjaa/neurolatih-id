
import React from 'react';
import { GameMode } from '../types';
import { Button } from './Shared';
import { X, Brain, Microscope, Target, Activity, ArrowRight } from 'lucide-react';
import { playSound } from '../services/audioService';

interface GameInfoModalProps {
  isOpen: boolean;
  gameMode: GameMode | null;
  onProceed: () => void;
  onClose: () => void;
}

const GAME_RESEARCH_DATA: Record<string, {
  title: string;
  cortex: string;
  function: string;
  description: string;
  benefit: string;
}> = {
  [GameMode.MEMORY]: {
    title: "PATTERN RECALL",
    cortex: "Hippocampus & Parietal Lobe",
    function: "Visuospatial Sketchpad",
    description: "Latihan ini menargetkan kemampuan otak untuk menyimpan dan memanipulasi informasi visual spasial sementara. Menguji kapasitas penyimpanan jangka pendek visual.",
    benefit: "Meningkatkan navigasi & visualisasi objek."
  },
  [GameMode.SEQUENCE]: {
    title: "LOGIC SEQUENCE",
    cortex: "Prefrontal Cortex (PFC)",
    function: "Fluid Intelligence (Gf)",
    description: "Mengidentifikasi pola abstrak menuntut otak untuk melakukan penalaran induktif. Melatih jaringan frontoparietal untuk pemecahan masalah baru.",
    benefit: "Analisa tren & pemecahan masalah kompleks."
  },
  [GameMode.PROBLEM]: {
    title: "RIDDLES / LATERAL",
    cortex: "Temporal Lobe & Frontal Lobe",
    function: "Semantic Memory & Lateral Thinking",
    description: "Memecahkan teka-teki membutuhkan koneksi antar konsep yang tidak berhubungan (asosiasi jarak jauh). Menstimulasi berpikir 'di luar kotak'.",
    benefit: "Kreativitas & fleksibilitas berpikir."
  },
  [GameMode.WORD]: {
    title: "WORD ASSOCIATION",
    cortex: "Wernicke's & Broca's Area",
    function: "Verbal Fluency",
    description: "Mengelompokkan kata melatih akses cepat ke 'lexicon' (kamus mental) dan jaringan semantik. Memperkuat jalur saraf linguistik.",
    benefit: "Komunikasi & artikulasi verbal."
  },
  [GameMode.N_BACK]: {
    title: "N-BACK MEMORY",
    cortex: "Dorsolateral Prefrontal Cortex",
    function: "Working Memory Updating",
    description: "Tugas kognitif standar emas. Memaksa otak untuk terus menerus memperbarui informasi dan membuang data lama yang tidak relevan.",
    benefit: "IQ Cair, fokus & multitasking."
  },
  [GameMode.COLOR_MATCH]: {
    title: "STROOP TEST",
    cortex: "Anterior Cingulate Cortex",
    function: "Inhibitory Control",
    description: "Melatih otak untuk menekan respon otomatis (membaca kata) dan memilih respon yang kurang dominan (menyebut warna).",
    benefit: "Kontrol diri & fokus di situasi bising."
  },
  [GameMode.MATH_RUSH]: {
    title: "MATH RUSH",
    cortex: "Intraparietal Sulcus (IPS)",
    function: "Numerical Processing Speed",
    description: "Aritmatika cepat melatih efisiensi pemrosesan numerik dan mengurangi beban kognitif saat berhadapan dengan angka.",
    benefit: "Perhitungan mental cepat."
  },
  [GameMode.ANAGRAM]: {
    title: "ANAGRAM",
    cortex: "Left Occipito-Temporal",
    function: "Orthographic Processing",
    description: "Memanipulasi urutan huruf melatih fleksibilitas leksikal dan pemrosesan ortografis (visual bentuk kata).",
    benefit: "Kosakata & kemampuan membaca cepat."
  },
  [GameMode.VISUAL_SEARCH]: {
    title: "VISUAL SEARCH",
    cortex: "Superior Colliculus",
    function: "Selective Attention",
    description: "Mencari target di antara distractor melatih 'Top-Down Attention'. Menyaring informasi visual yang tidak relevan dengan cepat.",
    benefit: "Ketelitian mencari barang & mengemudi."
  },
  [GameMode.NAVIGATION]: {
    title: "SPATIAL NAV",
    cortex: "Entorhinal Cortex",
    function: "Mental Rotation",
    description: "Simulasi navigasi mengaktifkan 'Grid Cells' di otak. Melatih kemampuan rotasi mental objek dan orientasi arah mata angin.",
    benefit: "Tidak mudah tersesat & membaca peta."
  },
  [GameMode.TASK_SWITCH]: {
    title: "TASK SWITCHING",
    cortex: "Basal Ganglia",
    function: "Cognitive Flexibility",
    description: "Kemampuan beralih antar aturan berbeda. Melatih otak meminimalkan 'Switch Cost' (waktu jeda saat ganti tugas).",
    benefit: "Multitasking efisien & adaptasi cepat."
  },
  [GameMode.PATHFINDING]: {
    title: "PATHFINDING",
    cortex: "Frontal Lobe (Executive)",
    function: "Strategic Planning",
    description: "Merencanakan rute sebelum bertindak melibatkan fungsi eksekutif: simulasi masa depan dan pengurutan langkah logis.",
    benefit: "Perencanaan proyek & logika algoritmik."
  }
};

export const GameInfoModal: React.FC<GameInfoModalProps> = ({ isOpen, gameMode, onProceed, onClose }) => {
  if (!isOpen || !gameMode) return null;

  const data = GAME_RESEARCH_DATA[gameMode] || {
    title: "UNKNOWN MODULE",
    cortex: "Unknown",
    function: "General Cognition",
    description: "Modul pelatihan umum.",
    benefit: "Kesehatan otak."
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-black border-4 border-retro-cyan p-1 shadow-[0_0_40px_rgba(34,211,238,0.15)] transform transition-all max-h-[90vh] flex flex-col">
        
        {/* Header - Responsive Flex Layout */}
        <div className="bg-retro-cyan p-3 flex justify-between items-start gap-2 text-black mb-1 shrink-0">
            <div className="flex items-start gap-2 flex-1 min-w-0">
                <Brain className="w-5 h-5 md:w-6 md:h-6 mt-0.5 animate-pulse shrink-0" />
                {/* Allow text wrapping and flexible sizing */}
                <h2 className="font-pixel text-xs sm:text-sm md:text-xl font-bold tracking-widest leading-tight break-words">
                    <span className="block sm:inline opacity-70 mr-1">NEURAL DB:</span>
                    {data.title}
                </h2>
            </div>
            <button onClick={() => { playSound('click'); onClose(); }} className="hover:bg-white hover:text-black p-1 transition-colors shrink-0">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Scrollable Content */}
        <div className="bg-slate-900 border-2 border-slate-700 p-4 md:p-8 flex-1 overflow-y-auto custom-scrollbar flex flex-col gap-4 relative">
            {/* Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
                <Brain className="w-48 h-48 md:w-64 md:h-64 text-retro-cyan" />
            </div>

            {/* Target Cortex */}
            <div className="flex items-start gap-3 md:gap-4 z-10">
                <div className="p-2 md:p-3 bg-slate-800 border border-retro-cyan text-retro-cyan shrink-0">
                    <Target className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                    <h3 className="text-retro-cyan font-pixel text-[10px] md:text-xs mb-1 uppercase">Target Area Saraf</h3>
                    <p className="text-white font-mono text-base md:text-xl font-bold leading-tight">{data.cortex}</p>
                </div>
            </div>

            {/* Cognitive Function */}
            <div className="flex items-start gap-3 md:gap-4 z-10">
                <div className="p-2 md:p-3 bg-slate-800 border border-retro-yellow text-retro-yellow shrink-0">
                    <Microscope className="w-6 h-6 md:w-8 md:h-8" />
                </div>
                <div>
                    <h3 className="text-retro-yellow font-pixel text-[10px] md:text-xs mb-1 uppercase">Fungsi Kognitif</h3>
                    <p className="text-white font-mono text-base md:text-xl font-bold leading-tight">{data.function}</p>
                </div>
            </div>

            {/* Description Box */}
            <div className="bg-black/50 border-l-4 border-white p-3 md:p-4 z-10">
                <p className="text-slate-300 font-mono text-xs md:text-base leading-relaxed">
                    "{data.description}"
                </p>
            </div>

            {/* Benefit */}
            <div className="flex items-center gap-3 z-10 bg-emerald-900/20 p-3 border border-emerald-500/30 rounded">
                <Activity className="w-5 h-5 text-emerald-400 shrink-0" />
                <p className="text-emerald-100 font-mono text-xs md:text-sm leading-tight">
                    <span className="font-bold text-emerald-400 block md:inline mb-1 md:mb-0">IMPACT: </span> {data.benefit}
                </p>
            </div>
        </div>

        {/* Footer Action */}
        <div className="p-4 bg-slate-900 border-t-2 border-slate-700 shrink-0">
            <Button onClick={() => { playSound('correct'); onProceed(); }} className="w-full py-3 md:py-4 text-base md:text-lg animate-pulse justify-center">
                AKSES SIMULASI <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
        </div>
      </div>
    </div>
  );
};
