"use client"

import { MinusIcon, PlusIcon } from "lucide-react"

import {
  MAX_CHOICE_OPTIONS,
  MIN_CHOICE_OPTIONS,
  addChoiceOption,
  removeChoiceOption,
  type QuestionOptionDraft,
} from "@/lib/question-options"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

interface QuestionOptionsEditorProps {
  options: QuestionOptionDraft[]
  /** "single" = satu kunci jawaban (pilihan ganda), "multiple" = kunci majemuk (PG kompleks). */
  keyMode: "single" | "multiple"
  onChange: (options: QuestionOptionDraft[]) => void
}

/**
 * Daftar opsi jawaban dengan pengatur jumlah opsi dua sampai lima (A sampai E).
 * Batas bawah dan atas menonaktifkan tombol, bukan menyembunyikannya.
 */
export function QuestionOptionsEditor({ options, keyMode, onChange }: QuestionOptionsEditorProps) {
  const helperText =
    keyMode === "single"
      ? "Pilih radio untuk 1 kunci jawaban"
      : "Centang minimal 2 kunci jawaban"

  function handleTextChange(index: number, text: string) {
    onChange(options.map((opt, i) => (i === index ? { ...opt, text } : opt)))
  }

  function handleSetSingleKey(index: number) {
    onChange(options.map((opt, i) => ({ ...opt, isCorrect: i === index })))
  }

  function handleToggleKey(index: number) {
    onChange(options.map((opt, i) => (i === index ? { ...opt, isCorrect: !opt.isCorrect } : opt)))
  }

  function handleAdd() {
    onChange(addChoiceOption(options))
  }

  function handleRemove(index: number) {
    onChange(removeChoiceOption(options, index))
  }

  return (
    <div className="space-y-2.5 pt-1">
      <div className="flex items-center justify-between gap-2">
        <Label className="text-xs font-semibold">
          {keyMode === "single"
            ? "Pilihan Opsi Jawaban & Kunci"
            : "Pilihan Opsi Jawaban & Kunci Majemuk"}
        </Label>
        <span className="text-[11px] text-muted-foreground">{helperText}</span>
      </div>

      <div className="space-y-2">
        {options.map((opt, idx) => (
          <div
            key={opt.id}
            className={`flex items-center gap-2 p-2 rounded-lg border transition-colors ${
              opt.isCorrect ? "border-primary/60 bg-primary/5" : "bg-card"
            }`}
          >
            {keyMode === "single" ? (
              <input
                type="radio"
                name={`correct-option-${keyMode}`}
                id={`opt-radio-${opt.id}`}
                checked={opt.isCorrect}
                onChange={() => handleSetSingleKey(idx)}
                className="size-4 text-primary accent-primary cursor-pointer shrink-0"
                title="Tandai sebagai kunci jawaban"
              />
            ) : (
              <Checkbox
                id={`opt-check-${opt.id}`}
                checked={opt.isCorrect}
                onCheckedChange={() => handleToggleKey(idx)}
                className="size-4 shrink-0 cursor-pointer"
              />
            )}
            <Label
              htmlFor={keyMode === "single" ? `opt-radio-${opt.id}` : `opt-check-${opt.id}`}
              className="w-5 text-center font-bold text-xs shrink-0 cursor-pointer"
            >
              {opt.label}.
            </Label>
            <Input
              placeholder={`Teks pilihan jawaban ${opt.label}...`}
              value={opt.text}
              onChange={(e) => handleTextChange(idx, e.target.value)}
              className="h-8 text-xs bg-background"
            />
            {opt.isCorrect && (
              <Badge variant="default" className="text-[10px] bg-primary h-6 px-2 shrink-0">
                Kunci
              </Badge>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 shrink-0 text-muted-foreground hover:bg-muted"
              onClick={() => handleRemove(idx)}
              disabled={options.length <= MIN_CHOICE_OPTIONS}
              title={
                options.length <= MIN_CHOICE_OPTIONS
                  ? `Minimal ${MIN_CHOICE_OPTIONS} opsi jawaban`
                  : `Kurangi opsi ${opt.label}`
              }
              aria-label={`Kurangi opsi ${opt.label}`}
            >
              <MinusIcon className="size-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs flex-1"
          onClick={handleAdd}
          disabled={options.length >= MAX_CHOICE_OPTIONS}
          title={
            options.length >= MAX_CHOICE_OPTIONS
              ? `Maksimal ${MAX_CHOICE_OPTIONS} opsi jawaban (A sampai E)`
              : "Tambah satu opsi jawaban"
          }
        >
          <PlusIcon className="size-3.5" />
          Tambah Opsi
        </Button>
        <span className="text-[11px] text-muted-foreground shrink-0">
          {MIN_CHOICE_OPTIONS}-{MAX_CHOICE_OPTIONS} opsi (A sampai E)
        </span>
      </div>
    </div>
  )
}
