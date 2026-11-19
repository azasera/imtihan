"use client"

import * as React from "react"
import { useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { UserCheckIcon, Loader2Icon, UserIcon, Edit2Icon, ListFilterIcon } from "lucide-react"
import {
  DEFAULT_TEACHERS,
  fetchTeachersFromSipaksa,
  type Teacher,
} from "@/lib/teachers"

interface EditCoachModalProps {
  isOpen: boolean
  onClose: () => void
  group: {
    _id: Id<"extracurricularGroups">
    name: string
    coachName?: string
    coachNiy?: string
    description?: string
  } | null
}

export function EditCoachModal({ isOpen, onClose, group }: EditCoachModalProps) {
  const [coachName, setCoachName] = React.useState("")
  const [coachNiy, setCoachNiy] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [teachers, setTeachers] = React.useState<Teacher[]>(DEFAULT_TEACHERS)
  const [isManualInput, setIsManualInput] = React.useState(false)

  const updateCoachMutation = useMutation(
    api.extracurricular.public.mutations.updateGroupCoach
  )

  // Ambil daftar guru resmi dari SiPAKSa secara asinkron dengan fallback DEFAULT_TEACHERS
  React.useEffect(() => {
    let isMounted = true
    fetchTeachersFromSipaksa().then((list) => {
      if (isMounted && list && list.length > 0) {
        setTeachers(list)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  React.useEffect(() => {
    if (group && isOpen) {
      const name = group.coachName || ""
      const niy = group.coachNiy || ""
      setCoachName(name)
      setCoachNiy(niy)
      setDescription(group.description || "")

      // Jika nama sudah ada tapi bukan bagian dari daftar guru resmi, buka mode manual
      if (name && !teachers.some((t) => t.name.toLowerCase() === name.toLowerCase())) {
        setIsManualInput(true)
      } else {
        setIsManualInput(false)
      }
    }
  }, [group, isOpen, teachers])

  if (!group) return null

  const handleTeacherSelect = (val: string) => {
    if (val === "__MANUAL__") {
      setIsManualInput(true)
      return
    }
    const matched = teachers.find((t) => t.name === val)
    setCoachName(val)
    if (matched?.niy && matched.niy !== "-") {
      setCoachNiy(matched.niy)
    } else {
      setCoachNiy("")
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      await updateCoachMutation({
        groupId: group._id,
        coachName: coachName.trim(),
        coachNiy: coachNiy.trim() || undefined,
        description: description.trim() || undefined,
      })
      toast.success(`Berhasil memperbarui data pembina ${group.name}`)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui data pembina"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <UserCheckIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Pengaturan Pembina & Informasi Ekskul
              </DialogTitle>
              <DialogDescription className="text-xs">
                Kelompok Ekstrakurikuler: <span className="font-semibold text-foreground">{group.name}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {/* Header Seleksi Guru */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-foreground">
                Nama Pembina / Pelatih
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] px-2 text-primary hover:bg-primary/10 gap-1 font-medium"
                onClick={() => setIsManualInput(!isManualInput)}
              >
                {isManualInput ? (
                  <>
                    <ListFilterIcon className="size-3" />
                    Pilih dari Daftar Guru
                  </>
                ) : (
                  <>
                    <Edit2Icon className="size-3" />
                    Input Manual (Pelatih Luar)
                  </>
                )}
              </Button>
            </div>

            {!isManualInput ? (
              <Select
                value={
                  teachers.some((t) => t.name.toLowerCase() === coachName.toLowerCase())
                    ? teachers.find((t) => t.name.toLowerCase() === coachName.toLowerCase())?.name
                    : ""
                }
                onValueChange={(val) => {
                  if (val) handleTeacherSelect(val)
                }}
              >
                <SelectTrigger className="w-full text-xs h-9 bg-background">
                  <SelectValue placeholder="-- Pilih Guru / Pembina (SMP/SMA/MTA) --" />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {teachers.map((t) => (
                    <SelectItem key={t.id || t.name} value={t.name}>
                      <div className="flex items-center justify-between gap-2 w-full text-xs">
                        <span className="font-medium truncate">{t.name}</span>
                        <div className="flex items-center gap-1 shrink-0 ml-auto">
                          {t.niy && t.niy !== "-" && (
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {t.niy}
                            </span>
                          )}
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                            {t.institution}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                  <SelectItem value="__MANUAL__">
                    <span className="text-muted-foreground italic text-xs">
                      + Input Nama Pelatih Luar (Manual)...
                    </span>
                  </SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="relative">
                <UserIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                <Input
                  placeholder="Ketik nama pelatih / instruktur luar..."
                  value={coachName}
                  onChange={(e) => setCoachName(e.target.value)}
                  className="pl-8 text-xs h-9"
                />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="coachNiy" className="text-xs">
              Nomor Induk Yayasan (NIY) / NIP Pembina
            </Label>
            <Input
              id="coachNiy"
              placeholder="Terisi otomatis saat memilih guru, atau ketik manual..."
              value={coachNiy}
              onChange={(e) => setCoachNiy(e.target.value)}
              className="text-xs h-9 font-mono"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="desc" className="text-xs">
              Keterangan / Deskripsi Kegiatan
            </Label>
            <Textarea
              id="desc"
              rows={3}
              placeholder="Deskripsi fokus pembinaan kegiatan ekstrakurikuler ini..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs resize-none leading-relaxed"
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs gap-1.5 font-medium"
            >
              {isSubmitting && <Loader2Icon className="size-3.5 animate-spin" />}
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
