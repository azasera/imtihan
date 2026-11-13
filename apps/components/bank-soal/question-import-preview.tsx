"use client"

import * as React from "react"
import { AlertTriangleIcon, CheckCircle2Icon, KeyRoundIcon, RotateCcwIcon, SparklesIcon } from "lucide-react"
import { toast } from "sonner"

import {
  applyBulkKeyString,
  convertNoOptionItemsToEssay,
  importThinkingLevelLabel,
  importTypeLabel,
  setItemOptionKey,
  setItemType,
  type ImportQuestionType,
  type ParsedImportItem,
} from "@/lib/question-import"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

interface QuestionImportPreviewProps {
  items: ParsedImportItem[]
  /** Nomor urut paket tempat butir pertama hasil impor akan masuk. */
  startOrderNumber: number
  readyCount: number
  problemCount: number
  /** Bentuk naskah yang dikenali saat penafsiran. */
  format: "numbered" | "spreadsheet"
  headerDetected: boolean
  ignoredColumns: string[]
  isSaving: boolean
  savedCount: number
  onSaveAll: () => void
  onSaveReadyOnly: () => void
  onBackToText: () => void
  onItemsChange?: (items: ParsedImportItem[]) => void
}

function statusOf(item: ParsedImportItem) {
  return item.problems.length === 0
    ? { label: "Siap", tone: "text-primary" }
    : { label: "Perlu perbaikan", tone: "text-amber-700 dark:text-amber-400" }
}

function optionsSummary(item: ParsedImportItem): string {
  if (item.type === "essay") return item.rubric ? `rubrik: ${item.rubric}` : "tanpa rubrik"
  if (item.type === "true_false") {
    return item.trueFalseKey ? `kunci: ${item.trueFalseKey}` : "kunci B/S belum ditulis"
  }
  const keys = item.options.filter((o) => o.isCorrect).map((o) => o.label)
  const letters = item.options.map((o) => o.label).join(", ")
  return `${letters || "tanpa opsi"}${keys.length ? ` — kunci ${keys.join(", ")}` : " — belum ada kunci"}`
}

/**
 * Pratinjau hasil tafsiran: satu baris per calon butir beserta status dan alasannya.
 * Belum ada satu butir pun yang masuk ke basis data pada layar ini.
 */
export function QuestionImportPreview({
  items,
  startOrderNumber,
  readyCount,
  problemCount,
  format,
  headerDetected,
  ignoredColumns,
  isSaving,
  savedCount,
  onSaveAll,
  onSaveReadyOnly,
  onBackToText,
  onItemsChange,
}: QuestionImportPreviewProps) {
  const saveLabel = `Simpan ${items.length} butir soal`
  const summaryRef = React.useRef<HTMLDivElement>(null)

  const [bulkKeyText, setBulkKeyText] = React.useState("")
  const [bulkKeyFeedback, setBulkKeyFeedback] = React.useState<string | null>(null)

  React.useEffect(() => {
    summaryRef.current?.focus()
  }, [])

  function handleKeyClick(itemNumber: number, labelOrKey: string) {
    if (isSaving) return
    const nextItems = items.map((item) => {
      if (item.number === itemNumber) {
        return setItemOptionKey(item, labelOrKey)
      }
      return item
    })
    onItemsChange?.(nextItems)
  }

  function handleApplyBulkKeys() {
    if (!bulkKeyText.trim() || isSaving) return
    const result = applyBulkKeyString(items, bulkKeyText)
    if (result.appliedCount > 0) {
      onItemsChange?.(result.items)
      const msg = `${result.appliedCount} kunci jawaban berhasil diterapkan ke naskah soal.`
      setBulkKeyFeedback(msg)
      toast.success(msg)
    } else {
      toast.error("Format kunci tidak dikenali. Contoh yang valid: 1.A 2.B 3.C... atau deretan huruf A B C D A C...")
    }
  }

  const formatNote =
    format === "spreadsheet"
      ? headerDetected
        ? "Bentuk: baris lembar kerja (baris judul dikenali)"
        : "Bentuk: baris lembar kerja (tanpa baris judul, urutan kolom template)"
      : "Bentuk: teks bernomor"

  return (
    <div className="space-y-3">
      <div
        ref={summaryRef}
        tabIndex={-1}
        className="space-y-1 rounded-lg border bg-muted/20 p-3 outline-none focus:ring-2 focus:ring-ring/60 focus:ring-offset-2"
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1.5 font-semibold text-primary">
              <CheckCircle2Icon className="size-4" />
              {readyCount} butir siap disimpan
            </span>
            <span className="text-muted-foreground">|</span>
            <span
              className={`flex items-center gap-1.5 font-semibold ${
                problemCount > 0 ? "text-amber-700 dark:text-amber-400" : "text-muted-foreground"
              }`}
            >
              <AlertTriangleIcon className="size-4" />
              {problemCount} butir perlu perbaikan
            </span>
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">
            masuk mulai nomor urut #{startOrderNumber}
          </span>
        </div>
        <p className="text-[11px] text-muted-foreground">
          {formatNote}
          {ignoredColumns.length > 0 && ` · kolom diabaikan: ${ignoredColumns.join(", ")}`}
        </p>
      </div>

      {/* Banner Perbaikan Cepat: Deteksi Butir Tanpa Opsi Jawaban (Kemungkinan Soal Essay) */}
      {(() => {
        const noOptionCount = items.filter(
          (item) => item.type === "multiple_choice" && item.options.length === 0
        ).length
        if (noOptionCount === 0) return null
        return (
          <div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 space-y-2 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex items-start sm:items-center gap-2">
                <AlertTriangleIcon className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                <span>
                  Terdeteksi <strong>{noOptionCount} butir</strong> tanpa opsi jawaban A-E. Apakah butir ini adalah soal essay / uraian?
                </span>
              </div>
              <button
                type="button"
                disabled={isSaving}
                onClick={() => {
                  const updated = convertNoOptionItemsToEssay(items)
                  onItemsChange?.(updated)
                  toast.success(`${noOptionCount} butir berhasil diubah menjadi soal Essay dan siap disimpan!`)
                }}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 shadow-2xs shrink-0 transition-colors cursor-pointer"
              >
                <SparklesIcon className="size-3.5" />
                <span>Jadikan {noOptionCount} Butir Sebagai Soal Essay</span>
              </button>
            </div>
          </div>
        )
      })()}

      {/* Bilah Tempel Kunci Cepat Massal (Opsi 2) */}
      <div className="rounded-lg border bg-card p-3 space-y-2 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <div className="flex items-center gap-2">
            <KeyRoundIcon className="size-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-foreground">Tempel Kunci Jawaban Massal (Opsional)</span>
          </div>
          <span className="text-[11px] text-muted-foreground">
            Format: 1.A, 2.B, 3.C... atau deretan huruf A B C D A C B D...
          </span>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={bulkKeyText}
            onChange={(e) => setBulkKeyText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                handleApplyBulkKeys()
              }
            }}
            placeholder="Tempel deretan kunci jawaban di sini (misal: A B C D A B C D... atau 1.A 2.C 3.B...)"
            className="flex-1 h-8 rounded-md border border-input bg-background px-3 py-1 text-xs shadow-2xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleApplyBulkKeys}
              disabled={!bulkKeyText.trim() || isSaving}
              className="inline-flex items-center justify-center h-8 px-3 text-xs font-semibold rounded-md bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            >
              Terapkan Kunci
            </button>
            {bulkKeyText && (
              <button
                type="button"
                onClick={() => {
                  setBulkKeyText("")
                  setBulkKeyFeedback(null)
                }}
                className="inline-flex items-center justify-center h-8 px-2 text-xs font-medium rounded-md border border-border bg-background hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
              >
                <RotateCcwIcon className="size-3.5 mr-1" />
                Reset
              </button>
            )}
          </div>
        </div>
        {bulkKeyFeedback && (
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300 font-medium">
            {bulkKeyFeedback} Kunci pada tabel di bawah dapat langsung Anda periksa atau ubah secara mandiri.
          </p>
        )}
      </div>

      {/* Meja pada layar sedang ke atas */}
      <div className="hidden md:block border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted/40 text-left">
              <tr>
                <th className="p-2 font-semibold w-10">#</th>
                <th className="p-2 font-semibold w-28">Tipe</th>
                <th className="p-2 font-semibold w-16">Bobot</th>
                <th className="p-2 font-semibold">Teks &amp; opsi</th>
                <th className="p-2 font-semibold w-40">Pembahasan</th>
                <th className="p-2 font-semibold w-24">Berpikir</th>
                <th className="p-2 font-semibold w-28">Capaian</th>
                <th className="p-2 font-semibold w-40">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((item) => {
                const status = statusOf(item)
                return (
                  <tr key={item.number} className="align-top">
                    <td className="p-2 font-mono text-muted-foreground">{item.number}</td>
                    <td className="p-2">
                      <select
                        value={item.type}
                        disabled={isSaving}
                        onChange={(e) => {
                          const nextType = e.target.value as ImportQuestionType
                          const updated = items.map((it) =>
                            it.number === item.number ? setItemType(it, nextType) : it
                          )
                          onItemsChange?.(updated)
                        }}
                        className="text-[11px] font-medium bg-background border border-border/80 rounded px-1.5 py-1 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
                        title="Ubah tipe butir soal ini"
                      >
                        <option value="multiple_choice">Pilihan Ganda</option>
                        <option value="essay">Essay</option>
                        <option value="true_false">Benar / Salah</option>
                        <option value="pg_kompleks">PG Kompleks</option>
                      </select>
                    </td>
                    <td className="p-2 font-mono">{item.points}</td>
                    <td className="p-2 space-y-1.5">
                      {item.stimulusText && (
                        <p className="text-[11px] italic text-muted-foreground line-clamp-2">
                          Wacana: {item.stimulusText}
                        </p>
                      )}
                      <p className="font-medium leading-snug line-clamp-3">{item.questionText}</p>
                      <p className="text-[11px] text-muted-foreground">{optionsSummary(item)}</p>

                      {/* Tombol Interaktif Pemilih Kunci Opsi 1 */}
                      {item.type === "multiple_choice" && item.options.length > 0 && (
                        <div className="flex items-center gap-1 pt-1 flex-wrap">
                          <span className="text-[11px] font-semibold text-muted-foreground mr-1">Kunci:</span>
                          {item.options.map((opt) => {
                            const isSelected = opt.isCorrect
                            return (
                              <button
                                key={opt.id || opt.label}
                                type="button"
                                onClick={() => handleKeyClick(item.number, opt.label)}
                                disabled={isSaving}
                                className={`inline-flex items-center justify-center size-6 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/40 scale-105"
                                    : "bg-muted/70 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-border/70 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                                }`}
                                title={`Tentukan ${opt.label} sebagai kunci jawaban (${opt.text || "tanpa teks"})`}
                              >
                                {opt.label}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {item.type === "true_false" && (
                        <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                          <span className="text-[11px] font-semibold text-muted-foreground mr-1">Kunci:</span>
                          <button
                            type="button"
                            onClick={() => handleKeyClick(item.number, "Benar")}
                            disabled={isSaving}
                            className={`inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                              item.trueFalseKey === "Benar"
                                ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/40"
                                : "bg-muted/70 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-800 border border-border/70 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                            }`}
                          >
                            Benar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleKeyClick(item.number, "Salah")}
                            disabled={isSaving}
                            className={`inline-flex items-center justify-center px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                              item.trueFalseKey === "Salah"
                                ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/40"
                                : "bg-muted/70 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-800 border border-border/70 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                            }`}
                          >
                            Salah
                          </button>
                        </div>
                      )}

                      {item.type === "pg_kompleks" && item.options.length > 0 && (
                        <div className="flex items-center gap-1 pt-1 flex-wrap">
                          <span className="text-[11px] font-semibold text-muted-foreground mr-1">Kunci (multi):</span>
                          {item.options.map((opt) => {
                            const isSelected = opt.isCorrect
                            return (
                              <button
                                key={opt.id || opt.label}
                                type="button"
                                onClick={() => handleKeyClick(item.number, opt.label)}
                                disabled={isSaving}
                                className={`inline-flex items-center justify-center size-6 text-[11px] font-bold rounded-md transition-all cursor-pointer ${
                                  isSelected
                                    ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/40 scale-105"
                                    : "bg-muted/70 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-300 border border-border/70 dark:hover:bg-emerald-950/40 dark:hover:text-emerald-300"
                                }`}
                                title={`Tandai/Batal kunci ${opt.label}`}
                              >
                                {opt.label}
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </td>
                    <td className="p-2 text-[11px] text-muted-foreground">
                      {item.explanation ? (
                        <span className="line-clamp-3">{item.explanation}</span>
                      ) : (
                        <span className="italic">—</span>
                      )}
                    </td>
                    <td className="p-2 text-[11px]">
                      <span className={item.thinkingLevel ? "text-foreground" : "text-muted-foreground italic"}>
                        {importThinkingLevelLabel(item.thinkingLevel)}
                      </span>
                    </td>
                    <td className="p-2 text-[11px] text-muted-foreground">
                      {item.achievementRef || <span className="italic">—</span>}
                    </td>
                    <td className="p-2">
                      <span className={`font-semibold ${status.tone}`}>{status.label}</span>
                      {item.problems.length > 0 && (
                        <ul className="mt-1 space-y-0.5 text-[11px] text-muted-foreground">
                          {item.problems.map((problem) => (
                            <li key={problem}>{problem}</li>
                          ))}
                        </ul>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Kartu per butir pada layar kecil */}
      <div className="md:hidden space-y-2">
        {items.map((item) => {
          const status = statusOf(item)
          return (
            <Card key={item.number} className="border">
              <CardContent className="p-3 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <Badge variant="outline" className="font-mono">
                    #{item.number}
                  </Badge>
                  <span className={`font-semibold ${status.tone}`}>{status.label}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <select
                    value={item.type}
                    disabled={isSaving}
                    onChange={(e) => {
                      const nextType = e.target.value as ImportQuestionType
                      const updated = items.map((it) =>
                        it.number === item.number ? setItemType(it, nextType) : it
                      )
                      onItemsChange?.(updated)
                    }}
                    className="text-[11px] font-medium bg-background border border-border/80 rounded px-1.5 py-0.5 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer"
                  >
                    <option value="multiple_choice">Pilihan Ganda</option>
                    <option value="essay">Essay</option>
                    <option value="true_false">Benar / Salah</option>
                    <option value="pg_kompleks">PG Kompleks</option>
                  </select>
                  <span className="font-mono">{item.points} poin</span>
                </div>
                {item.stimulusText && (
                  <p className="text-[11px] italic text-muted-foreground">Wacana: {item.stimulusText}</p>
                )}
                <p className="font-medium leading-snug">{item.questionText}</p>
                <p className="text-[11px] text-muted-foreground">{optionsSummary(item)}</p>

                {/* Tombol Interaktif Pemilih Kunci Opsi 1 (Mobile) */}
                {item.type === "multiple_choice" && item.options.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-muted-foreground mr-1">Kunci:</span>
                    {item.options.map((opt) => {
                      const isSelected = opt.isCorrect
                      return (
                        <button
                          key={opt.id || opt.label}
                          type="button"
                          onClick={() => handleKeyClick(item.number, opt.label)}
                          disabled={isSaving}
                          className={`inline-flex items-center justify-center size-7 text-xs font-bold rounded-md transition-all cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/40 scale-105"
                              : "bg-muted/70 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-800 border border-border/70"
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                )}

                {item.type === "true_false" && (
                  <div className="flex items-center gap-2 pt-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-muted-foreground mr-1">Kunci:</span>
                    <button
                      type="button"
                      onClick={() => handleKeyClick(item.number, "Benar")}
                      disabled={isSaving}
                      className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        item.trueFalseKey === "Benar"
                          ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/40"
                          : "bg-muted/70 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-800 border border-border/70"
                      }`}
                    >
                      Benar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleKeyClick(item.number, "Salah")}
                      disabled={isSaving}
                      className={`inline-flex items-center justify-center px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                        item.trueFalseKey === "Salah"
                          ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/40"
                          : "bg-muted/70 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-800 border border-border/70"
                      }`}
                    >
                      Salah
                    </button>
                  </div>
                )}

                {item.type === "pg_kompleks" && item.options.length > 0 && (
                  <div className="flex items-center gap-1.5 pt-1.5 flex-wrap">
                    <span className="text-[11px] font-semibold text-muted-foreground mr-1">Kunci (multi):</span>
                    {item.options.map((opt) => {
                      const isSelected = opt.isCorrect
                      return (
                        <button
                          key={opt.id || opt.label}
                          type="button"
                          onClick={() => handleKeyClick(item.number, opt.label)}
                          disabled={isSaving}
                          className={`inline-flex items-center justify-center size-7 text-xs font-bold rounded-md transition-all cursor-pointer ${
                            isSelected
                              ? "bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/40 scale-105"
                              : "bg-muted/70 text-muted-foreground hover:bg-emerald-50 hover:text-emerald-800 border border-border/70"
                          }`}
                        >
                          {opt.label}
                        </button>
                      )
                    })}
                  </div>
                )}

                <div className="text-[11px] text-muted-foreground space-y-0.5 pt-1">
                  {item.explanation && <p className="line-clamp-2">Pembahasan: {item.explanation}</p>}
                  <p>Tingkat berpikir: {importThinkingLevelLabel(item.thinkingLevel)}</p>
                  {item.achievementRef && <p>Capaian: {item.achievementRef}</p>}
                </div>
                {item.problems.length > 0 && (
                  <ul className="text-[11px] text-muted-foreground space-y-0.5 pt-1 border-t">
                    {item.problems.map((problem) => (
                      <li key={problem}>{problem}</li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
        <Button type="button" variant="ghost" size="sm" className="text-xs" onClick={onBackToText} disabled={isSaving}>
          Periksa ulang naskah
        </Button>
        {problemCount > 0 && readyCount > 0 && (
          <Button type="button" variant="outline" size="sm" className="text-xs" onClick={onSaveReadyOnly} disabled={isSaving}>
            {isSaving
              ? `Menyimpan ${savedCount} dari ${readyCount}...`
              : `Simpan ${readyCount} butir yang siap`}
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          className="text-xs"
          onClick={onSaveAll}
          disabled={isSaving || problemCount > 0 || readyCount === 0}
          title={
            problemCount > 0
              ? "Selesaikan dulu baris yang belum valid, atau simpan hanya butir yang siap."
              : undefined
          }
        >
          {isSaving ? `Menyimpan ${savedCount} dari ${readyCount}...` : saveLabel}
        </Button>
      </div>

      {problemCount > 0 && (
        <p className="text-[11px] text-muted-foreground text-right">
          Tombol utama menunggu sampai semua baris valid. Menyimpan sebagian harus ditekan sengaja.
        </p>
      )}
    </div>
  )
}
