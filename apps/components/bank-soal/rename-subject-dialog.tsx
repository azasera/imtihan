"use client"

import * as React from "react"
import { PencilIcon } from "lucide-react"
import { toast } from "sonner"

import type { Id } from "@/convex/_generated/dataModel"
import { normalizeSubjectCode } from "@/convex/model/institutions"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface RenameSubjectDialogProps {
  subject: {
    id: Id<"subjects">
    code: string
    name: string
    description?: string
    bankCount?: number
    isActive?: boolean
  }
  onRename: (name: string, description: string, code?: string) => Promise<void>
}

/**
 * Sunting mata pelajaran.
 * Mengizinkan pengubahan nama, deskripsi, dan kode singkat.
 * Bila kode diubah, pembaruan beruntun diterapkan ke paket-paket terkait.
 */
export function RenameSubjectDialog({ subject, onRename }: RenameSubjectDialogProps) {
  const [open, setOpen] = React.useState(false)
  const [name, setName] = React.useState(subject.name)
  const [code, setCode] = React.useState(subject.code)
  const [description, setDescription] = React.useState(subject.description ?? "")
  const [isSaving, setIsSaving] = React.useState(false)

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (nextOpen) {
      setName(subject.name)
      setCode(subject.code)
      setDescription(subject.description ?? "")
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const trimmedName = name.trim()
    const normalizedCode = normalizeSubjectCode(code)

    if (!trimmedName) {
      toast.error("Nama mata pelajaran harus diisi.")
      return
    }
    if (!normalizedCode) {
      toast.error("Kode singkat mata pelajaran harus diisi, misalnya FIQIH atau B_ARAB.")
      return
    }

    try {
      setIsSaving(true)
      await onRename(trimmedName, description.trim(), normalizedCode)
      setOpen(false)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Perubahan mata pelajaran gagal disimpan.")
    } finally {
      setIsSaving(false)
    }
  }

  const bankCount = subject.bankCount ?? 0

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" className="text-xs h-7 px-2.5 gap-1.5 font-medium">
            <PencilIcon className="size-3 text-muted-foreground" />
            Sunting
          </Button>
        }
      />
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 mr-6">
            <DialogTitle className="font-heading text-base">Sunting Mata Pelajaran</DialogTitle>
            <Badge variant="outline" className="text-[11px] font-mono px-2 py-0.5">
              {bankCount} paket terhubung
            </Badge>
          </div>
          <DialogDescription className="text-xs">
            Perubahan nama dan kode berlaku langsung di seluruh daftar paket dan riwayat soal.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-1">
          <div className="space-y-1.5">
            <Label htmlFor={`edit-subject-name-${subject.id}`}>Nama Mata Pelajaran *</Label>
            <Input
              id={`edit-subject-name-${subject.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Misal: Fiqih Ibadah"
              required
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor={`edit-subject-code-${subject.id}`}>Kode Singkat *</Label>
              <span className="text-[11px] text-muted-foreground font-mono">
                Bawaan: {subject.code}
              </span>
            </div>
            <Input
              id={`edit-subject-code-${subject.id}`}
              className="font-mono uppercase"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Misal: FIQIH"
              required
            />
            <p className="text-[11px] text-muted-foreground">
              {bankCount > 0
                ? `Mengubah kode otomatis memperbarui referensi pada ${bankCount} paket bank soal terkait.`
                : "Kode singkat huruf besar unik sebagai pengenal paket."}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={`edit-subject-desc-${subject.id}`}>Deskripsi (Opsional)</Label>
            <Textarea
              id={`edit-subject-desc-${subject.id}`}
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Cakupan materi ringkas mata pelajaran ini..."
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSaving}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
