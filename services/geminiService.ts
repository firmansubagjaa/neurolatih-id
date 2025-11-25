
import { Difficulty, AIQuestion, WordAssociationQuestion, AnagramQuestion, GameResult, GameMode } from "../types";

// --- DATABASE SOAL LOKAL (BAHASA INDONESIA) ---

const RIDDLES_DB = [
  { q: "Aku punya leher tapi tidak punya kepala. Aku punya lengan tapi tidak punya tangan. Siapakah aku?", a: "Baju", o: ["Baju", "Botol", "Kursi", "Gelas"], expl: "Baju memiliki kerah (leher) dan lengan baju." },
  { q: "Makin banyak yang kamu ambil, makin besar aku. Apakah aku?", a: "Lubang", o: ["Lubang", "Hutang", "Ilmu", "Makanan"], expl: "Menggali lubang membuatnya semakin besar." },
  { q: "Aku selalu datang, tapi tidak pernah sampai. Siapakah aku?", a: "Besok", o: ["Besok", "Masa Lalu", "Angin", "Mimpi"], expl: "Saat besok tiba, ia menjadi hari ini." },
  { q: "Apa yang naik tapi tidak pernah turun?", a: "Umur", o: ["Umur", "Gaji", "Balon", "Pesawat"], expl: "Umur seseorang hanya bertambah." },
  { q: "Aku punya kota, tapi tak punya rumah. Aku punya gunung, tapi tak punya pohon. Aku punya air, tapi tak punya ikan. Apa aku?", a: "Peta", o: ["Peta", "Globe", "Lukisan", "Mimpi"], expl: "Peta menggambarkan lokasi tanpa objek fisik nyata." },
  { q: "Apa yang bisa dipecahkan tanpa disentuh?", a: "Janji", o: ["Janji", "Gelas", "Telur", "Rekor"], expl: "Janji bisa diingkari (dipecahkan) lewat kata-kata." },
  { q: "Orang membeliku untuk makan, tapi tidak pernah memakan aku. Apa aku?", a: "Piring", o: ["Piring", "Nasi", "Sendok", "Buah"], expl: "Piring adalah wadah makan, bukan makanan." },
  { q: "Jika kamu menyebut namaku, aku akan hilang. Siapakah aku?", a: "Kesunyian", o: ["Kesunyian", "Kegelapan", "Bayangan", "Angin"], expl: "Suara memecah kesunyian." },
  { q: "Apa yang punya 13 jantung tapi tidak bernyawa?", a: "Kartu Remi", o: ["Kartu Remi", "Rumah Sakit", "Gurita", "Boneka"], expl: "Satu set kartu remi memiliki 13 kartu hati (Heart)." },
  { q: "Aku berat jika kering, tapi ringan jika basah (secara konsep). Tapi secara fisik, aku penuh lubang tapi bisa menahan air. Apa aku?", a: "Spons", o: ["Spons", "Ember", "Handuk", "Jaring"], expl: "Spons menyerap dan menahan air." }
];

const WORD_ASSOC_DB = [
  { cat: "Alat Tulis", correct: ["Pena", "Pensil", "Penghapus"], dist: ["Sendok", "Piring", "Gelas"], expl: "Kelompok alat untuk menulis." },
  { cat: "Perabotan Ruang Tamu", correct: ["Sofa", "Meja", "Karpet"], dist: ["Kasur", "Kompor", "Gayung"], expl: "Benda yang lazim ada di ruang tamu." },
  { cat: "Hewan Herbivora", correct: ["Sapi", "Kambing", "Kuda"], dist: ["Macan", "Singa", "Serigala"], expl: "Hewan pemakan tumbuhan." },
  { cat: "Benua", correct: ["Asia", "Afrika", "Eropa"], dist: ["Indonesia", "Jepang", "Pasifik"], expl: "Nama-nama benua, bukan negara atau samudra." },
  { cat: "Alat Musik Gesek", correct: ["Biola", "Cello", "Rebab"], dist: ["Gitar", "Piano", "Drum"], expl: "Dimainkan dengan cara digesek." },
  { cat: "Bumbu Dapur", correct: ["Merica", "Ketumbar", "Kunyit"], dist: ["Sabun", "Sampo", "Pasta Gigi"], expl: "Rempah untuk memasak." },
  { cat: "Olahraga Bola Besar", correct: ["Sepak Bola", "Basket", "Voli"], dist: ["Tenis Meja", "Kasti", "Badminton"], expl: "Menggunakan bola berukuran besar." },
  { cat: "Warna Primer", correct: ["Merah", "Kuning", "Biru"], dist: ["Hijau", "Ungu", "Jingga"], expl: "Warna dasar pembentuk warna lain." },
  { cat: "Bagian Pohon", correct: ["Akar", "Batang", "Daun"], dist: ["Batu", "Tanah", "Air"], expl: "Struktur biologis pohon." },
  { cat: "Planet Tata Surya", correct: ["Mars", "Jupiter", "Saturnus"], dist: ["Bulan", "Matahari", "Pluto"], expl: "Benda langit yang dikategorikan sebagai planet utama." }
];

const ANAGRAM_DB = [
  { raw: "KOMPUTER", hint: "Alat pengolah data elektronik" },
  { raw: "ALGORITMA", hint: "Urutan langkah logis penyelesaian masalah" },
  { raw: "INTERNET", hint: "Jaringan komunikasi global" },
  { raw: "KEYBOARD", hint: "Papan ketik" },
  { raw: "MONITOR", hint: "Layar tampilan visual" },
  { raw: "APLIKASI", hint: "Perangkat lunak penunjang tugas" },
  { raw: "DATABASE", hint: "Kumpulan data terorganisir" },
  { raw: "MEMORI", hint: "Penyimpanan sementara" },
  { raw: "JARINGAN", hint: "Koneksi antar perangkat" },
  { raw: "PROGRAM", hint: "Kumpulan instruksi kode" },
  { raw: "VARIABLE", hint: "Wadah penyimpan nilai dalam kode" },
  { raw: "SINAPSIS", hint: "Hubungan antar neuron otak" },
  { raw: "KORTEKS", hint: "Lapisan luar otak" },
  { raw: "NEURON", hint: "Sel saraf" },
  { raw: "LOGIKA", hint: "Jalan pikiran yang masuk akal" }
];

const WELCOME_MESSAGES = [
  "Sistem Neuro-Link Terhubung.",
  "Inisialisasi Protokol Otak...",
  "Selamat Datang, Operator.",
  "Siap Meningkatkan Kapasitas Neural?",
  "Fokus. Analisis. Eksekusi.",
  "Menyiapkan Simulasi Kognitif.",
  "Status Sistem: Optimal.",
  "Waktunya Senam Otak.",
  "Akses Diberikan: Level Pengguna."
];

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
  await delay(500); // Aesthetic delay
  const msg = WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
  return msg;
};

export const generateRiddle = async (difficulty: Difficulty): Promise<AIQuestion> => {
  await delay(800); // Simulate thinking
  
  // Pick random riddle
  const item = RIDDLES_DB[Math.floor(Math.random() * RIDDLES_DB.length)];
  
  // Shuffle options
  const shuffledOptions = shuffleArray(item.o);
  const correctIndex = shuffledOptions.indexOf(item.a);

  return {
    question: item.q,
    options: shuffledOptions,
    correctAnswerIndex: correctIndex,
    explanation: item.expl
  };
};

export const generateSequencePuzzle = async (difficulty: Difficulty): Promise<AIQuestion> => {
  await delay(600);
  
  // Math Sequence Generator Algorithm
  let sequence: number[] = [];
  let nextVal = 0;
  let rule = "";
  let options: number[] = [];
  
  const start = Math.floor(Math.random() * 20) + 1;
  
  // Determine Pattern based on Difficulty
  const type = Math.random();
  
  if (difficulty === Difficulty.BEGINNER) {
    // Simple Arithmetic (+n or -n)
    const step = Math.floor(Math.random() * 5) + 2;
    const isAdd = Math.random() > 0.3;
    
    sequence = [start];
    for(let i=1; i<4; i++) {
        sequence.push(isAdd ? sequence[i-1] + step : sequence[i-1] + step * 2); // Simple progressive
    }
    
    // Override with simpler linear
    if(Math.random() > 0.5) {
        sequence = [start, start + step, start + step*2, start + step*3];
        nextVal = start + step * 4;
        rule = `Pola: +${step}`;
    } else {
        sequence = [start, start + step, start + step + 2, start + step + 2 + 2]; // +n, +n+2..
        nextVal = sequence[3] + 2 + 2 + 2; // faulty logic for random gen, let's stick to linear for stability
        
        // Linear is safest for beginner
        const s = Math.floor(Math.random() * 10);
        sequence = [s, s+step, s+step*2, s+step*3];
        nextVal = s+step*4;
        rule = `Ditambah ${step} setiap langkah.`;
    }
  } else {
    // Geometric or Multi-step
    const mult = Math.floor(Math.random() * 2) + 2;
    if (Math.random() > 0.5) {
        // Geometric (*n)
        sequence = [start, start * mult, start * mult * mult, start * mult * mult * mult];
        nextVal = sequence[3] * mult;
        rule = `Dikali ${mult} setiap langkah.`;
    } else {
        // Fibonacci-ish
        const n1 = Math.floor(Math.random() * 5) + 1;
        const n2 = Math.floor(Math.random() * 5) + n1;
        sequence = [n1, n2, n1+n2, n2+(n1+n2)];
        nextVal = sequence[2] + sequence[3];
        rule = "Penjumlahan dua angka sebelumnya (Fibonacci).";
    }
  }

  // Generate Options (1 correct, 3 wrong)
  options.push(nextVal);
  while(options.length < 4) {
    const offset = Math.floor(Math.random() * 10) - 5;
    const fake = nextVal + offset;
    if (fake !== nextVal && fake > 0 && !options.includes(fake)) {
        options.push(fake);
    }
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
  await delay(700);
  const item = WORD_ASSOC_DB[Math.floor(Math.random() * WORD_ASSOC_DB.length)];
  return {
    category: item.cat,
    correctWords: item.correct,
    distractors: item.dist,
    explanation: item.expl
  };
};

export const generateAnagram = async (difficulty: Difficulty): Promise<AnagramQuestion> => {
  await delay(500);
  
  // Filter by difficulty length roughly
  let pool = ANAGRAM_DB;
  if (difficulty === Difficulty.BEGINNER) pool = ANAGRAM_DB.filter(x => x.raw.length <= 6);
  else if (difficulty === Difficulty.ADVANCED) pool = ANAGRAM_DB.filter(x => x.raw.length > 7);
  
  if (pool.length === 0) pool = ANAGRAM_DB; // fallback

  const item = pool[Math.floor(Math.random() * pool.length)];
  const scrambled = shuffleArray(item.raw.split('')).join('');

  return {
    original: item.raw,
    scrambled: scrambled === item.raw ? shuffleArray(item.raw.split('')).join('') : scrambled, // retry if same
    hint: item.hint
  };
};

export const generateGameFeedback = async (result: GameResult): Promise<string> => {
  await delay(1000); // Analysis effect

  const acc = result.accuracy;
  const mistakes = result.mistakePatterns || [];

  // Rule Based Analysis Logic
  if (acc >= 90) {
    if (result.duration < 20000) return "Analisis: Kecepatan dan akurasi di tingkat Master. Sirkuit saraf Anda sangat efisien.";
    return "Analisis: Fokus yang luar biasa. Pertahankan konsistensi ini untuk memperkuat memori jangka panjang.";
  }
  
  if (acc >= 70) {
    if (mistakes.length > 0) return `Analisis: Bagus, namun terdeteksi pola kesalahan '${mistakes[0]}'. Cobalah lebih tenang sebelum menjawab.`;
    return "Analisis: Performa solid. Sedikit lagi latihan untuk mencapai potensi maksimal.";
  }
  
  if (acc >= 50) {
    return "Analisis: Terdeteksi keraguan dalam pengambilan keputusan. Jangan terburu-buru, fokus pada pola.";
  }

  return "Analisis: Sinyal saraf tidak stabil. Disarankan latihan intensif pada mode 'Pemula' untuk membangun fondasi.";
};
