import { Difficulty, AIQuestion, WordAssociationQuestion, AnagramQuestion, GameResult, GameMode } from "../types";

// --- DATABASE SOAL LOKAL (BAHASA INDONESIA) ---
// (Database arrays remain unchanged for brevity, focusing on feedback logic)
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
  { raw: "BUKU", hint: "Jendela dunia" },
  { raw: "MEJA", hint: "Tempat menaruh barang" },
  { raw: "GURU", hint: "Pahlawan tanpa tanda jasa" },
  { raw: "ILMU", hint: "Pengetahuan" },
  { raw: "MATA", hint: "Indra penglihatan" },
  { raw: "KAKI", hint: "Anggota gerak bawah" },
  { raw: "ROTI", hint: "Makanan dari tepung" },
  { raw: "KOPI", hint: "Minuman hitam berkafein" },
  { raw: "SUSU", hint: "Minuman kaya kalsium" },
  { raw: "BOLA", hint: "Alat olahraga bulat" },
  { raw: "KOMPUTER", hint: "Alat pengolah data elektronik" },
  { raw: "SEKOLAH", hint: "Tempat belajar formal" },
  { raw: "BELAJAR", hint: "Proses menuntut ilmu" },
  { raw: "MEMBACA", hint: "Mengeja tulisan" },
  { raw: "MENULIS", hint: "Membuat catatan" },
  { raw: "TELEPON", hint: "Alat komunikasi suara" },
  { raw: "GAMBAR", hint: "Karya visual dua dimensi" },
  { raw: "MUSIK", hint: "Nada dan irama" },
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
  { raw: "LOGIKA", hint: "Jalan pikiran yang masuk akal" },
  { raw: "PSIKOLOGI", hint: "Ilmu tentang perilaku dan pikiran" },
  { raw: "KOGNITIF", hint: "Berhubungan dengan kemampuan berpikir" },
  { raw: "ANALISIS", hint: "Penyelidikan mendalam" },
  { raw: "STRATEGI", hint: "Rencana cermat" },
  { raw: "TEKNOLOGI", hint: "Penerapan ilmu pengetahuan" },
  { raw: "INFORMASI", hint: "Kumpulan data bermakna" }
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
  await delay(500); 
  const msg = WELCOME_MESSAGES[Math.floor(Math.random() * WELCOME_MESSAGES.length)];
  return msg;
};

export const generateRiddle = async (difficulty: Difficulty): Promise<AIQuestion> => {
  await delay(800); 
  
  const item = RIDDLES_DB[Math.floor(Math.random() * RIDDLES_DB.length)];
  
  const shuffledOptions = shuffleArray(item.o);
  const correctIndex = shuffledOptions.indexOf(item.a);

  return {
    question: item.q,
    options: shuffledOptions,
    correctAnswerIndex: correctIndex,
    explanation: item.expl
  };
};

export const generateSequencePuzzle = async (difficulty: Difficulty, mode: 'LINEAR' | 'COMPLEX' | 'CHAOS' = 'LINEAR'): Promise<AIQuestion> => {
  await delay(600);
  
  let sequence: number[] = [];
  let nextVal = 0;
  let rule = "";
  let options: number[] = [];
  
  // Scaling factors based on difficulty
  const maxStart = difficulty === Difficulty.BEGINNER ? 20 : difficulty === Difficulty.INTERMEDIATE ? 50 : 100;
  const maxStep = difficulty === Difficulty.BEGINNER ? 5 : difficulty === Difficulty.INTERMEDIATE ? 10 : 25;

  if (mode === 'LINEAR') {
    const start = Math.floor(Math.random() * maxStart) + 1;
    const step = Math.floor(Math.random() * maxStep) + 2;
    const op = Math.random();
    
    if (op < 0.4) {
        sequence = [start, start + step, start + step*2, start + step*3];
        nextVal = start + step * 4;
        rule = `Pola: +${step}`;
    } else if (op < 0.7) {
        const startHigh = start + (step * 5);
        sequence = [startHigh, startHigh - step, startHigh - step*2, startHigh - step*3];
        nextVal = startHigh - step * 4;
        rule = `Pola: -${step}`;
    } else {
        const s = Math.floor(Math.random() * 3) + 2;
        const m = difficulty === Difficulty.ADVANCED ? (Math.floor(Math.random() * 3) + 2) : 2; 
        sequence = [s, s*m, s*m*m, s*m*m*m];
        nextVal = s*m*m*m*m;
        rule = `Pola: x${m}`;
    }
  } 
  else if (mode === 'COMPLEX') {
     const type = Math.random();
     if (type < 0.3) {
         const n1 = Math.floor(Math.random() * (difficulty === Difficulty.ADVANCED ? 20 : 5)) + 1;
         const n2 = Math.floor(Math.random() * 5) + n1;
         sequence = [n1, n2, n1+n2, n2+(n1+n2), (n1+n2)+(n2+(n1+n2))];
         sequence = sequence.slice(0, 4);
         nextVal = sequence[2] + sequence[3];
         rule = "Fibonacci (Jumlah dua angka sebelumnya)";
     } else if (type < 0.6) {
         const start = Math.floor(Math.random() * (difficulty === Difficulty.ADVANCED ? 8 : 3)) + 1;
         sequence = [start**2, (start+1)**2, (start+2)**2, (start+3)**2];
         nextVal = (start+4)**2;
         rule = "Bilangan Kuadrat (n^2)";
     } else {
         const primes = [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47, 53, 59, 61, 67, 71, 73, 79, 83, 89, 97];
         const maxIdx = difficulty === Difficulty.ADVANCED ? primes.length - 5 : 10;
         const startIdx = Math.floor(Math.random() * maxIdx);
         sequence = primes.slice(startIdx, startIdx + 4);
         nextVal = primes[startIdx + 4];
         rule = "Bilangan Prima berurutan";
     }
  }
  else {
      const startA = Math.floor(Math.random() * maxStart) + 1;
      const stepA = Math.floor(Math.random() * (difficulty === Difficulty.BEGINNER ? 5 : 10)) + 1;
      
      const startB = Math.floor(Math.random() * 50) + 50;
      const stepB = Math.floor(Math.random() * (difficulty === Difficulty.BEGINNER ? 5 : 10)) + 1;
      
      if (difficulty === Difficulty.BEGINNER) {
          sequence = [startA, startB, startA + stepA, startB - stepB, startA + stepA*2];
          nextVal = startB - stepB*2;
      } else {
           sequence = [startA, startB, startA + stepA, startB - stepB, startA + stepA*2, startB - stepB*2];
           nextVal = startA + stepA*3;
      }
      
      rule = `Interleaved: Pola 1 (+${stepA}), Pola 2 (-${stepB})`;
  }

  options.push(nextVal);
  while(options.length < 4) {
    const offset = Math.floor(Math.random() * 10) - 5 || 1;
    const fake = nextVal + offset;
    if (fake !== nextVal && !options.includes(fake)) {
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
  let pool = ANAGRAM_DB;
  
  if (difficulty === Difficulty.BEGINNER) {
      pool = ANAGRAM_DB.filter(x => x.raw.length >= 4 && x.raw.length <= 6);
  } else if (difficulty === Difficulty.INTERMEDIATE) {
      pool = ANAGRAM_DB.filter(x => x.raw.length > 5 && x.raw.length <= 8);
  } else {
      pool = ANAGRAM_DB.filter(x => x.raw.length >= 8);
  }
  
  if (pool.length === 0) pool = ANAGRAM_DB;

  const item = pool[Math.floor(Math.random() * pool.length)];
  let scrambled = shuffleArray(item.raw.split('')).join('');
  
  while (scrambled === item.raw) {
      scrambled = shuffleArray(item.raw.split('')).join('');
  }

  return {
    original: item.raw,
    scrambled: scrambled, 
    hint: item.hint
  };
};

// IMPROVED FEEDBACK LOGIC WITH REACTION TIME
export const generateGameFeedback = async (result: GameResult): Promise<string> => {
  await delay(1000); 

  const acc = result.accuracy;
  const mistakes = result.mistakePatterns || [];
  const rt = result.averageReactionTime;

  let rtAnalysis = "";
  if (rt) {
      if (rt < 1000) rtAnalysis = `KECEPATAN REFLEKS: ${rt.toFixed(0)}ms (SANGAT CEPAT - TOP 5%)`;
      else if (rt < 2000) rtAnalysis = `KECEPATAN REFLEKS: ${rt.toFixed(0)}ms (NORMAL)`;
      else rtAnalysis = `KECEPATAN REFLEKS: ${rt.toFixed(0)}ms (PERLU DITINGKATKAN)`;
  }

  if (acc >= 90) {
    if (result.duration < 20000) return `Analisis: PERFORMA MASTER. Sirkuit saraf sangat efisien. ${rtAnalysis}`;
    return `Analisis: Fokus yang luar biasa. Akurasi tinggi. ${rtAnalysis}`;
  }
  
  if (acc >= 70) {
    if (mistakes.length > 0) return `Analisis: Bagus, namun terdeteksi pola kesalahan '${mistakes[0]}'. ${rtAnalysis}`;
    return `Analisis: Performa solid. Sedikit lagi latihan untuk mencapai potensi maksimal. ${rtAnalysis}`;
  }
  
  if (acc >= 50) {
    return `Analisis: Terdeteksi keraguan dalam pengambilan keputusan. Jangan terburu-buru. ${rtAnalysis}`;
  }

  return "Analisis: Sinyal saraf tidak stabil. Disarankan latihan intensif pada mode 'Pemula' untuk membangun fondasi.";
};
