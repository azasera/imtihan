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
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  TrophyIcon,
  Loader2Icon,
  UserIcon,
  PlusIcon,
  Trash2Icon,
  Edit2Icon,
  ListFilterIcon,
  UsersIcon,
} from "lucide-react"
import {
  DEFAULT_TEACHERS,
  fetchTeachersFromSipaksa,
  type Teacher,
} from "@/lib/teachers"
import type { CoachItem } from "./EditCoachModal"

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (newGroupId: Id<"extracurricularGroups">, groupName: string) => void
}

const ROLE_PRESETS = [
  "Koordinator",
  "Pembina Ikhwan",
  "Pembina Akhwat",
  "Pelatih",
  "Asisten",
]

export function CreateGroupModal({ isOpen, onClose, onSuccess }: CreateGroupModalProps) {
  const [name, setName] = React.useState("")
  const [category, setCategory] = React.useState<"pilihan" | "wajib">("pilihan")
  const [genderRestriction, setGenderRestriction] = React.useState<"all" | "ikhwan" | "akhwat">("all")
  const [description, setDescription] = React.useState("")
  const [coaches, setCoaches] = React.useState<CoachItem[]>([])

  // Form input pembina baru
  const [isManualInput, setIsManualInput] = React.useState(false)
  const [selectedTeacherName, setSelectedTeacherName] = React.useState("")
  const [manualCoachName, setManualCoachName] = React.useState("")
  const [coachRole, setCoachRole] = React.useState("")

  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [teachers, setTeachers] = React.useState<Teacher[]>(DEFAULT_TEACHERS)

  const createGroupMutation = useMutation(
    api.extracurricular.public.mutations.createGroup
  )

  // Ambil daftar guru resmi dari SiPAKSa secara asinkron
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

  // Reset form saat modal dibuka
  React.useEffect(() => {
    if (isOpen) {
      setName("")
      setCategory("pilihan")
      setGenderRestriction("all")
      setDescription("")
      setCoaches([])
      setSelectedTeacherName("")
      setManualCoachName("")
      setCoachRole("")
      setIsManualInput(false)
    }
  }, [isOpen])

  const handleAddCoach = () => {
    const nameToAdd = isManualInput ? manualCoachName.trim() : selectedTeacherName.trim()
    if (!nameToAdd) {
      toast.error("Silakan pilih guru atau ketik nama pembina terlebih dahulu.")
      return
    }

    if (coaches.some((c) => c.name.toLowerCase() === nameToAdd.toLowerCase())) {
      toast.error(`Pembina "${nameToAdd}" sudah ada dalam daftar.`)
      return
    }

    setCoaches([
      ...coaches,
      {
        name: nameToAdd,
        role: coachRole.trim() || undefined,
      },
    ])

    setSelectedTeacherName("")
    setManualCoachName("")
    setCoachRole("")
    toast.success(`Pembina "${nameToAdd}" ditambahkan ke daftar.`)
  }

  const handleRemoveCoach = (index: number) => {
    setCoaches(coaches.filter((_, idx) => idx !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) {
      toast.error("Nama cabang ekstrakurikuler wajib diisi.")
      return
    }

    setIsSubmitting(true)

    // Sertakan otomatis nama pembina jika masih berada di kotak input belum sempat diklik "Tambahkan"
    let finalCoaches = [...coaches]
    const pendingName = isManualInput ? manualCoachName.trim() : selectedTeacherName.trim()
    if (pendingName && !finalCoaches.some((c) => c.name.toLowerCase() === pendingName.toLowerCase())) {
      finalCoaches.push({
        name: pendingName,
        role: coachRole.trim() || undefined,
      })
    }

    try {
      const res = await createGroupMutation({
        name: trimmedName,
        category,
        genderRestriction,
        description: description.trim() || undefined,
        coaches: finalCoaches.map((c) => ({
          name: c.name.trim(),
          role: c.role?.trim() || undefined,
        })),
      })

      toast.success(`Cabang ekskul "${trimmedName}" berhasil ditambahkan!`)
      onSuccess(res.groupId, trimmedName)
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan cabang ekskul baru"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[560px] max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="pr-7">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
              <TrophyIcon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-sm sm:text-base font-semibold leading-tight">
                Tambah Cabang Ekstrakurikuler Baru
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5 truncate sm:whitespace-normal">
                Buka kelompok kegiatan ekskul baru untuk santri pada semester aktif
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* 1. Nama Cabang Ekskul */}
          <div className="space-y-1.5">
            <Label htmlFor="group-name" className="text-xs font-semibold text-foreground">
              Nama Cabang Ekskul <span className="text-destructive">*</span>
            </Label>
            <Input
              id="group-name"
              placeholder="Contoh: Robotik & Coding, Pencak Silat, Renang..."
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-xs h-9"
              autoFocus
              required
            />
          </div>

          {/* 2. Kategori & Batasan Gender (2 Kolom Responsif) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Kategori */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Kategori Kegiatan
              </Label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => setCategory("pilihan")}
                  className={`p-2 rounded-lg border text-xs text-center transition-all ${
                    category === "pilihan"
                      ? "bg-blue-50 text-blue-800 border-blue-400 font-semibold dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-700"
                      : "bg-background hover:bg-muted text-muted-foreground border-border"
                  }`}
                >
                  Pilihan
                </button>
                <button
                  type="button"
                  onClick={() => setCategory("wajib")}
                  className={`p-2 rounded-lg border text-xs text-center transition-all ${
                    category === "wajib"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-400 font-semibold dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-700"
                      : "bg-background hover:bg-muted text-muted-foreground border-border"
                  }`}
                >
                  Wajib
                </button>
              </div>
            </div>

            {/* Batasan Gender */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground">
                Peserta Santri
              </Label>
              <Select
                value={genderRestriction}
                onValueChange={(val) => {
                  if (val === "all" || val === "ikhwan" || val === "akhwat") {
                    setGenderRestriction(val)
                  }
                }}
              >
                <SelectTrigger className="w-full text-xs h-9 bg-background">
                  <SelectValue placeholder="Pilih batasan peserta" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Semua (Putra & Putri)</SelectItem>
                  <SelectItem value="ikhwan">Khusus Putra (Ikhwan)</SelectItem>
                  <SelectItem value="akhwat">Khusus Putri (Akhwat)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* 3. Pembina Awal (Opsional) */}
          <div className="rounded-lg border p-3 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <UsersIcon className="size-3.5 text-primary shrink-0" />
                Penugasan Pembina (Opsional)
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] px-1.5 text-primary hover:bg-primary/10 gap-1 font-medium ml-auto"
                onClick={() => {
                  setIsManualInput(!isManualInput)
                  setSelectedTeacherName("")
                  setManualCoachName("")
                }}
              >
                {isManualInput ? (
                  <>
                    <ListFilterIcon className="size-3" />
                    Pilih dari Guru SiPAKSa
                  </>
                ) : (
                  <>
                    <Edit2Icon className="size-3" />
                    Input Manual (Pelatih Luar)
                  </>
                )}
              </Button>
            </div>

            {/* List Pembina Terpilih */}
            {coaches.length > 0 && (
              <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                {coaches.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-1.5 px-2.5 rounded-md border bg-card text-xs gap-2"
                  >
                    <div className="flex items-center gap-1.5 min-w-0 flex-1 truncate">
                      <UserIcon className="size-3 text-muted-foreground shrink-0" />
                      <span className="font-medium text-foreground truncate">{c.name}</span>
                      {c.role && (
                        <Badge
                          variant="secondary"
                          className="text-[10px] font-normal py-0 px-1.5 h-4 bg-muted text-muted-foreground shrink-0"
                        >
                          {c.role}
                        </Badge>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCoach(idx)}
                      className="size-6 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    >
                      <Trash2Icon className="size-3" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {/* Input Pembina Baru */}
            <div className="space-y-2">
              {!isManualInput ? (
                <Select
                  value={selectedTeacherName}
                  onValueChange={(val) => {
                    if (val === "__MANUAL__") {
                      setIsManualInput(true)
                      setSelectedTeacherName("")
                    } else if (val) {
                      setSelectedTeacherName(val)
                    } else {
                      setSelectedTeacherName("")
                    }
                  }}
                >
                  <SelectTrigger className="w-full text-xs h-9 bg-background">
                    <SelectValue placeholder="-- Pilih Guru / Pembina (SMP/SMA/MTA) --" />
                  </SelectTrigger>
                  <SelectContent className="max-h-52">
                    {teachers.map((t) => (
                      <SelectItem key={t.id || t.name} value={t.name}>
                        <div className="flex items-center justify-between gap-2 w-full text-xs">
                          <span className="font-medium truncate">{t.name}</span>
                          <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0 ml-auto">
                            {t.institution}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                    <SelectItem value="__MANUAL__">
                      <span className="text-muted-foreground italic text-xs">
                        + Input Manual (Pelatih Luar)...
                      </span>
                    </SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="relative">
                  <UserIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                  <Input
                    placeholder="Ketik nama pembina / pelatih luar..."
                    value={manualCoachName}
                    onChange={(e) => setManualCoachName(e.target.value)}
                    className="pl-8 text-xs h-9 bg-background"
                  />
                </div>
              )}

              {/* Peran Pembina */}
              <div className="space-y-1.5">
                <Input
                  placeholder="Peran (opsional, contoh: Pembina Ikhwan / Pelatih)..."
                  value={coachRole}
                  onChange={(e) => setCoachRole(e.target.value)}
                  className="text-xs h-8 bg-background w-full"
                />
                <div className="flex flex-wrap gap-1 pt-0.5">
                  {ROLE_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCoachRole(preset)}
                      className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                        coachRole === preset
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background hover:bg-muted text-muted-foreground"
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleAddCoach}
                  className="text-xs h-8 gap-1.5 font-medium w-full sm:w-auto"
                >
                  <PlusIcon className="size-3.5" />
                  Tambahkan ke Daftar
                </Button>
              </div>
            </div>
          </div>

          {/* 4. Deskripsi / Fokus Pembinaan */}
          <div className="space-y-1.5">
            <Label htmlFor="group-desc" className="text-xs font-semibold text-foreground">
              Deskripsi / Fokus Pembinaan (Opsional)
            </Label>
            <Textarea
              id="group-desc"
              rows={2}
              placeholder="Contoh: Penguasaan teknik dasar, latihan rutin mingguan, dan persiapan kompetisi..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="text-xs resize-none leading-relaxed"
            />
          </div>

          <DialogFooter className="flex flex-col-reverse sm:flex-row gap-2 pt-2 border-t">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs w-full sm:w-auto"
            >
              Batal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs gap-1.5 font-medium bg-emerald-700 hover:bg-emerald-800 text-white w-full sm:w-auto"
            >
              {isSubmitting && <Loader2Icon className="size-3.5 animate-spin" />}
              Buat Cabang Ekskul
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
