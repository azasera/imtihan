"use client"

import { CheckCircle2Icon, CopyIcon, LayersIcon, PencilIcon, Trash2Icon } from "lucide-react"

import type { Doc } from "@/convex/_generated/dataModel"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface QuestionRowProps {
  question: Doc<"questions">
  typeLabel: string
  /** Paket sedang dipakai sesi yang masih berjalan: aksi baris tidak dapat dipakai. */
  locked: boolean
  lockedReason: string
  isEditing: boolean
  onEdit: (question: Doc<"questions">) => void
  onDuplicate: (question: Doc<"questions">) => void
  onDelete: (question: Doc<"questions">) => void
}

/**
 * Kartu satu butir soal tersimpan beserta aksi per baris: sunting, gandakan, dan hapus.
 * Nomor urut ditampilkan sebagai label teks, bukan hanya sebagai penanda posisi.
 */
export function QuestionRow({
  question,
  typeLabel,
  locked,
  lockedReason,
  isEditing,
  onEdit,
  onDuplicate,
  onDelete,
}: QuestionRowProps) {
  return (
    <Card className={`border shadow-2xs ${isEditing ? "ring-2 ring-primary/40" : ""}`}>
      <CardHeader className="p-3.5 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Badge variant="outline" className="font-mono text-xs">
              #{question.orderNumber}
            </Badge>
            <Badge variant="secondary" className="text-[10px]">
              {typeLabel}
            </Badge>
            {(question.stimulusText || question.stimulusMediaUrl) && (
              <Badge variant="outline" className="text-[10px] border-primary/40 text-primary">
                Stimulus
              </Badge>
            )}
            {isEditing && (
              <Badge variant="outline" className="text-[10px]">
                Sedang disunting
              </Badge>
            )}
            <span className="text-xs font-semibold text-primary font-mono ml-1">
              {question.points} Poin
            </span>
          </div>

          <div className="flex items-center gap-0.5 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => onEdit(question)}
              disabled={locked}
              title={locked ? lockedReason : `Sunting butir nomor ${question.orderNumber}`}
              aria-label={`Sunting butir nomor ${question.orderNumber}`}
            >
              <PencilIcon className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7"
              onClick={() => onDuplicate(question)}
              disabled={locked}
              title={locked ? lockedReason : `Gandakan butir nomor ${question.orderNumber}`}
              aria-label={`Gandakan butir nomor ${question.orderNumber}`}
            >
              <CopyIcon className="size-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-7 text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(question)}
              disabled={locked}
              title={locked ? lockedReason : `Hapus butir nomor ${question.orderNumber}`}
              aria-label={`Hapus butir nomor ${question.orderNumber}`}
            >
              <Trash2Icon className="size-3.5" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-3.5 pt-0 space-y-2 text-xs">
        {question.stimulusText && (
          <div className="p-2 rounded bg-muted/40 border text-[11px] text-muted-foreground italic line-clamp-2">
            {question.stimulusText}
          </div>
        )}

        <p className="whitespace-pre-line leading-relaxed font-medium">
          {question.questionText}
        </p>

        {question.options && (
          <div className="space-y-1 pt-1 border-t text-[11px]">
            {question.options.map((opt) => {
              const isTrueFalse = question.type === "true_false"
              return (
                <div
                  key={opt.id}
                  className={`flex items-center gap-1.5 p-1 px-1.5 rounded ${
                    opt.isCorrect
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground"
                  }`}
                >
                  {!isTrueFalse && (
                    <span className="min-w-5 shrink-0 font-mono">{opt.label}.</span>
                  )}
                  <span className="flex-1">{opt.text || opt.label}</span>
                  {opt.isCorrect && <CheckCircle2Icon className="size-3 text-primary shrink-0" />}
                </div>
              )
            })}
          </div>
        )}

        {question.type === "essay" && question.rubric && (
          <div className="p-2 bg-muted/40 rounded text-[11px] text-muted-foreground border">
            <span className="font-semibold text-foreground">Rubrik:</span> {question.rubric}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/** Keadaan kosong daftar butir: satu ajakan, tanpa aksi ganda yang bersaing. */
export function QuestionListEmpty() {
  return (
    <Card className="border-dashed p-8 text-center text-xs text-muted-foreground space-y-2">
      <LayersIcon className="size-8 mx-auto text-muted-foreground/60" />
      <p>Belum ada butir soal dalam paket ini. Isi formulir di sebelah kiri, atau pilih tab &quot;Tempel banyak sekaligus&quot; bila naskahnya sudah ada.</p>
    </Card>
  )
}
