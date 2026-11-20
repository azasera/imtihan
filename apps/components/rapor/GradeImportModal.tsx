"use client"

import * as React from "react"
import {
  UploadIcon,
  DownloadIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  XCircleIcon,
  FileSpreadsheetIcon,
  ArrowLeftIcon,
} from "lucide-react"
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
    targetColumn?: "PH" | "STS" | "SAS"
  ) => Promise<void>
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
  const [targetColumn, setTargetColumn] = React.useState<"PH" | "STS" | "SAS">("STS")
  const [isMultiColumnMode, setIsMultiColumnMode] = React.useState(true)
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
      setIsMultiColumnMode(true)
    }
  }, [open])

  const handleDownloadTemplate = () => {
    const templateStudents = students.map((s, idx) => ({
      no: idx + 1,
      nisn: s.nisn,
      name: s.name,
    }))
    downloadGradeTemplate(templateStudents, className, subjectCode, subjectName)
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

      const hasMulti = parsed.some(
        (p) => p.ph !== null || p.sts !== null || p.sas !== null
      )
      setIsMultiColumnMode(hasMulti)

      const results = matchExcelToStudents(parsed, students, targetColumn)
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
  const matchedList = matchResults.filter(
    (r) => r.status === "matched_nisn" || r.status === "matched_name"
  )
  const matchedCount = matchedList.length
  const noValueCount = matchResults.filter((r) => r.status === "no_value").length
  const unmatchedCount = matchResults.filter((r) => r.status === "unmatched").length
  const readyToSave = filterMatchedResults(matchResults).length

  const phCount = matchedList.filter((r) => r.ph !== null).length
  const stsCount = matchedList.filter((r) => r.sts !== null).length
  const sasCount = matchedList.filter((r) => r.sas !== null).length

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-3xl max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="pr-7">
          <DialogTitle className="flex items-center gap-2 text-sm sm:text-base font-semibold leading-tight min-w-0">
            <FileSpreadsheetIcon className="size-5 text-emerald-600 shrink-0" />
            <span className="truncate">Import Nilai dari Excel</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate sm:whitespace-normal">
            {subjectName} ({subjectCode}) — Kelas {className}
          </DialogDescription>
        </DialogHeader>

        {/* ── STEP 1: Setup ── */}
        {step === "setup" && (
          <div className="space-y-4 py-2">
            {/* Unduh Template 3-in-1 */}
            <div className="rounded-lg border border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                    Template Excel 3-in-1 (PH, STS, SAS)
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Satu file template memuat kolom No, NISN, Nama Santri, PH, STS, dan SAS.
                    Unduh template, isi nilai pada kolom terkait, lalu unggah kembali.
                  </p>
                </div>
                <Badge variant="outline" className="text-[10px] text-emerald-700 dark:text-emerald-300 border-emerald-500/40 shrink-0">
                  Format 3 Nilai
                </Badge>
              </div>

              <div className="pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadTemplate}
                  className="gap-1.5 text-xs text-emerald-700 dark:text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10"
                >
                  <DownloadIcon className="size-3.5" />
                  Unduh Template Kelas {className} — {subjectCode}.xlsx
                </Button>
              </div>
            </div>

            {/* Drop zone */}
            <div>
              <p className="text-xs font-semibold mb-2 text-foreground">Upload File Nilai</p>
              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragging(true)
                }}
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
                    <p className="text-xs text-muted-foreground">Membaca file Excel...</p>
                  </>
                ) : (
                  <>
                    <UploadIcon className="size-8 text-muted-foreground/50" />
                    <div className="text-center">
                      <p className="text-xs font-medium text-foreground">
                        Klik untuk pilih file, atau seret ke sini
                      </p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        Mendukung file Excel (.xlsx, .xls, .csv)
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
            {/* Ringkasan File */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/40 rounded-lg border text-xs">
              <div className="flex items-center gap-2 min-w-0">
                <FileSpreadsheetIcon className="size-4 text-emerald-600 shrink-0" />
                <span className="font-medium truncate max-w-xs">{fileName}</span>
              </div>
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px]",
                  isMultiColumnMode
                    ? "text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                    : "text-blue-700 dark:text-blue-300 border-blue-500/40"
                )}
              >
                {isMultiColumnMode ? "Format 3 Nilai Sekaligus (PH, STS, SAS)" : "Format Nilai Tunggal"}
              </Badge>
            </div>

            {/* Statistik */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20">
                <CheckCircle2Icon className="size-4 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold text-emerald-800 dark:text-emerald-300">
                    {matchedCount} Santri Cocok
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {isMultiColumnMode
                      ? `PH: ${phCount} • STS: ${stsCount} • SAS: ${sasCount} terisi`
                      : `Siap disimpan: ${readyToSave}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-500/20">
                <AlertTriangleIcon className="size-4 text-amber-600 shrink-0" />
                <div>
                  <p className="font-bold text-amber-800 dark:text-amber-300">
                    {noValueCount} Tanpa Nilai
                  </p>
                  <p className="text-[10px] text-muted-foreground">Tidak mengubah nilai eksisting</p>
                </div>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-500/20">
                <XCircleIcon className="size-4 text-red-500 shrink-0" />
                <div>
                  <p className="font-bold text-red-800 dark:text-red-300">
                    {unmatchedCount} Tidak Cocok
                  </p>
                  <p className="text-[10px] text-muted-foreground">Dilewati (di luar kelas ini)</p>
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
                    <th className="p-2 w-16 text-center">PH</th>
                    <th className="p-2 w-16 text-center">STS</th>
                    <th className="p-2 w-16 text-center">SAS</th>
                    <th className="p-2 w-24 text-center">Status</th>
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
                        {r.ph !== null ? r.ph : "—"}
                      </td>
                      <td className="p-2 text-center font-bold">
                        {r.sts !== null ? r.sts : "—"}
                      </td>
                      <td className="p-2 text-center font-bold">
                        {r.sas !== null ? r.sas : "—"}
                      </td>
                      <td className="p-2 text-center">
                        {r.status === "matched_nisn" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-emerald-700 border-emerald-400 bg-emerald-50/50 dark:bg-emerald-950/20"
                          >
                            ✓ NISN
                          </Badge>
                        )}
                        {r.status === "matched_name" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-blue-700 border-blue-400 bg-blue-50/50 dark:bg-blue-950/20"
                          >
                            ✓ Nama
                          </Badge>
                        )}
                        {r.status === "no_value" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-amber-700 border-amber-400 bg-amber-50/50"
                          >
                            Tanpa Nilai
                          </Badge>
                        )}
                        {r.status === "unmatched" && (
                          <Badge
                            variant="outline"
                            className="text-[10px] text-muted-foreground border-border"
                          >
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
              <ArrowLeftIcon className="size-3.5" />
              Ganti File
            </Button>
          </div>
        )}

        <DialogFooter className="gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="text-xs"
          >
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
                  Simpan Nilai ({readyToSave} Santri)
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
