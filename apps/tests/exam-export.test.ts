import { describe, it } from "node:test"
import assert from "node:assert/strict"
import type { ExportableQuestion, ExamExportHeader } from "../lib/exam-export"

const { formatQuestionsForGoogleForm, generatePrintableHtml } = (await import(
  new URL("../lib/exam-export.ts", import.meta.url).href
)) as typeof import("../lib/exam-export")

describe("Exam Export Utilities", () => {
  const sampleQuestions: ExportableQuestion[] = [
    {
      id: "q1",
      number: 1,
      type: "multiple_choice",
      stimulusText: "Perhatikan ayat berikut sebelum menjawab.",
      questionText: "Berapa rukun Islam yang wajib diketahui?",
      options: [
        { id: "opt-a", label: "A", text: "4", isCorrect: false },
        { id: "opt-b", label: "B", text: "5", isCorrect: true },
        { id: "opt-c", label: "C", text: "6", isCorrect: false },
      ],
      correctOptionId: "opt-b",
      points: 10,
      explanation: "Rukun Islam ada 5 perkara.",
    },
    {
      id: "q2",
      number: 2,
      type: "true_false",
      questionText: "Shalat Shubuh terdiri dari 3 rakaat.",
      correctOptionId: "Salah",
      points: 5,
    },
    {
      id: "q3",
      number: 3,
      type: "essay",
      questionText: "Jelaskan tata cara tayamum secara ringkas!",
      points: 15,
      rubric: "Menjelaskan niat, menepuk debu, dan mengusap wajah serta tangan.",
    },
  ]

  const sampleHeader: ExamExportHeader = {
    title: "Penilaian Akhir Semester Fiqih",
    subjectName: "Fiqih",
    gradeLevel: "Kelas 7 SMPITA",
    institutionName: "Pesantren At-Tauhid",
    durationMinutes: 90,
  }

  it("formats questions into structured Google Form text", () => {
    const text = formatQuestionsForGoogleForm(sampleQuestions, sampleHeader)

    assert.ok(text.includes("JUDUL: Penilaian Akhir Semester Fiqih"))
    assert.ok(text.includes("MATA PELAJARAN: Fiqih"))
    assert.ok(text.includes("[SOAL 1] (Pilihan Ganda) - 10 Poin"))
    assert.ok(text.includes("Stimulus / Wacana:"))
    assert.ok(text.includes("Perhatikan ayat berikut sebelum menjawab."))
    assert.ok(text.includes("Berapa rukun Islam yang wajib diketahui?"))
    assert.ok(text.includes("B. [KUNCI] 5"))
    assert.ok(text.includes("Pembahasan: Rukun Islam ada 5 perkara."))
    assert.ok(text.includes("[SOAL 2] (Benar / Salah) - 5 Poin"))
    assert.ok(text.includes("Pernyataan: Benar / Salah (Kunci: Salah)"))
    assert.ok(text.includes("[SOAL 3] (Uraian / Esai) - 15 Poin"))
    assert.ok(text.includes("Rubrik Penilaian: Menjelaskan niat"))
  })

  it("generates valid and complete printable HTML without keys by default", () => {
    const html = generatePrintableHtml(sampleQuestions, sampleHeader)

    assert.ok(html.includes("<!DOCTYPE html>"))
    assert.ok(html.includes("Pesantren At-Tauhid"))
    assert.ok(html.includes("Penilaian Akhir Semester Fiqih"))
    assert.ok(html.includes("Berapa rukun Islam yang wajib diketahui?"))
    assert.ok(html.includes("90 Menit"))
    assert.ok(!html.includes("KUNCI JAWABAN &amp; PEMBAHASAN"))
    assert.ok(!html.includes("KUNCI JAWABAN & PEMBAHASAN"))
  })

  it("includes answer key section when includeAnswerKey option is true", () => {
    const html = generatePrintableHtml(sampleQuestions, sampleHeader, {
      includeAnswerKey: true,
      includeExplanations: true,
    })

    assert.ok(html.includes("KUNCI JAWABAN & PEMBAHASAN (DOKUMEN PENGAWAS/PENGAJAR)"))
    assert.ok(html.includes("Rukun Islam ada 5 perkara."))
    assert.ok(html.includes("Salah"))
  })
})
