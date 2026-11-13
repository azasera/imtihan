/**
 * Modul pembantu untuk perakitan prompt dan draf pembuatan butir soal berbasis AI.
 * Menghasilkan format teks bernomor yang secara tepat dikenali oleh penafsir parseQuestionImport.
 */

export interface AiPromptOptions {
  subjectName: string
  topic: string
  gradeLevel?: string
  questionType: "multiple_choice" | "pg_kompleks" | "true_false" | "essay" | "mixed"
  count: number
  thinkingLevel?: "mengingat" | "memahami" | "mengaplikasikan" | "menganalisis" | "mixed"
  additionalInstructions?: string
}

/**
 * Menyusun prompt sistem terstruktur untuk AI (seperti Gemini, ChatGPT, Claude)
 * yang menghasilkan keluaran naskah siap impor ke E-Imtihan tanpa format rusak.
 */
export function buildAiQuestionPrompt(options: AiPromptOptions): string {
  const {
    subjectName,
    topic,
    gradeLevel = "Madrasah / Pesantren",
    questionType,
    count,
    thinkingLevel = "mixed",
    additionalInstructions,
  } = options

  const thinkingInstruction =
    thinkingLevel === "mixed"
      ? "Variasikan tingkat kognitif antara LOTS (mengingat, memahami) dan HOTS (mengaplikasikan, menganalisis)."
      : `Fokuskan pada tingkat kognitif: ${thinkingLevel}.`

  let typeSpecificRule = ""
  if (questionType === "multiple_choice") {
    typeSpecificRule = `
Format butir Pilihan Ganda:
1. [Teks pertanyaan]
A. [Pilihan A]
B. [Pilihan B yang benar]*
C. [Pilihan C]
D. [Pilihan D]
pembahasan: [Penjelasan ringkas mengapa jawaban B benar]
berpikir: [mengingat / memahami / mengaplikasikan / menganalisis]
capaian: [Ringkasan kompetensi maks 80 karakter]
poin: 5`
  } else if (questionType === "true_false") {
    typeSpecificRule = `
Format butir Benar / Salah:
1. (benar/salah) [Pernyataan yang perlu dinilai kebenarannya]
B (atau S jika salah)
pembahasan: [Penjelasan ringkas]
berpikir: [memahami / menganalisis]
capaian: [Ringkasan kompetensi maks 80 karakter]
poin: 5`
  } else if (questionType === "essay") {
    typeSpecificRule = `
Format butir Uraian / Esai:
1. (essay) [Pertanyaan pemahaman atau penalaran terbuka]
rubrik: [Kriteria penilaian jawaban santri]
pembahasan: [Contoh jawaban ideal]
berpikir: [mengaplikasikan / menganalisis]
capaian: [Ringkasan kompetensi maks 80 karakter]
poin: 10`
  } else {
    typeSpecificRule = `
Format butir Pilihan Ganda (bawaan):
1. [Teks pertanyaan]
A. [Pilihan A yang benar]*
B. [Pilihan B]
C. [Pilihan C]
D. [Pilihan D]
pembahasan: [Penjelasan]
berpikir: memahami
capaian: [Ringkasan kompetensi]
poin: 5`
  }

  return `Anda adalah asisten kurikulum dan pakar penyusun soal evaluasi pembelajaran untuk jenjang ${gradeLevel}.
Tugas Anda adalah membuat ${count} butir soal berkualitas tinggi untuk mata pelajaran "${subjectName}" dengan materi/topik: "${topic}".

Pedoman Kognitif:
${thinkingInstruction}
${additionalInstructions ? `Instruksi Tambahan: ${additionalInstructions}` : ""}

ATURAN STRUKTUR TEKS KELUARAN WAJIB DIPATUHI:
- Beri tanda bintang (*) tepat di akhir opsi yang benar untuk pilihan ganda (misal: "A. Pilihan jawaban*").
- Untuk benar/salah, awali nomor soal dengan "(benar/salah)" dan tuliskan "B" atau "S" di baris berikutnya.
- Untuk esai/uraian, awali nomor soal dengan "(essay)" dan sertakan baris "rubrik: ...".
- Gunakan label huruf kecil: "pembahasan:", "berpikir:", "capaian:", dan "poin:".
- Tingkat berpikir hanya boleh salah satu dari: mengingat, memahami, mengaplikasikan, atau menganalisis.
${typeSpecificRule}

- Pisahkan setiap butir soal dengan satu baris kosong.
- Buat butir soal yang mendidik, relevan dengan dunia santri/madrasah, dan bebas dari ambiguitas.`
}

/**
 * Menghasilkan draf contoh soal cepat sesuai topik untuk kemudahan ustadz di antarmuka.
 */
export function generateQuickDraftByTopic(options: AiPromptOptions): string {
  const { subjectName, topic, count, questionType } = options
  const items: string[] = []

  const targetCount = Math.max(1, Math.min(count, 10))

  for (let i = 1; i <= targetCount; i++) {
    if (questionType === "true_false") {
      items.push(
`${i}. (benar/salah) Terkait materi ${topic} pada pelajaran ${subjectName}, pernyataan berikut merupakan ketentuan dasar yang telah disepakati oleh para ulama.
B
pembahasan: Materi ${topic} memuat pokok-pokok kaidah yang diajarkan dalam kurikulum ${subjectName}.
berpikir: memahami
capaian: Memahami konsep dasar ${topic.slice(0, 30)}
poin: 5`
      )
    } else if (questionType === "essay") {
      items.push(
`${i}. (essay) Jelaskan secara ringkas dan sistematis mengenai konsep ${topic} dalam pelajaran ${subjectName}, serta berikan contoh penerapannya dalam kehidupan sehari-hari!
rubrik: Menyebutkan definisi pokok (40%), menjelaskan hikmah/manfaat (30%), dan memberikan contoh konkret yang relevan (30%).
pembahasan: Jawaban santri diharapkan mencakup pemahaman inti ${topic} beserta contoh pengamalannya secara tertib.
berpikir: mengaplikasikan
capaian: Menjelaskan hikmah dan pengamalan ${topic.slice(0, 30)}
poin: 10`
      )
    } else {
      // default: multiple choice
      items.push(
`${i}. Dalam mempelajari ${topic} pada mata pelajaran ${subjectName}, manakah di antara pernyataan berikut yang paling tepat?
A. Konsep pertama yang mengutamakan ketelitian dan keutamaan niat*
B. Pengabaian terhadap rukun dan syarat sah pelaksanaan
C. Ketentuan yang bertentangan dengan dalil syar'i
D. Pelaksanaan yang hanya dilakukan tanpa dasar ilmu
pembahasan: Opsi A merupakan jawaban yang benar karena pelaksanaan ibadah dan pengamalan ilmu harus senantiasa didasari oleh niat ikhlas dan ketelitian.
berpikir: memahami
capaian: Memahami prinsip pokok ${topic.slice(0, 30)}
poin: 5`
      )
    }
  }

  return items.join("\n\n")
}
