"use client"

import * as React from "react"
import { UploadIcon, DownloadIcon, CheckCircle2Icon, AlertTriangleIcon, XCircleIcon, FileSpreadsheetIcon } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  parseExcelFile,
  matchExcelToStudents,
  filterMatchedResults,
  type ImportMatchResult,
  type StudentRecord,
} from "@/lib/excel-grade-import"
import { downloadGradeTemplate } from "@/lib/rapor-template"

interface GradeImportModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Nama mapel untuk ditampilkan */
  subjectName: string
  subjectCode: string
  className: string
  students: StudentRecord[]
  onConfirm: (
    results: ImportMatchResult[],
    targetColumn: "PH" | "STS" | "SAS"
  ) => Promise<void>
}

type TargetColumn = "PH" | "STS" | "SAS"

const TARGET_COLUMN_LABELS: Record<TargetColumn, string> = {
  PH: "PH / Tugas",
  STS: "STS / PTS",
  SAS: "SAS / PAS",
}

type ImportStep = "setup" | "preview"

export function GradeImportModal({
  open,
  onOpenChange,
  subjectName,
  subjectCode,
  className,
  students,
  onConfirm,
}: GradeImportModalProps) {
  const [step, setStep] = React.useState<ImportStep>("setup")
  const [targetColumn, setTargetColumn] = React.useState<TargetColumn>("STS")
  const [isDragging, setIsDragging] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [matchResults, setMatchResults] = React.useState<ImportMatchResult[]>([])
  const [fileName, setFileName] = React.useState<string>("")
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Reset saat modal ditutup
  React.useEffect(() => {
    if (!open) {
      setStep("setup")
      setMatchResults([])
      setFileName("")
      setIsProcessing(false)
      setIsSaving(false)
    }
  }, [open])

  const handleDownloadTemplate = () => {
    const templateStudents = students.map((s, idx) => ({
      no: idx + 1,
      nisn: s.nisn,
      name: s.name,
    }))
    downloadGradeTemplate(templateStudents, className, subjectCode, subjectName, targetColumn)
    toast.success(`Template ${subjectCode} — ${className} berhasil diunduh!`)
  }

  const processFile = async (file: File) => {
    const ext = file.name.split(".").pop()?.toLowerCase()
    if (!["xlsx", "xls", "csv"].includes(ext ?? "")) {
      toast.error("Format file tidak didukung. Gunakan .xlsx, .xls, atau .csv")
      return
    }

    setIsProcessing(true)
    setFileName(file.name)

    try {
      const parsed = await parseExcelFile(file)
      if (parsed.length === 0) {
        toast.error("File tidak mengandung data yang dapat dibaca. Pastikan format sesuai template.")
        setIsProcessing(false)
        return
      }

      const results = matchExcelToStudents(parsed, students)
      setMatchResults(results)
      setStep("preview")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal membaca file Excel")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await processFile(file)
    // Reset input agar file yang sama bisa dipilih ulang
    e.target.value = ""
  }

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) await processFile(file)
  }

  const handleConfirm = async () => {
    const toSave = filterMatchedResults(matchResults)
    if (toSave.length === 0) {
      toast.error("Tidak ada nilai yang cocok untuk disimpan.")
      return
    }

    setIsSaving(true)
    try {
      await onConfirm(toSave, targetColumn)
      onOpenChange(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan nilai")
    } finally {
      setIsSaving(false)
    }
  }

  // Statistik preview
  const matchedCount = matchResults.filter(
    (r) => r.status === "matched_nisn" || r.status === "matched_name"
  ).length
  const noValueCount = matchResults.filter((r) => r.status === "no_value").length
  const unmatchedCount = matchResults.filter((r) => r.status === "unmatched").length
  const readyToSave = filterMatchedResults(matchResults).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <FileSpreadsheetIcon className="size-5 text-emerald-600" />
            Import Nilai dari Excel
          </DialogTitle>
          <DialogDescription className="text-xs">
            {subjectName} ({subjectCode}) — Kelas {className}
          </DialogDescription>
        </DialogHeader>

        {/* ── STEP 1: Setup ── */}
        {step === "setup" && (
          <div className="space-y-4 py-2">
            {/* Pilih kolom target */}
            <div>
              <p className="text-xs font-semibold mb-2 text-foreground">
                1. Nilai ini untuk kolom apa?
              </p>
              <div className="flex gap-2">
                {(["PH", "STS", "SAS"] as TargetColumn[]).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setTargetColumn(col)}
                    className={cn(
                      "flex-1 py-2 px-3 rounded-lg border text-xs font-medium transition-all",
                      targetColumn === col
                        ? "bg-emerald-700 text-white border-emerald-800"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    {TARGET_COLUMN_LABELS[col]}
                  </button>
                ))}
              </div>
            </div>

            {/* Unduh Template */}
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-2">
              <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                2. (Opsional) Unduh Template
              </p>
              <p className="text-[11px] text-muted-foreground">
                Template berisi daftar {students.length} santri kelas {className}. Isi kolom nilai,
                lalu upload kembali.
              </p>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="gap-1.5 text-xs text-emerald-700 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"
              >
                <DownloadIcon className="size-3.5" />
                Unduh Template Kelas {className} — {subjectCode}.xlsx
              </Button>
            </div>

            {/* Drop zone */}
            <div>
              <p className="text-xs font-semibold mb-2 text-foreground">3. Upload File Nilai</p>
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-8 cursor-pointer transition-all",
                  isDragging
                    ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20"
                    : "border-border hover:border-emerald-500/50 hover:bg-muted/30"
                )}
              >
                {isProcessing ? (
                  <>
                    <FileSpreadsheetIcon className="size-8 text-emerald-500 animate-pulse" />
                    <p className="text-xs text-muted-foreground">Membaca file...</p>
                  </>
                ) : (
                  <>
                    <UploadIcon className="size-8 text-muted-foreground/50" />
                    <div className="text-center">
                      <p className="text-xs font-medium text-foreground">
                        Klik untuk pilih file, atau seret ke sini
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Mendukung: .xlsx, .xls, .csv
                      </p>
                    </div>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="sr-only"
                  aria-label="Pilih file Excel atau CSV"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2: Preview ── */}
        {step === "preview" && (
          <div className="space-y-3 py-2">
            {/* Ringkasan */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/40 rounded-lg border text-xs">
              <span className="text-muted-foreground">File:</span>
              <span className="font-medium truncate max-w-48">{fileName}</span>
              <span className="text-muted-foreground ml-auto">Kolom target:</span>
              <Badge variant="outline" className="text-emerald-700 dark:text-emerald-400 border-emerald-500/40">
                {TARGET_COLUMN_LABELS[targetColumn]}
              </Badge>
            </div>

            {/* Statistik */}
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20">
                <CheckCircle2Icon className="size-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-800 dark:text-emerald-300">{matchedCount} cocok</p>
                  <p className="text-[10px] text-muted-foreground">Siap disimpan: {readyToSave}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20">
                <AlertTriangleIcon className="size-4 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold text-amber-800 dark:text-amber-300">{noValueCount} tanpa nilai</p>
                  <p className="text-[10px] text-muted-foreground">Tidak akan disimpan</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 p-2 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-500/20">
                <XCircleIcon className="size-4 text-red-500 shrink-0" />
                <div>
                  <p className="font-bold text-red-800 dark:text-red-300">{unmatchedCount} tidak cocok</p>
                  <p className="text-[10px] text-muted-foreground">Dilewati</p>
                </div>
              </div>
            </div>

            {/* Tabel preview */}
            <div className="overflow-x-auto border rounded-lg max-h-72 overflow-y-auto">
              <table className="w-full text-xs border-collapse">
                <thead className="sticky top-0 bg-muted/90 backdrop-blur-sm">
                  <tr className="border-b text-left font-semibold">
                    <th className="p-2 w-10 text-center">No</th>
                    <th className="p-2 w-28">NISN</th>
                    <th className="p-2 min-w-40">Nama Santri</th>
                    <th className="p-2 w-20 text-center">Nilai</th>
                    <th className="p-2 w-28 text-center">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {matchResults.map((r, idx) => (
                    <tr
                      key={r.santriId}
                      className={cn(
                        "border-b",
                        r.status === "unmatched" && "opacity-50",
                        r.status === "no_value" && "bg-amber-50/40 dark:bg-amber-950/10"
                      )}
                    >
                      <td className="p-2 text-center text-muted-foreground">{idx + 1}</td>
                      <td className="p-2 font-mono text-[10px]">{r.nisn || "—"}</td>
                      <td className="p-2">
                        <span className="font-medium">{r.studentName}</span>
                        {r.excelName && r.status === "matched_name" && (
                          <span className="block text-[10px] text-muted-foreground">
                            (Excel: {r.excelName})
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-center font-bold">
                        {r.value !== null ? r.value : "—"}
                      </td>
                      <td className="p-2 text-center">
                        {r.status === "matched_nisn" && (
                          <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20">
                            ✓ NISN
                          </Badge>
                        )}
                        {r.status === "matched_name" && (
                          <Badge variant="outline" className="text-[10px] text-blue-700 border-blue-400 bg-blue-50/50 dark:bg-blue-950/20">
                            ✓ Nama
                          </Badge>
                        )}
                        {r.status === "no_value" && (
                          <Badge variant="outline" className="text-[10px] text-amber-700 border-amber-400 bg-amber-50/50">
                            ⚠ Tanpa Nilai
                          </Badge>
                        )}
                        {r.status === "unmatched" && (
                          <Badge variant="outline" className="text-[10px] text-muted-foreground border-border">
                            — Dilewati
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Tombol ganti file */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setStep("setup")}
              className="text-xs text-muted-foreground gap-1.5"
            >
              ← Ganti File / Kolom Target
            </Button>
          </div>
        )}

        <DialogFooter className="gap-2 mt-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)} className="text-xs">
            Batal
          </Button>
          {step === "preview" && (
            <Button
              size="sm"
              onClick={handleConfirm}
              disabled={isSaving || readyToSave === 0}
              className="gap-1.5 text-xs bg-emerald-700 hover:bg-emerald-800 text-white"
            >
              {isSaving ? (
                <>
                  <FileSpreadsheetIcon className="size-3.5 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle2Icon className="size-3.5" />
                  Simpan {readyToSave} Nilai {TARGET_COLUMN_LABELS[targetColumn]}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
