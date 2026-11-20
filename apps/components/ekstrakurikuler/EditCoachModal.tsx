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
  UserCheckIcon,
  Loader2Icon,
  UserIcon,
  PlusIcon,
  Trash2Icon,
  Edit2Icon,
  ListFilterIcon,
  ShieldIcon,
} from "lucide-react"
import {
  DEFAULT_TEACHERS,
  fetchTeachersFromSipaksa,
  type Teacher,
} from "@/lib/teachers"

export interface CoachItem {
  name: string
  role?: string
}

interface EditCoachModalProps {
  isOpen: boolean
  onClose: () => void
  group: {
    _id: Id<"extracurricularGroups">
    name: string
    coaches?: CoachItem[]
    coachName?: string
    description?: string
  } | null
}

const ROLE_PRESETS = [
  "Koordinator",
  "Pembina Ikhwan",
  "Pembina Akhwat",
  "Pelatih",
  "Asisten",
]

export function EditCoachModal({ isOpen, onClose, group }: EditCoachModalProps) {
  const [coaches, setCoaches] = React.useState<CoachItem[]>([])
  const [description, setDescription] = React.useState("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [teachers, setTeachers] = React.useState<Teacher[]>(DEFAULT_TEACHERS)

  // Form input pembina baru
  const [isManualInput, setIsManualInput] = React.useState(false)
  const [selectedTeacherName, setSelectedTeacherName] = React.useState("")
  const [manualCoachName, setManualCoachName] = React.useState("")
  const [coachRole, setCoachRole] = React.useState("")

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
      if (group.coaches && group.coaches.length > 0) {
        setCoaches(group.coaches)
      } else if (group.coachName) {
        setCoaches([{ name: group.coachName }])
      } else {
        setCoaches([])
      }
      setDescription(group.description || "")
      setSelectedTeacherName("")
      setManualCoachName("")
      setCoachRole("")
      setIsManualInput(false)
    }
  }, [group, isOpen])

  if (!group) return null

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

    // Reset input
    setSelectedTeacherName("")
    setManualCoachName("")
    setCoachRole("")
    toast.success(`Pembina "${nameToAdd}" ditambahkan ke daftar.`)
  }

  const handleRemoveCoach = (index: number) => {
    setCoaches(coaches.filter((_, idx) => idx !== index))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Sertakan otomatis nama pembina jika masih berada di input tetapi belum sempat diklik "Tambahkan"
    let finalCoaches = [...coaches]
    const pendingName = isManualInput ? manualCoachName.trim() : selectedTeacherName.trim()
    if (pendingName && !finalCoaches.some((c) => c.name.toLowerCase() === pendingName.toLowerCase())) {
      finalCoaches.push({
        name: pendingName,
        role: coachRole.trim() || undefined,
      })
    }

    try {
      await updateCoachMutation({
        groupId: group._id,
        coaches: finalCoaches.map((c) => ({
          name: c.name.trim(),
          role: c.role?.trim() || undefined,
        })),
        description: description.trim() || undefined,
      })
      toast.success(`Berhasil memperbarui pembina ${group.name}`)
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
      <DialogContent className="w-[calc(100vw-1.5rem)] sm:max-w-[520px] max-h-[90dvh] overflow-y-auto">
        <DialogHeader className="pr-7">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-full bg-primary/10 text-primary shrink-0">
              <UserCheckIcon className="size-5" />
            </div>
            <div className="min-w-0 flex-1">
              <DialogTitle className="text-sm sm:text-base font-semibold leading-tight">
                Pengaturan Pembina Ekstrakurikuler
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Kelompok: <span className="font-semibold text-foreground">{group.name}</span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSave} className="space-y-4 py-2">
          {/* Daftar Pembina yang Sudah Terdaftar */}
          <div className="space-y-2">
            <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span>Daftar Pembina Aktif ({coaches.length})</span>
              {coaches.length > 1 && (
                <span className="text-[11px] font-normal text-muted-foreground">
                  Multi-Pembina
                </span>
              )}
            </Label>

            {coaches.length === 0 ? (
              <div className="rounded-lg border border-dashed p-3 text-center text-xs text-muted-foreground bg-muted/20">
                Belum ada pembina yang ditugaskan. Tambahkan pembina di bawah ini.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {coaches.map((c, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-muted/30 transition-colors gap-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <div className="size-6 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <UserIcon className="size-3.5" />
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 flex-wrap">
                        <span className="text-xs font-medium text-foreground break-words">
                          {c.name}
                        </span>
                        {c.role && (
                          <Badge
                            variant="secondary"
                            className="text-[10px] font-normal py-0 px-1.5 h-4.5 bg-muted text-muted-foreground shrink-0"
                          >
                            {c.role}
                          </Badge>
                        )}
                      </div>
                    </div>

                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCoach(idx)}
                      className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                      title="Hapus pembina ini"
                    >
                      <Trash2Icon className="size-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Penambahan Pembina Baru */}
          <div className="rounded-lg border p-3 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <ShieldIcon className="size-3.5 text-primary shrink-0" />
                Tambah Pembina
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 text-[11px] px-1.5 text-primary hover:bg-primary/10 gap-1 font-medium"
                onClick={() => {
                  setIsManualInput(!isManualInput)
                  setSelectedTeacherName("")
                  setManualCoachName("")
                }}
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
                  <SelectContent className="max-h-56">
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

              {/* Pilihan Peran Pembina */}
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

          {/* Deskripsi Kegiatan Ekskul */}
          <div className="space-y-1.5">
            <Label htmlFor="desc" className="text-xs font-semibold text-foreground">
              Keterangan / Deskripsi Kegiatan
            </Label>
            <Textarea
              id="desc"
              rows={2}
              placeholder="Deskripsi fokus pembinaan kegiatan ekstrakurikuler ini..."
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
              Simpan Perubahan
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
