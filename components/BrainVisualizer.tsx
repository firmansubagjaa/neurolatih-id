
import React from 'react';

interface BrainVisualizerProps {
  activeRegion: string | null;
}

export const BrainVisualizer: React.FC<BrainVisualizerProps> = ({ activeRegion }) => {
  // Determine which part is active based on the region string
  const isActive = (keys: string[]) => {
    if (!activeRegion) return false;
    return keys.some(k => activeRegion.includes(k));
  };

  const regions = {
    pfc: isActive(['Prefrontal', 'Frontal']), // Front
    parietal: isActive(['Parietal']), // Top Back
    temporal: isActive(['Hippocampus', 'Temporal']), // Bottom Middle
    acc: isActive(['Cingulate', 'Anterior']), // Deep Center
    language: isActive(['Broca', 'Wernicke']), // Side Junction
    occipital: isActive(['Occipital', 'Visual']), // Back (if needed later)
  };

  // Colors
  const defaultColor = "#1e293b"; // slate-800
  const defaultStroke = "#334155"; // slate-700
  
  // Helper to get class
  const getClass = (active: boolean) => 
    active 
      ? "fill-retro-green/20 stroke-retro-green animate-pulse drop-shadow-[0_0_10px_rgba(74,222,128,0.5)]" 
      : "fill-slate-900/50 stroke-slate-700 hover:fill-slate-800 hover:stroke-slate-500 transition-colors";

  return (
    <div className="relative w-full aspect-square max-w-[300px] mx-auto flex items-center justify-center bg-black border-2 border-slate-700 rounded-lg p-4 shadow-inner">
      {/* Grid Background */}
      <div className="absolute inset-0 opacity-20 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#334155 1px, transparent 1px), linear-gradient(90deg, #334155 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
      </div>

      <svg viewBox="0 0 300 250" className="w-full h-full z-10">
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>

        {/* BRAIN STEM & CEREBELLUM (Static Base) */}
        <path d="M 140,200 Q 140,240 160,240 Q 180,240 180,200" fill="none" stroke={defaultStroke} strokeWidth="2" />
        <path d="M 180,180 Q 240,180 240,210 Q 240,230 200,230 Q 180,230 170,210" className="fill-slate-900 stroke-slate-700" strokeWidth="2" />

        {/* 1. PREFRONTAL CORTEX (Front) */}
        <path 
          d="M 130,60 Q 60,60 60,130 Q 60,180 130,180 L 130,60 Z"
          className={getClass(regions.pfc)}
          strokeWidth="2"
        />

        {/* 2. PARIETAL LOBE (Top Back) */}
        <path 
          d="M 130,60 L 200,60 Q 240,60 240,120 L 130,120 L 130,60 Z"
          className={getClass(regions.parietal)}
          strokeWidth="2"
        />

        {/* 3. TEMPORAL LOBE / HIPPOCAMPUS AREA (Bottom Side) */}
        <path 
          d="M 130,120 L 220,120 Q 220,180 160,180 Q 130,180 130,150 Z"
          className={getClass(regions.temporal)}
          strokeWidth="2"
        />

        {/* 4. OCCIPITAL LOBE (Back) - Usually Visual */}
        <path 
          d="M 200,60 L 220,120 L 240,120 Q 250,90 200,60 Z"
          className={getClass(regions.occipital || isActive(['Parietal']))} // Grouped with parietal for visual simplicity if not specific
          strokeWidth="2"
          opacity="0.5"
        />

        {/* SPECIAL HIGHLIGHTS (Overlays) */}

        {/* ACC (Deep Center) */}
        {regions.acc && (
          <ellipse cx="140" cy="100" rx="25" ry="15" className="fill-retro-yellow/40 stroke-retro-yellow animate-ping" />
        )}
        
        {/* BROCA/WERNICKE (Language Loop) */}
        {regions.language && (
          <path d="M 110,140 Q 130,120 150,140" fill="none" stroke="#f472b6" strokeWidth="4" strokeLinecap="round" className="animate-pulse" />
        )}

        {/* LABELS (Dynamic) */}
        <text x="150" y="240" textAnchor="middle" fill="#64748b" fontSize="10" fontFamily="monospace">SAGITTAL VIEW</text>
        
        {activeRegion && (
          <g transform="translate(150, 20)">
             <rect x="-70" y="-15" width="140" height="20" fill="black" stroke="#4ade80" strokeWidth="1" />
             <text x="0" y="0" textAnchor="middle" fill="#4ade80" fontSize="10" fontFamily="monospace" dy="3">
               {activeRegion.split(' ')[0]} ACTIVE
             </text>
          </g>
        )}
      </svg>
    </div>
  );
};
