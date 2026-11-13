"use client"

import * as React from "react"
import { useMutation } from "convex/react"
import {
  CheckCheckIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CircleDotIcon,
  CopyIcon,
  DownloadIcon,
  FileSpreadsheetIcon,
  FileTextIcon,
  FileUpIcon,
  ListChecksIcon,
  Loader2Icon,
  PlusIcon,
  ScanTextIcon,
  SparklesIcon,
  UploadIcon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { QuestionImportPreview } from "@/components/bank-soal/question-import-preview"
import {
  FORMAT_HINTS,
  IMPORT_EXAMPLE,
  IMPORT_SPREADSHEET_COLUMNS,
  SPREADSHEET_FORMAT_HINTS,
  buildImportTemplateText,
  chunkImportItems,
  parseQuestionImport,
  toImportPayload,
  type ImportParseResult,
  type ImportQuestionType,
  type ParsedImportItem,
} from "@/lib/question-import"
import { extractDocxToImportText } from "@/lib/docx-extractor"
import { Button } from "@/components/ui/button"
import { CardContent, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface ModelSnippet {
  id: "pg" | "true_false" | "pg_kompleks" | "essay"
  label: string
  rule: string
  snippet: string
}

const MODEL_SNIPPETS: ModelSnippet[] = [
  {
    id: "pg",
    label: "Pilihan Ganda",
    rule: "Format standar tanpa penanda kurung. Beri tanda bintang (*) tepat di akhir teks opsi yang benar.",
    snippet: `1. Rukun wudhu yang pertama adalah?
A. Membasuh kedua telinga
B. Membasuh muka*
C. Mengusap kaki
D. Tertib`,
  },
  {
    id: "true_false",
    label: "Benar / Salah",
    rule: "Tulis (benar/salah) setelah nomor soal. Di baris berikutnya, tulis huruf B (Benar) atau S (Salah).",
    snippet: `2. (benar/salah) Shalat Shubuh berjumlah dua rakaat.
B
poin: 5`,
  },
  {
    id: "pg_kompleks",
    label: "PG Kompleks",
    rule: "Tulis (pg kompleks) setelah nomor soal. Beri tanda bintang (*) pada minimal 2 opsi jawaban yang benar.",
    snippet: `3. (pg kompleks) Manakah yang termasuk rukun shalat berikut ini?
A. Niat*
B. Takbiratul Ihram*
C. Membaca doa iftitah
D. Ruku beserta thuma'ninah*`,
  },
  {
    id: "essay",
    label: "Essay / Uraian",
    rule: "Tulis (essay) setelah nomor soal. Tambahkan baris rubrik: ... untuk kriteria penilaian koreksi penguji.",
    snippet: `4. (essay) Jelaskan syarat wajib ibadah puasa Ramadhan.
rubrik: Nilai penuh bila santri menyebutkan Islam, baligh, dan berakal sehat.
poin: 10`,
  },
]

interface QuestionImportPanelProps {
  bankId: Id<"questionBanks">
  /** Nomor urut paket tempat butir hasil impor akan masuk. */
  startOrderNumber: number
  onSaved: (count: number) => void
}

/**
 * Kolom tempel naskah soal, petunjuk format, dan pratinjau hasil tafsiran.
 * Penafsiran berjalan seluruhnya di perangkat pengajar; panggilan server baru terjadi setelah tombol simpan.
 */
export function QuestionImportPanel({ bankId, startOrderNumber, onSaved }: QuestionImportPanelProps) {
  const importQuestions = useMutation(api.bank.public.mutations.importQuestions)

  const [text, setText] = React.useState("")
  const [defaultPoints, setDefaultPoints] = React.useState(5)
  const [showHints, setShowHints] = React.useState(false)
  const [selectedModel, setSelectedModel] = React.useState<"pg" | "true_false" | "pg_kompleks" | "essay">("pg")
  const [parsed, setParsed] = React.useState<ImportParseResult | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [savedCount, setSavedCount] = React.useState(0)
  const [failure, setFailure] = React.useState<{ reason: string; remaining: ParsedImportItem[] } | null>(null)
  const [isReadingFile, setIsReadingFile] = React.useState(false)
  const [isDragging, setIsDragging] = React.useState(false)

  const textAreaRef = React.useRef<HTMLTextAreaElement>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  async function processSelectedFile(file: File) {
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    setIsReadingFile(true)
    try {
      if (extension === ".docx") {
        const buffer = await file.arrayBuffer()
        const result = await extractDocxToImportText(buffer)
        setText(result.text)
        toast.success(
          `Berkas '${file.name}' berhasil dimuat: ${result.questionCount} butir soal terbaca (${result.multipleChoiceCount} pilihan ganda, ${result.essayCount} essay). Silakan klik 'Periksa tulisan' untuk meninjau kartu soal.`
        )
        textAreaRef.current?.focus()
      } else if (extension === ".txt") {
        const textContent = await file.text()
        setText(textContent)
        toast.success(`Berkas teks '${file.name}' berhasil dimuat ke naskah soal.`)
        textAreaRef.current?.focus()
      } else {
        toast.error("Format berkas belum didukung. Harap pilih berkas Word (.docx) atau naskah teks (.txt).")
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal memproses berkas soal.")
    } finally {
      setIsReadingFile(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      void processSelectedFile(file)
    }
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  function handleDragLeave(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) {
      void processSelectedFile(file)
    }
  }

  function handleInsertSnippet(snippet: string, label: string) {
    setText((prev) => {
      const trimmed = prev.trim()
      if (!trimmed) return snippet
      return `${trimmed}\n\n${snippet}`
    })
    toast.success(`Contoh format ${label} disisipkan ke kotak naskah.`)
    textAreaRef.current?.focus()
  }

  function handleCheck() {
    const mappedType: ImportQuestionType =
      selectedModel === "pg"
        ? "multiple_choice"
        : selectedModel
    const result = parseQuestionImport(text, defaultPoints, mappedType)
    if (result.items.length === 0) {
      setParsed(null)
      toast.error(
        `Tidak ada butir yang terbaca. Untuk tempelan lembar kerja, kolom yang dikenali: ${IMPORT_SPREADSHEET_COLUMNS.join(", ")}. Unduh template kolom di atas lalu tempel kembali hasilnya.`,
        { duration: 8000 }
      )
      return
    }
    setFailure(null)
    setSavedCount(0)
    setParsed(result)
  }

  function backToText() {
    setParsed(null)
    setFailure(null)
    setSavedCount(0)
    textAreaRef.current?.focus()
  }

  async function runSave(items: ParsedImportItem[]) {
    const payloads = items.map(toImportPayload)
    setIsSaving(true)
    setSavedCount(0)
    setFailure(null)

    let entered = 0
    for (const chunk of chunkImportItems(payloads)) {
      try {
        await importQuestions({ bankId, items: chunk })
        entered += chunk.length
        setSavedCount(entered)
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Penyimpanan berhenti di tengah tahap."
        const remaining = items.slice(entered)
        setFailure({ reason, remaining })
        // Pratinjau hanya menyisakan butir yang belum masuk, jadi menekan simpan lagi
        // melanjutkan sisa tahap tanpa mengulang butir yang sudah tersimpan.
        setParsed((current) =>
          current
            ? { ...current, items: remaining, readyCount: remaining.length, problemCount: 0 }
            : current
        )
        setIsSaving(false)
        toast.error(`${entered} butir sudah masuk. ${remaining.length} butir belum tersimpan.`)
        return
      }
    }

    setIsSaving(false)
    setParsed(null)
    setText("")
    onSaved(entered)
  }

  async function handleCopyExample() {
    try {
      await navigator.clipboard.writeText(IMPORT_EXAMPLE)
      toast.success("Contoh format disalin. Tempel ke kolom, lalu tekan Periksa tulisan.")
    } catch {
      toast.error("Peramban menolak menyalin ke papan klip. Contoh formatnya tetap tampil di bawah.")
    }
  }

  function handleDownloadTemplate() {
    const blob = new Blob(["\uFEFF" + buildImportTemplateText()], {
      type: "text/tab-separated-values;charset=utf-8",
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.href = url
    link.download = "template-impor-soal.tsv"
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
    toast.success("Template kolom diunduh. Isi di lembar kerja, lalu tempel hasilnya di kolom naskah.")
  }

  if (parsed) {
    const ready = parsed.items.filter((item) => item.problems.length === 0)
    return (
      <CardContent className="space-y-3">
        {failure && (
          <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3 space-y-2">
            <p className="text-xs font-semibold">{failure.reason}</p>
            <p className="text-[11px] text-muted-foreground">
              {savedCount} butir sudah masuk ke paket. Sisa {failure.remaining.length} butir bernomor tafsiran{" "}
              {failure.remaining.map((item) => item.number).join(", ")} masih ada di pratinjau ini — tekan simpan
              sekali lagi untuk melanjutkan, tanpa mengulang yang sudah tersimpan.
            </p>
            <ul className="text-[11px] text-muted-foreground space-y-0.5 max-h-32 overflow-y-auto">
              {failure.remaining.map((item) => (
                <li key={item.number}>
                  <span className="font-mono">#{item.number}</span> {item.questionText.slice(0, 80)}
                </li>
              ))}
            </ul>
          </div>
        )}

        <QuestionImportPreview
          items={parsed.items}
          startOrderNumber={startOrderNumber}
          readyCount={ready.length}
          problemCount={parsed.items.length - ready.length}
          format={parsed.format}
          headerDetected={parsed.headerDetected}
          ignoredColumns={parsed.ignoredColumns}
          isSaving={isSaving}
          savedCount={savedCount}
          onSaveAll={() => runSave(ready)}
          onSaveReadyOnly={() => runSave(ready)}
          onBackToText={backToText}
          onItemsChange={(updatedItems) => {
            setParsed((curr) =>
              curr
                ? {
                    ...curr,
                    items: updatedItems,
                    readyCount: updatedItems.filter((i) => i.problems.length === 0).length,
                    problemCount: updatedItems.filter((i) => i.problems.length > 0).length,
                  }
                : null
            )
          }}
        />
      </CardContent>
    )
  }

  return (
    <>
      <CardContent className="space-y-3.5">
        {/* Panduan 3 Langkah Cepat untuk Pengajar */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 px-3 py-2 rounded-lg bg-muted/40 border border-border/60 text-xs">
          <div className="flex items-center gap-2">
            <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-2xs">1</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-foreground">Siapkan Naskah</span>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">— Salin contoh Word atau unduh format Excel di bawah</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-2xs">2</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-foreground">Tempel ke Kolom</span>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">— Tempel di kotak naskah</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex size-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white shadow-2xs">3</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-semibold text-foreground">Periksa & Simpan</span>
              <span className="text-[11px] text-muted-foreground hidden sm:inline">— Tinjau kartu soal</span>
            </div>
          </div>
        </div>

        {/* Zona Unggah Berkas Langsung (.docx / .txt) */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative rounded-lg border-2 border-dashed p-3 transition-colors ${
            isDragging
              ? "border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/20"
              : "border-border/80 bg-muted/20 hover:bg-muted/30"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".docx,.txt"
            onChange={handleFileChange}
            className="hidden"
            id="upload-soal-file"
          />
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
            <div className="flex items-center gap-3">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300">
                {isReadingFile ? (
                  <Loader2Icon className="size-5 animate-spin" />
                ) : (
                  <FileUpIcon className="size-5" />
                )}
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  Unggah Berkas Dokumen Word (.docx) atau Teks (.txt)
                </p>
                <p className="text-[11px] text-muted-foreground">
                  Tarik berkas naskah soal Anda ke sini, atau klik tombol untuk memilih dari komputer.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {text.trim() !== "" && (
                <button
                  type="button"
                  onClick={handleCheck}
                  className="inline-flex items-center justify-center h-7 px-3 text-xs font-semibold rounded-md border border-emerald-600/40 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 dark:hover:bg-emerald-950 shadow-2xs gap-1.5 transition-colors cursor-pointer"
                  title="Periksa tulisan naskah yang terunggah"
                >
                  <ScanTextIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Periksa naskah</span>
                </button>
              )}
              <button
                type="button"
                disabled={isReadingFile}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center justify-center h-7 px-3 text-xs font-semibold rounded-md border border-emerald-600/30 bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs gap-1.5 transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
              >
                {isReadingFile ? (
                  <>
                    <Loader2Icon className="size-3.5 animate-spin" />
                    <span>Membaca berkas...</span>
                  </>
                ) : (
                  <>
                    <UploadIcon className="size-3.5" />
                    <span>Pilih Berkas Soal</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 2 Pilihan Format Sumber Naskah yang Familiar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Sumber 1: Microsoft Word / Teks */}
          <div className="rounded-lg border bg-card p-3 space-y-2 flex flex-col justify-between shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <FileTextIcon className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Naskah Dokumen Word / Teks</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Tulis soal bernomor (1, 2, 3...) dan opsi (A, B, C...). Bubuhkan tanda bintang (<strong className="text-foreground font-mono">*</strong>) tepat di akhir opsi jawaban yang benar.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 w-full bg-background hover:bg-muted font-medium"
              onClick={handleCopyExample}
            >
              <CopyIcon className="size-3.5 text-emerald-600" />
              Salin contoh format
            </Button>
          </div>

          {/* Sumber 2: Microsoft Excel / Spreadsheet */}
          <div className="rounded-lg border bg-card p-3 space-y-2 flex flex-col justify-between shadow-2xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                <FileSpreadsheetIcon className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Tabel Excel / Spreadsheet</span>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Unduh template tabel, isi baris soal dan kunci jawaban di Excel, lalu salin seluruh tabel dan tempel langsung ke kotak naskah.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1.5 w-full bg-background hover:bg-muted font-medium"
              onClick={handleDownloadTemplate}
            >
              <DownloadIcon className="size-3.5 text-emerald-600" />
              Unduh template kolom
            </Button>
          </div>
        </div>

        {/* Panduan & Contoh Format 4 Model Soal */}
        <div className="rounded-lg border bg-card p-3 space-y-2.5 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-foreground">
                Panduan Format 4 Model Soal (Naskah Campuran)
              </p>
              <p className="text-[11px] text-muted-foreground">
                Satu naskah dapat memuat campuran semua model soal sekaligus. Klik penanda di bawah untuk melihat contoh formatnya:
              </p>
            </div>
          </div>

          {/* Pill Penanda Sintaks Model Soal (Bukan Tab Pengalih Form) */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
            {MODEL_SNIPPETS.map((m) => {
              const isSelected = selectedModel === m.id
              return (
                <button
                  type="button"
                  key={m.id}
                  onClick={() => setSelectedModel(m.id)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                    isSelected
                      ? "border-emerald-600/40 bg-emerald-50/80 text-emerald-900 dark:bg-emerald-950/50 dark:border-emerald-700/60 dark:text-emerald-200 font-semibold shadow-2xs"
                      : "border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground"
                  }`}
                >
                  {m.id === "pg" && <CircleDotIcon className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                  {m.id === "true_false" && <CheckCheckIcon className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                  {m.id === "pg_kompleks" && <ListChecksIcon className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                  {m.id === "essay" && <FileTextIcon className="size-3 shrink-0 text-emerald-600 dark:text-emerald-400" />}
                  <span>{m.label}</span>
                </button>
              )
            })}
          </div>

          {/* Active Model Preview & Insert Snippet Button */}
          {(() => {
            const currentSnippet = MODEL_SNIPPETS.find((m) => m.id === selectedModel) ?? MODEL_SNIPPETS[0]
            return (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-2.5 space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-foreground">
                      Aturan Penulisan: {currentSnippet.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      {currentSnippet.rule}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleInsertSnippet(currentSnippet.snippet, currentSnippet.label)}
                    className="inline-flex items-center justify-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-md text-xs font-medium border border-emerald-600/30 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100 hover:text-emerald-900 dark:bg-emerald-950/40 dark:border-emerald-800/40 dark:text-emerald-300 dark:hover:bg-emerald-950/70 transition-colors shadow-2xs"
                  >
                    <PlusIcon className="size-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Sisipkan Contoh Ini</span>
                  </button>
                </div>
                <pre className="text-[11px] font-mono bg-muted/40 border border-border/40 rounded-md p-2.5 text-muted-foreground hover:text-foreground select-all overflow-x-auto whitespace-pre leading-relaxed transition-colors">
                  {currentSnippet.snippet}
                </pre>
              </div>
            )
          })()}
        </div>

        {/* Kotak Tempel Naskah Soal & Toolbar Input */}
        <div className="space-y-2 pt-1 border-t">
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="space-y-0.5">
              <Label htmlFor="import-text" className="text-xs font-semibold text-foreground">
                Tempel naskah soal
              </Label>
              <p className="text-[11px] text-muted-foreground">
                Bentuk dikenali otomatis: teks bernomor atau baris lembar kerja berpisahkan tab.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Pengaturan Bobot Nilai Bawaan */}
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md border bg-muted/30">
                <Label htmlFor="import-default-points" className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                  Bobot bawaan:
                </Label>
                <Input
                  id="import-default-points"
                  type="number"
                  min={1}
                  max={100}
                  value={defaultPoints}
                  onChange={(e) => setDefaultPoints(Number(e.target.value))}
                  className="h-6 w-11 text-xs text-center font-bold p-0 bg-background"
                />
                <span className="text-[11px] text-muted-foreground">poin</span>
              </div>

              {/* Tombol Contoh Latihan Langsung */}
              <button
                type="button"
                className="inline-flex items-center h-7 px-2.5 text-xs text-emerald-700 dark:text-emerald-300 hover:text-emerald-800 dark:hover:text-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-md gap-1.5 font-medium transition-colors border border-emerald-600/25 bg-background shadow-2xs cursor-pointer"
                onClick={() => {
                  setText(IMPORT_EXAMPLE)
                  toast.success("Contoh naskah soal dimasukkan. Klik 'Periksa tulisan' untuk melihat kartu soal.")
                }}
              >
                <SparklesIcon className="size-3.5 text-emerald-600" />
                <span>Isi Contoh Latihan Langsung</span>
              </button>

              {/* Tombol Aksi Praktis: Periksa Tulisan Tepat di Atas Textarea */}
              <button
                type="button"
                disabled={text.trim() === ""}
                onClick={handleCheck}
                className="inline-flex items-center justify-center h-7 px-3 text-xs font-semibold rounded-md border border-emerald-600/30 bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs gap-1.5 transition-colors disabled:opacity-50 shrink-0 cursor-pointer disabled:cursor-not-allowed"
                title={text.trim() === "" ? "Tempel naskah soal lebih dulu" : "Periksa tulisan sekarang (Ctrl+Enter)"}
              >
                <ScanTextIcon className="size-3.5" />
                <span>Periksa tulisan</span>
                <kbd className="hidden md:inline-flex items-center text-[10px] font-mono px-1 py-0.2 rounded bg-emerald-700/60 text-emerald-100 border border-emerald-500/30">
                  Ctrl+Enter
                </kbd>
              </button>
            </div>
          </div>

          <Textarea
            id="import-text"
            ref={textAreaRef}
            rows={9}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                e.preventDefault()
                if (text.trim() !== "") {
                  handleCheck()
                }
              }
            }}
            placeholder="Tempel naskah soal Anda di sini (Ctrl+V)... Tekan Ctrl+Enter untuk langsung periksa tulisan."
            className="text-xs font-mono leading-relaxed placeholder:font-sans placeholder:text-muted-foreground/60"
          />
        </div>

        {/* Petunjuk Format Lengkap (Bisa Dilipat) */}
        <div className="space-y-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground -ml-2"
            onClick={() => setShowHints((open) => !open)}
          >
            {showHints ? <ChevronDownIcon className="size-3.5" /> : <ChevronRightIcon className="size-3.5" />}
            Petunjuk format teks
          </Button>

          {showHints && (
            <div className="space-y-2">
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
                <p className="text-[11px] font-semibold">Petunjuk format teks bernomor</p>
                <ol className="space-y-1.5 text-[11px] text-muted-foreground list-decimal list-inside">
                  {FORMAT_HINTS.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ol>
              </div>
              <div className="rounded-lg border bg-muted/20 p-3 space-y-1.5">
                <p className="text-[11px] font-semibold">Petunjuk tempelan lembar kerja</p>
                <ol className="space-y-1.5 text-[11px] text-muted-foreground list-decimal list-inside">
                  {SPREADSHEET_FORMAT_HINTS.map((hint) => (
                    <li key={hint}>{hint}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-3 pb-3 border-t flex flex-wrap items-center justify-between gap-3 sticky bottom-0 bg-card/95 backdrop-blur-xs z-10 shadow-xs">
        <p className="text-xs text-muted-foreground">
          {text.trim() === ""
            ? "Tempelkan naskah soal di atas untuk mulai memeriksa butir soal."
            : "Naskah soal terisi. Tekan 'Periksa tulisan' atau pintasan Ctrl+Enter untuk meninjau."}
        </p>
        <Button
          type="button"
          size="sm"
          className="gap-2 text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm h-8 px-4"
          onClick={handleCheck}
          disabled={text.trim() === ""}
          title={text.trim() === "" ? "Tempel naskah soal lebih dulu" : "Periksa tulisan sekarang (Ctrl+Enter)"}
        >
          <ScanTextIcon className="size-4" />
          <span>Periksa tulisan</span>
          <kbd className="hidden sm:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-700/60 text-emerald-100 border border-emerald-500/30">
            Ctrl+Enter
          </kbd>
        </Button>
      </CardFooter>
    </>
  )
}
