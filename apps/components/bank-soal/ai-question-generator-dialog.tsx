"use client"

import * as React from "react"
import { BotIcon, SparklesIcon, CopyIcon, CheckIcon, Wand2Icon, FileTextIcon } from "lucide-react"
import { toast } from "sonner"

import {
  buildAiQuestionPrompt,
  generateQuickDraftByTopic,
  type AiPromptOptions,
} from "@/lib/ai-question-generator"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

interface AiQuestionGeneratorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subjectName: string
  gradeLevel?: string
  onApplyDraft: (generatedText: string) => void
}

export function AiQuestionGeneratorDialog({
  open,
  onOpenChange,
  subjectName,
  gradeLevel,
  onApplyDraft,
}: AiQuestionGeneratorDialogProps) {
  const [topic, setTopic] = React.useState("")
  const [questionType, setQuestionType] = React.useState<AiPromptOptions["questionType"]>("multiple_choice")
  const [thinkingLevel, setThinkingLevel] = React.useState<AiPromptOptions["thinkingLevel"]>("mixed")
  const [count, setCount] = React.useState(5)
  const [additional, setAdditional] = React.useState("")
  const [draftResult, setDraftResult] = React.useState("")
  const [isCopied, setIsCopied] = React.useState(false)

  const handleGenerate = () => {
    if (!topic.trim()) {
      toast.error("Silakan isi topik atau materi pembelajaran terlebih dahulu.")
      return
    }

    const text = generateQuickDraftByTopic({
      subjectName,
      topic: topic.trim(),
      gradeLevel,
      questionType,
      count,
      thinkingLevel,
      additionalInstructions: additional.trim() || undefined,
    })

    setDraftResult(text)
    toast.success("Draf naskah soal berhasil disusun.")
  }

  const handleCopyPrompt = async () => {
    if (!topic.trim()) {
      toast.error("Silakan isi topik materi terlebih dahulu.")
      return
    }

    const prompt = buildAiQuestionPrompt({
      subjectName,
      topic: topic.trim(),
      gradeLevel,
      questionType,
      count,
      thinkingLevel,
      additionalInstructions: additional.trim() || undefined,
    })

    try {
      await navigator.clipboard.writeText(prompt)
      setIsCopied(true)
      toast.success("Prompt instruksi AI berhasil disalin. Tempelkan di Gemini atau ChatGPT.")
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast.error("Gagal menyalin prompt ke papan klip.")
    }
  }

  const handleApply = () => {
    if (!draftResult.trim()) {
      toast.error("Belum ada naskah draf yang dihasilkan.")
      return
    }
    onApplyDraft(draftResult)
    onOpenChange(false)
    toast.success("Draf berhasil diterapkan ke lembar pratinjau impor.")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SparklesIcon className="size-5 text-amber-500" />
            Asisten Penyusun Soal AI
          </DialogTitle>
          <DialogDescription>
            Bantu asatidzah merancang butir soal secara cepat berdasarkan materi pelajaran dan tingkat berpikir (LOTS/HOTS).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ai-topic">Topik / Materi Pembelajaran *</Label>
              <Input
                id="ai-topic"
                placeholder="misal: Rukun Wudhu & Tayammum"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-type">Bentuk Soal</Label>
              <Select
                value={questionType}
                onValueChange={(v) => setQuestionType(v as AiPromptOptions["questionType"])}
              >
                <SelectTrigger id="ai-type">
                  <SelectValue placeholder="Pilih bentuk soal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="multiple_choice">Pilihan Ganda</SelectItem>
                  <SelectItem value="true_false">Benar / Salah</SelectItem>
                  <SelectItem value="essay">Uraian / Esai</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="ai-thinking">Tingkat Kognitif</Label>
              <Select
                value={thinkingLevel}
                onValueChange={(v) => setThinkingLevel(v as AiPromptOptions["thinkingLevel"])}
              >
                <SelectTrigger id="ai-thinking">
                  <SelectValue placeholder="Pilih tingkat kognitif" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mixed">Campuran (LOTS & HOTS)</SelectItem>
                  <SelectItem value="mengingat">Mengingat (C1)</SelectItem>
                  <SelectItem value="memahami">Memahami (C2)</SelectItem>
                  <SelectItem value="mengaplikasikan">Mengaplikasikan (C3)</SelectItem>
                  <SelectItem value="menganalisis">Menganalisis (C4)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ai-count">Jumlah Butir Draf</Label>
              <Select
                value={count.toString()}
                onValueChange={(v) => setCount(Number(v))}
              >
                <SelectTrigger id="ai-count">
                  <SelectValue placeholder="Jumlah soal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">3 Butir Soal</SelectItem>
                  <SelectItem value="5">5 Butir Soal</SelectItem>
                  <SelectItem value="10">10 Butir Soal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1">
            <Button onClick={handleGenerate} className="gap-2">
              <Wand2Icon className="size-4" />
              Susun Draf Otomatis
            </Button>
            <Button variant="outline" onClick={handleCopyPrompt} className="gap-2">
              {isCopied ? <CheckIcon className="size-4 text-emerald-500" /> : <CopyIcon className="size-4" />}
              {isCopied ? "Prompt Tersalin" : "Salin Prompt untuk Gemini / ChatGPT"}
            </Button>
          </div>

          {draftResult && (
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Hasil Draf Naskah (Format Impor Terstandar)
                </Label>
                <span className="text-xs text-muted-foreground">Siap diperiksa di pratinjau</span>
              </div>
              <Textarea
                readOnly
                value={draftResult}
                rows={8}
                className="font-mono text-xs bg-muted/20"
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          {draftResult && (
            <Button onClick={handleApply} className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
              <CheckIcon className="size-4" />
              Terapkan ke Impor Soal
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
