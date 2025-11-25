
import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { BrainModal } from '../BrainModal';
import { Brain, FileText, Network, Database, ChevronRight, Microscope, Info, Layers } from 'lucide-react';
import { Language } from '../../types';
import { getTranslation } from '../../services/languageService';
import { playSound } from '../../services/audioService';

interface AboutScreenProps {
  onBack: () => void;
  language: Language;
}

export const AboutScreen: React.FC<AboutScreenProps> = ({ onBack, language }) => {
  const t = (key: string) => getTranslation(language, `about.${key}`);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showBrainModal, setShowBrainModal] = useState(false);

  const corticalMapping = [
    {
      area: "Prefrontal Cortex (PFC)",
      func: "Executive Function & Working Memory",
      modules: ["N-BACK", "SEQUENCE", "PATHFINDING"]
    },
    {
      area: "Hippocampus",
      func: "Episodic Memory & Spatial Navigation",
      modules: ["PATTERN", "NAVIGATION"]
    },
    {
      area: "Anterior Cingulate Cortex",
      func: "Inhibition & Conflict Monitoring",
      modules: ["STROOP (COLOR)", "TASK SWITCH"]
    },
    {
      area: "Parietal Lobe",
      func: "Visual Attention & Processing",
      modules: ["VISUAL SEARCH", "MATH RUSH"]
    },
    {
      area: "Broca's / Wernicke's Area",
      func: "Language Production & Comprehension",
      modules: ["ANAGRAM", "WORD LINK"]
    }
  ];

  const references = [
    "Jaeggi, S. M., et al. (2008). Improving fluid intelligence with training on working memory. PNAS.",
    "Stroop, J. R. (1935). Studies of interference in serial verbal reactions. Journal of Experimental Psychology.",
    "Stern, Y. (2002). What is cognitive reserve? Theory and research application of the reserve concept. Journal of the International Neuropsychological Society.",
    "Anguera, J. A., et al. (2013). Video game training enhances cognitive control in older adults. Nature."
  ];

  const handleRegionClick = (area: string) => {
      playSound('pop');
      setSelectedRegion(area);
      setShowBrainModal(true);
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in pb-20 px-4">
      <BrainModal 
        isOpen={showBrainModal} 
        onClose={() => setShowBrainModal(false)} 
        activeRegion={selectedRegion} 
      />

      {/* Header */}
      <div className="mt-16 mb-8 border-b-4 border-retro-cyan pb-4 flex items-center justify-between">
        <div>
            <h1 className="text-3xl md:text-5xl font-pixel text-retro-cyan text-shadow-retro mb-2">
              {t('title')}
            </h1>
            <div className="flex items-center gap-2 text-slate-400 font-mono text-xs md:text-sm">
                <Database className="w-4 h-4" />
                <span>NEURO_LATIH_V8 // SECURE_ACCESS</span>
            </div>
        </div>
        <Brain className="w-12 h-12 md:w-16 md:h-16 text-retro-cyan animate-pulse" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Abstract & Table (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
            
            {/* Abstract */}
            <Card className="bg-slate-900/80 border-l-4 border-l-retro-green">
                <div className="flex items-center gap-2 mb-3 border-b border-slate-700 pb-2">
                    <FileText className="w-5 h-5 text-retro-green" />
                    <h2 className="font-pixel text-sm text-retro-green">{t('abstract')}</h2>
                </div>
                <p className="font-mono text-slate-300 text-sm md:text-base leading-relaxed text-justify">
                    {t('abstractText')}
                </p>
            </Card>

            {/* Mapping Table */}
            <Card className="bg-black border-2 border-slate-700">
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <Network className="w-5 h-5 text-retro-pink" />
                        <h2 className="font-pixel text-sm text-retro-pink">{t('mapping')}</h2>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono animate-pulse">
                        <Info className="w-3 h-3" /> KLIK BARIS UNTUK VISUALISASI
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full font-mono text-xs md:text-sm text-left">
                        <thead>
                            <tr className="border-b border-slate-600 text-slate-500">
                                <th className="py-2 px-2">NEURAL REGION</th>
                                <th className="py-2 px-2">FUNCTION</th>
                                <th className="py-2 px-2 text-right">MODULES</th>
                            </tr>
                        </thead>
                        <tbody>
                            {corticalMapping.map((item, idx) => {
                                return (
                                    <tr 
                                        key={idx} 
                                        onClick={() => handleRegionClick(item.area)}
                                        className="border-b border-slate-800 cursor-pointer transition-all duration-200 hover:bg-slate-900 hover:border-l-4 hover:border-l-retro-pink group"
                                    >
                                        <td className="py-3 px-2 font-bold text-retro-cyan group-hover:text-retro-pink">
                                            {item.area}
                                        </td>
                                        <td className="py-3 px-2 text-slate-300">{item.func}</td>
                                        <td className="py-3 px-2 text-right">
                                            <div className="flex flex-wrap justify-end gap-1">
                                                {item.modules.map((m, i) => (
                                                    <span key={i} className="bg-slate-800 text-[10px] px-1 border border-slate-600 text-white">
                                                        {m}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>

        </div>

        {/* Right Column: Expected Output & References (5 cols) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col">
            
            {/* Expected Output */}
            <Card className="bg-slate-900/80 border-l-4 border-l-retro-yellow flex-1">
                <div className="flex items-center gap-2 mb-3">
                    <Microscope className="w-5 h-5 text-retro-yellow" />
                    <h2 className="font-pixel text-sm text-retro-yellow">{t('output')}</h2>
                </div>
                <p className="font-mono text-slate-300 text-xs md:text-sm leading-relaxed mb-4">
                    {t('outputText')}
                </p>
                <div className="grid grid-cols-2 gap-2">
                    <Badge color="bg-retro-green text-black">AGILITY</Badge>
                    <Badge color="bg-retro-cyan text-black">FOCUS</Badge>
                    <Badge color="bg-retro-pink text-black">MEMORY</Badge>
                    <Badge color="bg-retro-yellow text-black">LOGIC</Badge>
                </div>
            </Card>

            {/* References */}
            <Card className="bg-black border-2 border-slate-800 p-4 h-fit">
                <div className="flex items-center gap-2 mb-3">
                    <Layers className="w-4 h-4 text-slate-500" />
                    <h2 className="font-pixel text-xs text-slate-500">{t('references')}</h2>
                </div>
                <ul className="space-y-3">
                    {references.map((ref, i) => (
                        <li key={i} className="text-[10px] font-mono text-slate-400 border-l-2 border-slate-700 pl-2 leading-tight hover:text-white hover:border-retro-cyan transition-colors cursor-default">
                            {ref}
                        </li>
                    ))}
                </ul>
            </Card>

            <Button onClick={onBack} className="w-full py-4">
                <ChevronRight className="w-4 h-4 rotate-180 mr-2" /> {t('back')}
            </Button>

        </div>
      </div>
    </div>
  );
};
