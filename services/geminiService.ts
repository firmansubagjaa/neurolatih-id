
import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, AIQuestion, WordAssociationQuestion, AnagramQuestion, GameResult, GameMode } from "../types";

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- STATIC FALLBACKS (Minimal offline support) ---
const FALLBACK_RIDDLE = { q: "Aku punya kota tapi tak berumah, punya gunung tapi tak berbatu. Apakah aku?", a: "Peta", o: ["Peta", "Lukisan", "Mimpi", "Bola Dunia"], expl: "Peta menggambarkan fitur geografis tanpa fisik asli." };
const FALLBACK_WORD = { category: "Penghubung Kata", correctWords: ["Kunci", "Inggris", "Pas"], distractors: ["Palu", "Obeng", "Tang"], explanation: "Kata yang bisa disambung dengan 'Kunci', 'Inggris', 'Pas' (Kunci Inggris, Kunci Pas)." };
const FALLBACK_ANAGRAM = { original: "PERSEPSI", scrambled: "SPEIREPS", hint: "Proses mengenali sensasi" };

// --- HELPER UTILITIES ---
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const shuffleArray = <T>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// --- CONTENT GENERATORS ---

export const generateWelcomeMessage = async (): Promise<string> => {
  // Cyberpunk thematic messages - System Boot Logs
  const WELCOME_MESSAGES = [
    "NEURAL_INTERFACE :: CALIBRATING...", 
    "SYSTEM CHECK: CORTICAL FUNCTIONS OPTIMAL.", 
    "WARNING: HIGH COGNITIVE LOAD DETECTED.", 
    "ESTABLISHING SECURE SYNAPTIC UPLINK...",
    "MEMORY BUFFERS CLEARED. READY FOR INPUT.",
    "BIOS VERSION 8.3 LOADED. WELCOME, OPERATOR."
  ];
  return WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
};

export const generateRiddle = async (difficulty: Difficulty): Promise<AIQuestion> => {
  try {
    // Cognitive Domain: Lateral Thinking (Fluid Intelligence)
    // System 2 Thinking: Requires suppressing intuitive but wrong answers.
    const prompt = `Buat 1 teka-teki Logika Lateral (Lateral Thinking Riddle) dalam Bahasa Indonesia.
    Level: ${difficulty}.
    Kriteria:
    - Jangan tebakan anak-anak biasa.
    - Harus membutuhkan pemikiran "out of the box".
    - Jawaban harus logis tapi tidak langsung terlihat.
    
    Output JSON: { "question": "teka-teki", "correctAnswer": "jawaban benar", "distractors": ["salah1", "salah2", "salah3"], "explanation": "logika penyelesaian" }`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                question: { type: Type.STRING },
                correctAnswer: { type: Type.STRING },
                distractors: { type: Type.ARRAY, items: { type: Type.STRING } },
                explanation: { type: Type.STRING }
            }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    if (!data.question) throw new Error("Invalid GenAI Response");

    const options = shuffleArray([data.correctAnswer, ...data.distractors]);
    
    return {
      question: data.question,
      options: options,
      correctAnswerIndex: options.indexOf(data.correctAnswer),
      explanation: data.explanation
    };

  } catch (error) {
    return {
       question: FALLBACK_RIDDLE.q,
       options: FALLBACK_RIDDLE.o,
       correctAnswerIndex: FALLBACK_RIDDLE.o.indexOf(FALLBACK_RIDDLE.a),
       explanation: FALLBACK_RIDDLE.expl
    };
  }
};

export const generateSequencePuzzle = async (difficulty: Difficulty, mode: 'LINEAR' | 'COMPLEX' | 'CHAOS' = 'LINEAR'): Promise<AIQuestion> => {
  // Logic Sequences (Inductive Reasoning)
  // Kept algorithmic for mathematical precision, enhanced complexity logic.
  await delay(400);
  
  let sequence: number[] = [];
  let nextVal = 0;
  let rule = "";
  let options: number[] = [];
  
  const maxStart = difficulty === Difficulty.BEGINNER ? 20 : difficulty === Difficulty.INTERMEDIATE ? 50 : 100;

  if (mode === 'LINEAR') {
    const start = Math.floor(Math.random() * maxStart) + 1;
    const step = Math.floor(Math.random() * 10) + 2;
    sequence = [start, start + step, start + step*2, start + step*3];
    nextVal = start + step * 4;
    rule = `Aritmatika (+${step})`;
  } 
  else if (mode === 'COMPLEX') {
     const type = Math.random();
     if (type < 0.5) {
         // Geometric
         const start = Math.floor(Math.random() * 5) + 2;
         const ratio = Math.floor(Math.random() * 2) + 2;
         sequence = [start, start*ratio, start*ratio*ratio, start*ratio*ratio*ratio];
         nextVal = start*ratio*ratio*ratio*ratio;
         rule = `Geometri (x${ratio})`;
     } else {
         // Fibonacci-esque
         const n1 = Math.floor(Math.random() * 10) + 1;
         const n2 = Math.floor(Math.random() * 10) + 1;
         sequence = [n1, n2, n1+n2, n2+(n1+n2), (n1+n2)+(n2+(n1+n2))].slice(0, 4);
         nextVal = sequence[2] + sequence[3];
         rule = "Penjumlahan 2 angka sebelumnya";
     }
  }
  else {
      // Chaos: Double Interleaved
      const startA = Math.floor(Math.random() * 20);
      const startB = Math.floor(Math.random() * 20) + 50;
      sequence = [startA, startB, startA + 2, startB - 2, startA + 4, startB - 4];
      nextVal = startA + 6; // Next is part of sequence A
      rule = "Dua pola selang-seling (+2 dan -2)";
  }

  options.push(nextVal);
  while(options.length < 4) {
    const offset = Math.floor(Math.random() * 20) - 10 || 1;
    const fake = nextVal + offset;
    if (fake !== nextVal && !options.includes(fake)) options.push(fake);
  }
  options = shuffleArray(options);

  return {
    question: `${sequence.join(', ')}, ...`,
    options: options.map(String),
    correctAnswerIndex: options.indexOf(nextVal),
    explanation: rule
  };
};

export const generateWordAssociation = async (difficulty: Difficulty): Promise<WordAssociationQuestion> => {
  try {
      // Cognitive Domain: Semantic Network / Remote Associates Test (RAT)
      // Task: Find connections between concepts.
      const prompt = `Buat permainan Asosiasi Kata (Remote Associates) dalam Bahasa Indonesia.
      Level: ${difficulty}.
      Instruksi: Berikan Kategori atau Kata Kunci, lalu 3 kata yang berhubungan erat dengan kunci tersebut, dan 3 distractor yang sekilas mirip tapi salah kategori.
      
      JSON: { "category": "Tema Utama", "correctWords": ["benar1", "benar2", "benar3"], "distractors": ["salah1", "salah2", "salah3"], "explanation": "alasan asosiasi" }`;

      const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                category: { type: Type.STRING },
                correctWords: { type: Type.ARRAY, items: { type: Type.STRING } },
                distractors: { type: Type.ARRAY, items: { type: Type.STRING } },
                explanation: { type: Type.STRING }
            }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    if (!data.category) throw new Error("Invalid");

    return {
        category: data.category,
        correctWords: data.correctWords.slice(0, 3),
        distractors: data.distractors.slice(0, 3),
        explanation: data.explanation
    };

  } catch (e) {
      return FALLBACK_WORD;
  }
};

export const generateAnagram = async (difficulty: Difficulty): Promise<AnagramQuestion> => {
   try {
      // Cognitive Domain: Lexical Access & Orthographic Processing
      const length = difficulty === Difficulty.BEGINNER ? "5" : difficulty === Difficulty.INTERMEDIATE ? "7" : "9";
      
      const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Pilih 1 kata benda/kerja umum dalam Bahasa Indonesia dengan panjang ${length} huruf.
      Berikan definisi kamus sebagai hint.
      JSON: { "word": "KATA", "hint": "Definisi singkat" }`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                word: { type: Type.STRING },
                hint: { type: Type.STRING }
            }
        }
      }
    });

    const data = JSON.parse(response.text || "{}");
    if (!data.word) throw new Error("Invalid");
    
    const original = data.word.toUpperCase();
    let scrambled = shuffleArray(original.split('')).join('');
    // Ensure scramble isn't original
    let attempts = 0;
    while(scrambled === original && attempts < 5) {
        scrambled = shuffleArray(original.split('')).join('');
        attempts++;
    }

    return {
        original,
        scrambled,
        hint: data.hint
    };
   } catch (e) {
       return FALLBACK_ANAGRAM;
   }
};

export const generateGameFeedback = async (result: GameResult): Promise<string> => {
  try {
      const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Roleplay sebagai "Neural Interface System AI" (Cyberpunk/Sci-Fi Persona).
      Analisis hasil performa Operator:
      - Module: ${result.gameMode}
      - Score: ${result.score}
      - Accuracy: ${result.accuracy}%
      - Difficulty: ${result.difficulty}
      
      Berikan laporan diagnostik singkat (maks 2 kalimat). Gunakan istilah teknis seperti "Synaptic latency", "Processing efficiency", "Buffer overflow", dll.
      Jika skor bagus, katakan sistem optimal. Jika buruk, sarankan kalibrasi ulang atau istirahat.`,
    });
    return response.text;
  } catch (e) {
      return "DIAGNOSTIC COMPLETE. DATA ARCHIVED TO LOCAL DRIVE.";
  }
};
