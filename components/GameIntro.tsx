import React, { useState, useEffect } from 'react';
import { GameMode } from '../types';
import { Button } from './Shared';
import { Play } from 'lucide-react';

interface GameIntroProps {
  gameMode: GameMode;
  onStart: () => void;
}

const FACTS: Record<string, string[]> = {
  [GameMode.SEQUENCE]: [
    "PROSESOR LOGIKA: PENGENALAN POLA.",
    "MENGAKTIFKAN LOBUS FRONTAL...",
    "DETEKSI URUTAN ANGKA.",
    "KECEPATAN ADALAH KUNCI."
  ],
  [GameMode.PROBLEM]: [
    "DIBUTUHKAN BERPIKIR LATERAL.",
    "ANALISIS DATA. TEMUKAN SOLUSI.",
    "ABAIKAN JALUR YANG JELAS.",
    "BERPIKIR KRITIS: AKTIF."
  ],
  [GameMode.WORD]: [
    "DATABASE SEMANTIK: MEMUAT...",
    "HUBUNGKAN KONSEP ABSTRAK.",
    "TES KELANCARAN VERBAL DIMULAI.",
    "TEMUKAN KONEKSINYA."
  ],
  [GameMode.MEMORY]: [
    "BUFFER VISUAL: MEMBERSIHKAN...",
    "MAKSIMALKAN MEMORI KERJA.",
    "GUNAKAN STRATEGI CHUNKING.",
    "PERTAHANKAN INTEGRITAS POLA."
  ],
  [GameMode.N_BACK]: [
    "PEMBARUAN MEMORI KERJA DIPERLUKAN.",
    "LACAK STIMULUS MASA LALU.",
    "FILTER INTERFERENSI.",
    "KECERDASAN CAIR: AKTIF."
  ],
  [GameMode.COLOR_MATCH]: [
    "KONTROL INHIBISI: ONLINE.",
    "TEKAN PEMBACAAN OTOMATIS.",
    "FOKUS PADA PERSEPSI WARNA.",
    "EFEK STROOP TERDETEKSI."
  ],
  [GameMode.MATH_RUSH]: [
    "PROSESOR ARITMATIKA: OVERCLOCKING...",
    "HITUNG DENGAN KECEPATAN MAKSIMAL.",
    "PERTAHANKAN AKURASI DI BAWAH TEKANAN.",
    "SINAPSIS SARAF MENEMBAK CEPAT."
  ],
  [GameMode.ANAGRAM]: [
    "DEKRIPSI LINGUISTIK: DIMULAI.",
    "SUSUN ULANG KARAKTER.",
    "AKSES BANK KOSAKATA.",
    "KECEPATAN PEMROSESAN VERBAL."
  ],
  [GameMode.VISUAL_SEARCH]: [
    "PINDAI KORTEKS VISUAL: DIMULAI.",
    "ISOLASI ANOMALI.",
    "MEMINDAI SEKTOR GRID...",
    "TES ATENSI SELEKTIF."
  ],
  [GameMode.NAVIGATION]: [
    "ORIENTASI SPASIAL: KALIBRASI...",
    "PEMETAAN KOORDINAT VIRTUAL.",
    "PERBARUI VEKTOR ARAH.",
    "SKETSA VISUOSPASIAL AKTIF."
  ],
  [GameMode.TASK_SWITCH]: [
    "PROTOKOL MULTITASKING: DIMULAI.",
    "FLEKSIBILITAS KOGNITIF DIPERLUKAN.",
    "ADAPTASI PERUBAHAN ATURAN.",
    "HINDARI KESALAHAN PERSEVERASI."
  ]
};

export const GameIntro: React.FC<GameIntroProps> = ({ gameMode, onStart }) => {
  const [countdown, setCountdown] = useState(3);
  const [fact, setFact] = useState("");

  useEffect(() => {
    const modeFacts = FACTS[gameMode] || FACTS[GameMode.PROBLEM];
    setFact(modeFacts[Math.floor(Math.random() * modeFacts.length)]);

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameMode]);

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/95">
      <div className="w-full max-w-md border-4 border-retro-green bg-black p-1 shadow-[0_0_20px_rgba(51,255,0,0.2)]">
        <div className="border-2 border-dashed border-slate-700 p-6 flex flex-col items-center text-center">
            
            <h2 className="text-xl md:text-2xl font-pixel text-white mb-6 uppercase animate-pulse">
                BRIEFING MISI
            </h2>

            <div className="w-full bg-slate-900 border border-slate-600 p-4 mb-8 font-mono text-retro-green min-h-[100px] flex items-center justify-center">
                <p className="typing-effect text-sm md:text-base">
                  {">"} {fact}<span className="animate-blink">_</span>
                </p>
            </div>

            <div className="mb-6">
                {countdown > 0 ? (
                    <div className="text-6xl font-pixel text-retro-yellow animate-bounce">
                        {countdown}
                    </div>
                ) : (
                    <Button onClick={onStart} className="w-full py-4 text-lg md:text-xl animate-blink bg-retro-red border-retro-red text-white">
                        MULAI MISI <Play className="w-5 h-5 ml-2 fill-current" />
                    </Button>
                )}
            </div>
            
            {countdown > 0 && <div className="text-xs font-mono text-slate-500">MEMUAT MODUL NEURO...</div>}
        </div>
      </div>
    </div>
  );
};