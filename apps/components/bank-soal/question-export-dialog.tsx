"use client"

import * as React from "react"
import { CopyIcon, CheckIcon, PrinterIcon, FileTextIcon, SlidersIcon } from "lucide-react"
import { toast } from "sonner"

import {
  formatQuestionsForGoogleForm,
  generatePrintableHtml,
  type ExamExportHeader,
  type ExportableQuestion,
} from "@/lib/exam-export"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"

interface QuestionExportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  questions: ExportableQuestion[]
  header: ExamExportHeader
}

export function QuestionExportDialog({
  open,
  onOpenChange,
  questions,
  header,
}: QuestionExportDialogProps) {
  const [includeAnswerKey, setIncludeAnswerKey] = React.useState(false)
  const [includeExplanations, setIncludeExplanations] = React.useState(false)
  const [isCopied, setIsCopied] = React.useState(false)

  const googleFormText = React.useMemo(() => {
    return formatQuestionsForGoogleForm(questions, header)
  }, [questions, header])

  const handlePrint = () => {
    const htmlContent = generatePrintableHtml(questions, header, {
      includeAnswerKey,
      includeExplanations,
    })

    const printWindow = window.open("", "_blank")
    if (!printWindow) {
      toast.error("Gagal membuka jendela cetak. Pastikan pop-up diizinkan oleh browser.")
      return
    }

    printWindow.document.open()
    printWindow.document.write(htmlContent)
    printWindow.document.close()

    // Biarkan CSS dan DOM selesai dimuat sebelum memicu dialog print
    setTimeout(() => {
      printWindow.focus()
      printWindow.print()
    }, 350)
  }

  const handleCopyGoogleFormText = async () => {
    try {
      await navigator.clipboard.writeText(googleFormText)
      setIsCopied(true)
      toast.success("Teks naskah berhasil disalin ke papan klip.")
      setTimeout(() => setIsCopied(false), 2000)
    } catch {
      toast.error("Gagal menyalin ke papan klip.")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileTextIcon className="size-5 text-primary" />
            Ekspor & Cetak Naskah Soal
          </DialogTitle>
          <DialogDescription>
            Pilih format keluaran naskah ujian untuk keperluan pencetakan fisik atau integrasi ke Google Form.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="print" className="w-full mt-2">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="print" className="flex items-center gap-2">
              <PrinterIcon className="size-4" />
              Naskah Cetak (Fisik)
            </TabsTrigger>
            <TabsTrigger value="google-form" className="flex items-center gap-2">
              <FileTextIcon className="size-4" />
              Format Google Form
            </TabsTrigger>
          </TabsList>

          <TabsContent value="print" className="space-y-4 pt-3">
            <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
              <div className="text-sm font-medium">Pengaturan Naskah Cetak</div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-keys"
                  checked={includeAnswerKey}
                  onCheckedChange={(c) => setIncludeAnswerKey(Boolean(c))}
                />
                <Label htmlFor="include-keys" className="text-sm cursor-pointer">
                  Sertakan lembar Kunci Jawaban (dokumen terpisah untuk pengawas/pengajar)
                </Label>
              </div>

              {includeAnswerKey && (
                <div className="flex items-center space-x-2 ml-6">
                  <Checkbox
                    id="include-exp"
                    checked={includeExplanations}
                    onCheckedChange={(c) => setIncludeExplanations(Boolean(c))}
                  />
                  <Label htmlFor="include-exp" className="text-sm cursor-pointer text-muted-foreground">
                    Sertakan kolom pembahasan butir soal
                  </Label>
                </div>
              )}
            </div>

            <div className="text-xs text-muted-foreground">
              Dokumen akan dibuka dalam jendela baru dengan tata letak resmi madrasah (kop lembaga, petunjuk umum, stimulus, dan alokasi waktu).
            </div>

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Tutup
              </Button>
              <Button onClick={handlePrint} className="gap-2">
                <PrinterIcon className="size-4" />
                Buka Tampilan Cetak
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="google-form" className="space-y-4 pt-3">
            <div className="text-xs text-muted-foreground">
              Salin teks terstruktur berikut untuk dipindahkan ke kuis Google Form atau Google Classroom tanpa perlu menyalin butir satu demi satu.
            </div>

            <Textarea
              readOnly
              value={googleFormText}
              rows={10}
              className="font-mono text-xs bg-muted/20"
            />

            <DialogFooter className="pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Tutup
              </Button>
              <Button onClick={handleCopyGoogleFormText} className="gap-2">
                {isCopied ? <CheckIcon className="size-4 text-emerald-500" /> : <CopyIcon className="size-4" />}
                {isCopied ? "Tersalin" : "Salin Format Teks"}
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
