/**
 * Ekstraktor dokumen Microsoft Word (.docx) untuk Bank Soal e-IMTIHAN.
 * Berjalan sepenuhnya di sisi klien (browser) atau runtime Node.js modern
 * menggunakan native DecompressionStream tanpa pustaka pihak ketiga eksternal.
 */

export interface DocxExtractionResult {
  /** Teks yang telah dinormalisasi ke format naskah impor bernomor. */
  text: string
  /** Total butir soal yang berhasil dikenali. */
  questionCount: number
  /** Jumlah soal pilihan ganda. */
  multipleChoiceCount: number
  /** Jumlah soal uraian/essay. */
  essayCount: number
  /** Peringatan atau catatan penafsiran jika ada. */
  notes: string[]
}

/**
 * Membaca buffer berkas .docx dan mengekstrak berkas XML di dalamnya.
 */
async function extractDocxXml(buffer: ArrayBuffer | Uint8Array): Promise<string> {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer)
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let offset = 0

  while (offset < bytes.length - 4) {
    const signature = view.getUint32(offset, true)
    if (signature === 0x04034b50) {
      // Local file header ZIP
      const method = view.getUint16(offset + 8, true)
      const compSize = view.getUint32(offset + 18, true)
      const nameLen = view.getUint16(offset + 26, true)
      const extraLen = view.getUint16(offset + 28, true)
      const nameBytes = bytes.subarray(offset + 30, offset + 30 + nameLen)
      const name = new TextDecoder("utf-8").decode(nameBytes)
      const dataStart = offset + 30 + nameLen + extraLen

      if (name === "word/document.xml") {
        const compressedData = bytes.subarray(dataStart, dataStart + compSize)
        if (method === 0) {
          return new TextDecoder("utf-8").decode(compressedData)
        }
        if (method === 8) {
          if (typeof DecompressionStream === "undefined") {
            throw new Error("Peramban Anda belum mendukung DecompressionStream untuk membuka berkas .docx.")
          }
          const stream = new Response(compressedData as unknown as BodyInit).body!.pipeThrough(
            new DecompressionStream("deflate-raw")
          )
          const decompressedBuffer = await new Response(stream).arrayBuffer()
          return new TextDecoder("utf-8").decode(decompressedBuffer)
        }
        throw new Error(`Metode kompresi berkas ${method} tidak didukung.`)
      }
      offset = dataStart + compSize
    } else {
      offset++
    }
  }

  throw new Error("Berkas yang diunggah bukan dokumen Word (.docx) yang valid atau tidak memuat naskah.")
}

/**
 * Membersihkan karakter khusus dan menyelaraskan spasi.
 */
function cleanParagraphText(raw: string): string {
  return raw
    .replace(/\u00a0/g, " ") // Non-breaking space
    .replace(/[\u2018\u2019]/g, "'") // Smart single quotes
    .replace(/[\u201C\u201D]/g, '"') // Smart double quotes
    .replace(/\u2013|\u2014/g, "-") // En/Em dash
    .replace(/\r\n|\r|\n/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

/**
 * Mengekstrak paragraf teks dari dokumen XML Word.
 */
function extractParagraphsFromXml(docXml: string): string[] {
  // Ganti w:br dengan spasi agar jeda kata tetap terjaga
  const sanitizedXml = docXml.replace(/<w:br\b[^>]*\/>/gi, " ")
  const pRegex = /<w:p\b[^>]*>([\s\S]*?)<\/w:p>/g
  const tRegex = /<w:t\b[^>]*>([\s\S]*?)<\/w:t>/g

  const paragraphs: string[] = []
  let pMatch: RegExpExecArray | null

  while ((pMatch = pRegex.exec(sanitizedXml)) !== null) {
    const pContent = pMatch[1]
    let tMatch: RegExpExecArray | null
    let paragraphText = ""

    while ((tMatch = tRegex.exec(pContent)) !== null) {
      paragraphText += tMatch[1]
    }

    const cleaned = cleanParagraphText(paragraphText)
    if (cleaned.length > 0) {
      paragraphs.push(cleaned)
    }
  }

  return paragraphs
}

/**
 * Menafsir daftar paragraf Word menjadi naskah soal bernomor yang siap diimpor.
 */
export function convertDocxParagraphsToImportText(paragraphs: string[]): DocxExtractionResult {
  const lines: string[] = []
  let questionNumber = 1
  let mcCount = 0
  let essayCount = 0
  let inEssaySection = false
  const notes: string[] = []

  for (const paragraph of paragraphs) {
    // 1. Lewati judul petunjuk pengerjaan umum
    if (/^[A-Za-z]\.\s*Pilihlah\b/i.test(paragraph) || /^Petunjuk\s+(Umum|Khusus)\b/i.test(paragraph)) {
      continue
    }

    // 2. Kenali transisi ke bagian Uraian/Essay
    if (/^[A-Za-z]\.\s*(Jawablah|Uraian|Essay|Esai)\b/i.test(paragraph)) {
      inEssaySection = true
      continue
    }

    if (!inEssaySection) {
      // 3. Periksa apakah terdapat opsi inline bersambung (A, B, C, D)
      // Pola mendeteksi huruf a-e diikuti titik/kurung tutup, didahului spasi/tanda baca/titik atau huruf kata sebelumnya
      const markerRegex = /(?:^|\s|[.\u2026]+|(?<=[a-z]))([a-eA-E])[.)]\s*/gi
      const matches: Array<{ letter: string; index: number; matchLength: number }> = []
      let m: RegExpExecArray | null

      while ((m = markerRegex.exec(paragraph)) !== null) {
        matches.push({
          letter: m[1].toUpperCase(),
          index: m.index,
          matchLength: m[0].length,
        })
      }

      const letters = matches.map((x) => x.letter)
      const aIdx = letters.indexOf("A")
      const bIdx = letters.indexOf("B", aIdx + 1)
      const cIdx = letters.indexOf("C", bIdx + 1)
      const dIdx = letters.indexOf("D", cIdx + 1)

      // Bila ditemukan minimal 4 opsi berurutan A, B, C, D dalam satu baris
      if (aIdx !== -1 && bIdx !== -1 && cIdx !== -1 && dIdx !== -1) {
        const mA = matches[aIdx]
        const mB = matches[bIdx]
        const mC = matches[cIdx]
        const mD = matches[dIdx]

        let qText = paragraph.slice(0, mA.index).replace(/^\d+[\.)]\s*/, "").trim()
        qText = qText.replace(/[.\u2026\s]+$/, "").trim()

        const optA = paragraph.slice(mA.index + mA.matchLength, mB.index).trim()
        const optB = paragraph.slice(mB.index + mB.matchLength, mC.index).trim()
        const optC = paragraph.slice(mC.index + mC.matchLength, mD.index).trim()
        const optD = paragraph.slice(mD.index + mD.matchLength).trim()

        if (qText.length > 0) {
          lines.push(`${questionNumber}. ${qText}`)
          questionNumber++
          mcCount++
        } else if (lines.length > 0 && lines[lines.length - 1] === "") {
          // Bila teks soal ada di paragraf sebelumnya dan opsi menempel di paragraf baru
          lines.pop()
        }

        lines.push(`A. ${optA}`)
        lines.push(`B. ${optB}`)
        lines.push(`C. ${optC}`)
        lines.push(`D. ${optD}`)
        lines.push("")
        continue
      }

      // 4. Periksa apakah baris ini adalah opsi tunggal (A. / B. / C. / D. / E.)
      const singleOptionMatch = paragraph.match(/^([a-eA-E])[.)]\s*(.*)$/)
      if (singleOptionMatch && lines.length > 0) {
        const letter = singleOptionMatch[1].toUpperCase()
        const optText = singleOptionMatch[2].trim()
        if (lines[lines.length - 1] === "") lines.pop()
        lines.push(`${letter}. ${optText}`)
        lines.push("")
        continue
      }
    }

    // 5. Butir soal biasa (atau soal essay jika berada di bagian essay)
    const cleanText = paragraph.replace(/^\d+[\.)]\s*/, "").trim()
    if (!cleanText) continue

    if (inEssaySection) {
      lines.push(`${questionNumber}. (essay) ${cleanText}`)
      lines.push("rubrik: ")
      lines.push("poin: 10")
      lines.push("")
      questionNumber++
      essayCount++
    } else {
      lines.push(`${questionNumber}. ${cleanText}`)
      questionNumber++
      mcCount++
    }
  }

  const text = lines.join("\n").trim()
  return {
    text,
    questionCount: mcCount + essayCount,
    multipleChoiceCount: mcCount,
    essayCount,
    notes,
  }
}

/**
 * Fungsi utama untuk mengekstrak berkas .docx menjadi naskah soal siap impor.
 */
export async function extractDocxToImportText(buffer: ArrayBuffer | Uint8Array): Promise<DocxExtractionResult> {
  const xml = await extractDocxXml(buffer)
  const paragraphs = extractParagraphsFromXml(xml)
  return convertDocxParagraphsToImportText(paragraphs)
}
