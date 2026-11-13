/**
 * Utilitas untuk mengekspor naskah bank soal ke dalam format naskah cetak (Paper-based Exam)
 * dan format teks terstruktur yang mudah disalin ke Google Form.
 */

export interface ExportableQuestion {
  id: string
  number: number
  type: "multiple_choice" | "pg_kompleks" | "true_false" | "essay"
  questionText: string
  stimulusText?: string
  options?: Array<{
    id: string
    label: string
    text: string
    isCorrect?: boolean
  }>
  correctOptionId?: string
  points: number
  rubric?: string
  explanation?: string
  thinkingLevel?: string
  achievementRef?: string
}

export interface ExamExportHeader {
  title: string
  subjectName: string
  gradeLevel?: string
  institutionName?: string
  academicYear?: string
  durationMinutes?: number
}

/**
 * Format pertanyaan menjadi teks terstruktur rapi untuk Google Form / Google Docs.
 */
export function formatQuestionsForGoogleForm(
  questions: ExportableQuestion[],
  header?: Partial<ExamExportHeader>
): string {
  const lines: string[] = []

  if (header?.title) {
    lines.push(`JUDUL: ${header.title}`)
  }
  if (header?.subjectName) {
    lines.push(`MATA PELAJARAN: ${header.subjectName}`)
  }
  if (header?.gradeLevel) {
    lines.push(`KELAS / JENJANG: ${header.gradeLevel}`)
  }
  if (lines.length > 0) {
    lines.push("----------------------------------------")
    lines.push("")
  }

  for (let i = 0; i < questions.length; i++) {
    const q = questions[i]
    const num = q.number || i + 1

    lines.push(`[SOAL ${num}] (${formatQuestionTypeLabel(q.type)}) - ${q.points} Poin`)

    if (q.stimulusText && q.stimulusText.trim().length > 0) {
      lines.push("Stimulus / Wacana:")
      lines.push(q.stimulusText.trim())
      lines.push("")
    }

    lines.push(q.questionText.trim())

    if (q.type === "multiple_choice" && q.options) {
      lines.push("")
      for (const opt of q.options) {
        const isKey = opt.id === q.correctOptionId || opt.isCorrect === true
        const keyPrefix = isKey ? "[KUNCI] " : ""
        lines.push(`${opt.label}. ${keyPrefix}${opt.text}`)
      }
    } else if (q.type === "pg_kompleks" && q.options) {
      lines.push("")
      lines.push("Pilihan (Pilih semua yang benar):")
      for (const opt of q.options) {
        const keyPrefix = opt.isCorrect ? "[KUNCI] " : ""
        lines.push(`[ ] ${keyPrefix}${opt.text}`)
      }
    } else if (q.type === "true_false") {
      lines.push("")
      const keyStr = q.correctOptionId ? ` (Kunci: ${q.correctOptionId})` : ""
      lines.push(`Pernyataan: Benar / Salah${keyStr}`)
    } else if (q.type === "essay") {
      lines.push("")
      lines.push("Jawaban: (Uraian / Esai)")
      if (q.rubric) {
        lines.push(`Rubrik Penilaian: ${q.rubric}`)
      }
    }

    if (q.explanation && q.explanation.trim().length > 0) {
      lines.push(`Pembahasan: ${q.explanation.trim()}`)
    }

    lines.push("")
    lines.push("----------------------------------------")
    lines.push("")
  }

  return lines.join("\n")
}

/**
 * Format teks tipe soal dalam bahasa Indonesia resmi.
 */
export function formatQuestionTypeLabel(type: ExportableQuestion["type"]): string {
  switch (type) {
    case "multiple_choice":
      return "Pilihan Ganda"
    case "pg_kompleks":
      return "Pilihan Ganda Kompleks"
    case "true_false":
      return "Benar / Salah"
    case "essay":
      return "Uraian / Esai"
    default:
      return "Soal"
  }
}

export interface PrintableHtmlOptions {
  includeAnswerKey?: boolean
  includeExplanations?: boolean
}

/**
 * Menghasilkan naskah HTML lengkap siap cetak (Print Preview) dengan tata letak resmi madrasah.
 */
export function generatePrintableHtml(
  questions: ExportableQuestion[],
  header: ExamExportHeader,
  options: PrintableHtmlOptions = {}
): string {
  const { includeAnswerKey = false, includeExplanations = false } = options

  const questionItemsHtml = questions
    .map((q, idx) => {
      const num = q.number || idx + 1
      let optionsHtml = ""

      if (q.type === "multiple_choice" && q.options) {
        optionsHtml = `
          <div class="options-grid">
            ${q.options
              .map(
                (opt) => `
                <div class="option-item">
                  <span class="option-label">${opt.label}.</span>
                  <span class="option-text">${escapeHtml(opt.text)}</span>
                </div>`
              )
              .join("")}
          </div>
        `
      } else if (q.type === "pg_kompleks" && q.options) {
        optionsHtml = `
          <div class="options-grid complex">
            ${q.options
              .map(
                (opt) => `
                <div class="option-item">
                  <span class="checkbox-box">&#9633;</span>
                  <span class="option-text">${escapeHtml(opt.text)}</span>
                </div>`
              )
              .join("")}
          </div>
        `
      } else if (q.type === "true_false") {
        optionsHtml = `
          <div class="tf-choices">
            <span>[ &nbsp; ] Benar</span>
            <span style="margin-left: 24px;">[ &nbsp; ] Salah</span>
          </div>
        `
      } else if (q.type === "essay") {
        optionsHtml = `
          <div class="essay-lines">
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
          </div>
        `
      }

      const stimulusHtml = q.stimulusText
        ? `<div class="stimulus-box">${escapeHtml(q.stimulusText)}</div>`
        : ""

      return `
        <div class="question-block">
          <div class="question-header">
            <span class="question-num">${num}.</span>
            <div class="question-body">
              ${stimulusHtml}
              <div class="question-text">${escapeHtml(q.questionText)}</div>
              ${optionsHtml}
            </div>
            <span class="points-badge">${q.points} poin</span>
          </div>
        </div>
      `
    })
    .join("")

  let keyTableHtml = ""
  if (includeAnswerKey) {
    const keyRows = questions
      .map((q, idx) => {
        const num = q.number || idx + 1
        let key = "-"
        if (q.type === "multiple_choice") {
          const found = q.options?.find(
            (o) => o.id === q.correctOptionId || o.isCorrect === true
          )
          key = found ? found.label : (q.correctOptionId ?? "-")
        } else if (q.type === "pg_kompleks") {
          key =
            q.options
              ?.filter((o) => o.isCorrect)
              .map((o) => o.label || o.text.substring(0, 15))
              .join(", ") || "-"
        } else if (q.type === "true_false") {
          key = q.correctOptionId || "-"
        } else if (q.type === "essay") {
          key = q.rubric || "Sesuai rubrik penilaian pengajar"
        }

        const expCol = includeExplanations
          ? `<td>${escapeHtml(q.explanation || "-")}</td>`
          : ""

        return `
          <tr>
            <td style="text-align: center;">${num}</td>
            <td>${formatQuestionTypeLabel(q.type)}</td>
            <td style="font-weight: bold;">${escapeHtml(key)}</td>
            ${expCol}
          </tr>
        `
      })
      .join("")

    keyTableHtml = `
      <div class="page-break"></div>
      <div class="key-section">
        <h3 style="text-align: center; margin-bottom: 16px;">KUNCI JAWABAN & PEMBAHASAN (DOKUMEN PENGAWAS/PENGAJAR)</h3>
        <table class="key-table">
          <thead>
            <tr>
              <th style="width: 50px;">No.</th>
              <th style="width: 140px;">Bentuk Soal</th>
              <th>Kunci Jawaban / Kriteria</th>
              ${includeExplanations ? "<th>Pembahasan</th>" : ""}
            </tr>
          </thead>
          <tbody>
            ${keyRows}
          </tbody>
        </table>
      </div>
    `
  }

  return `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(header.title)} - E-Imtihan</title>
  <style>
    @page {
      size: A4;
      margin: 1.5cm 1.5cm 1.5cm 1.5cm;
    }
    body {
      font-family: "Segoe UI", Arial, Helvetica, sans-serif;
      font-size: 11pt;
      line-height: 1.45;
      color: #111827;
      margin: 0;
      padding: 0;
    }
    .kop-surat {
      border-bottom: 3px double #1f2937;
      padding-bottom: 10px;
      margin-bottom: 16px;
      text-align: center;
    }
    .kop-institution {
      font-size: 14pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kop-exam {
      font-size: 12pt;
      font-weight: 600;
      margin-top: 4px;
    }
    .meta-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
      font-size: 10pt;
    }
    .meta-table td {
      padding: 2px 4px;
      vertical-align: top;
    }
    .meta-table .label-col {
      width: 15%;
      font-weight: 600;
    }
    .meta-table .divider-col {
      width: 2%;
    }
    .meta-table .val-col {
      width: 33%;
    }
    .student-id-box {
      border: 1px dashed #4b5563;
      padding: 6px 10px;
      margin-bottom: 16px;
      background-color: #f9fafb;
    }
    .question-block {
      margin-bottom: 14px;
      page-break-inside: avoid;
    }
    .question-header {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .question-num {
      font-weight: bold;
      min-width: 22px;
    }
    .question-body {
      flex: 1;
    }
    .points-badge {
      font-size: 8.5pt;
      color: #4b5563;
      border: 1px solid #d1d5db;
      padding: 1px 6px;
      border-radius: 4px;
      white-space: nowrap;
    }
    .stimulus-box {
      background-color: #f3f4f6;
      border-left: 3px solid #6b7280;
      padding: 6px 10px;
      font-size: 10pt;
      margin-bottom: 6px;
      font-style: italic;
    }
    .question-text {
      margin-bottom: 8px;
    }
    .options-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px 16px;
      margin-top: 6px;
    }
    .option-item {
      display: flex;
      gap: 6px;
      align-items: flex-start;
    }
    .option-label {
      font-weight: 600;
      min-width: 16px;
    }
    .tf-choices {
      margin-top: 6px;
      font-weight: 500;
    }
    .essay-lines {
      margin-top: 10px;
    }
    .essay-lines .line {
      border-bottom: 1px dotted #9ca3af;
      height: 24px;
    }
    .page-break {
      page-break-before: always;
    }
    .key-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10pt;
      margin-top: 10px;
    }
    .key-table th, .key-table td {
      border: 1px solid #9ca3af;
      padding: 6px 8px;
      text-align: left;
    }
    .key-table th {
      background-color: #f3f4f6;
    }
    @media print {
      body {
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
    }
  </style>
</head>
<body>
  <div class="kop-surat">
    <div class="kop-institution">${escapeHtml(header.institutionName || "MADRASAH / PESANTREN")}</div>
    <div class="kop-exam">${escapeHtml(header.title)}</div>
  </div>

  <table class="meta-table">
    <tr>
      <td class="label-col">Mata Pelajaran</td>
      <td class="divider-col">:</td>
      <td class="val-col">${escapeHtml(header.subjectName)}</td>
      <td class="label-col">Nama Santri</td>
      <td class="divider-col">:</td>
      <td class="val-col">...................................................</td>
    </tr>
    <tr>
      <td class="label-col">Kelas / Jenjang</td>
      <td class="divider-col">:</td>
      <td class="val-col">${escapeHtml(header.gradeLevel || "-")}</td>
      <td class="label-col">NISN / ID</td>
      <td class="divider-col">:</td>
      <td class="val-col">...................................................</td>
    </tr>
    <tr>
      <td class="label-col">Alokasi Waktu</td>
      <td class="divider-col">:</td>
      <td class="val-col">${header.durationMinutes ? `${header.durationMinutes} Menit` : "Sesuai Jadwal"}</td>
      <td class="label-col">Tanda Tangan</td>
      <td class="divider-col">:</td>
      <td class="val-col">...................................................</td>
    </tr>
  </table>

  <div class="student-id-box">
    <strong>Petunjuk Umum:</strong> Bacalah setiap butir soal dengan teliti sebelum menjawab. Tuliskan jawaban Anda pada lembar pengerjaan yang tersedia dengan tertib, jujur, dan mandiri.
  </div>

  <div class="questions-container">
    ${questionItemsHtml}
  </div>

  ${keyTableHtml}
</body>
</html>`
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}
