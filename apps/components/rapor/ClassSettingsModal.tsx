"use client"

import * as React from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@/convex/_generated/api"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "sonner"
import { SlidersHorizontal, Save, Calendar, User, CopyCheck, Loader2, ExternalLink, RotateCw } from "lucide-react"
import {
  DEFAULT_TEACHERS,
  fetchTeachersFromSipaksa,
  fetchClassroomsFromSipaksa,
  getTeacherForClass,
  type Teacher,
  type ClassroomItem,
} from "@/lib/teachers"

export interface ClassSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  academicYear: string
  semester: 1 | 2
  currentClass: string
  availableClasses: string[]
  onSaved?: () => void
}

export function ClassSettingsModal({
  isOpen,
  onClose,
  academicYear,
  semester,
  currentClass,
  availableClasses,
  onSaved,
}: ClassSettingsModalProps) {
  const [selectedClass, setSelectedClass] = React.useState<string>(currentClass || availableClasses[0] || "")
  const [homeroomName, setHomeroomName] = React.useState("")
  const [homeroomNiy, setHomeroomNiy] = React.useState("")
  const [reportDate, setReportDate] = React.useState("Pangkalpinang, 19 Desember 2025")
  const [principalName, setPrincipalName] = React.useState("Meditoma, S.Pd.")
  const [principalNiy, setPrincipalNiy] = React.useState("199405220720181024")
  const [isSaving, setIsSaving] = React.useState(false)
  const [isApplyingAll, setIsApplyingAll] = React.useState(false)
  const [teachers, setTeachers] = React.useState<Teacher[]>(DEFAULT_TEACHERS)
  const [classrooms, setClassrooms] = React.useState<ClassroomItem[]>([])
  const [isManualInput, setIsManualInput] = React.useState(false)

  // Ambil daftar guru dan data kelas dari SiPAKSa secara asinkron
  React.useEffect(() => {
    let isMounted = true
    fetchTeachersFromSipaksa().then((list) => {
      if (isMounted && list && list.length > 0) {
        setTeachers(list)
      }
    })
    fetchClassroomsFromSipaksa().then((list) => {
      if (isMounted && list && list.length > 0) {
        setClassrooms(list)
      }
    })
    return () => {
      isMounted = false
    }
  }, [])

  // Ambil pengaturan yang ada di database untuk kelas terpilih
  const existingSetting = useQuery(
    api.rapor.public.queries.getClassSettings,
    isOpen && selectedClass
      ? {
          className: selectedClass,
          academicYear,
          semester,
        }
      : "skip"
  )

  const saveClassSettingMutation = useMutation(api.rapor.public.mutations.saveClassSetting)
  const batchApplyMutation = useMutation(api.rapor.public.mutations.batchApplyDateAndPrincipal)

  // Sinkronkan state lokal saat setting dari backend dimuat atau kelas berganti
  React.useEffect(() => {
    if (!selectedClass) return

    const detected = getTeacherForClass(selectedClass, classrooms, teachers)

    if (existingSetting && existingSetting.className === selectedClass) {
      const name = existingSetting.homeroomTeacherName || ""
      const rawNiy = existingSetting.homeroomTeacherNiy || ""
      const cleanNiy = rawNiy === "-" ? "" : rawNiy

      // Jika NIY di setting tersimpan masih kosong, otomatis gunakan NIY resmi dari SiPAKSa / default
      const matchedTeacher = teachers.find((t) => t.name.toLowerCase() === name.trim().toLowerCase())
      const fallbackNiy = detected?.niy || matchedTeacher?.niy || ""
      const resolvedNiy = cleanNiy || (fallbackNiy !== "-" ? fallbackNiy : "")

      setHomeroomName(name)
      setHomeroomNiy(resolvedNiy)
      setReportDate(existingSetting.reportDate || "Pangkalpinang, 19 Desember 2025")
      setPrincipalName(existingSetting.principalName || "Meditoma, S.Pd.")
      setPrincipalNiy(existingSetting.principalNiy || "199405220720181024")

      // Cek apakah nama wali kelas ada di daftar guru
      const isKnown = teachers.some((t) => t.name.toLowerCase() === name.trim().toLowerCase())
      setIsManualInput(!isKnown && name.trim() !== "")
    } else if (detected) {
      // Jika belum tersimpan di database, otomatis deteksi wali kelas dari data resmi SiPAKSa
      setHomeroomName(detected.name)
      const cleanDetectedNiy = detected.niy && detected.niy !== "-" ? detected.niy : ""
      setHomeroomNiy(cleanDetectedNiy)
      setIsManualInput(false)
    }
  }, [existingSetting, selectedClass, classrooms, teachers])

  const handleClassChange = (newClass: string | null) => {
    if (!newClass) return
    setSelectedClass(newClass)

    // Deteksi instan wali kelas resmi dari SiPAKSa / default
    const detected = getTeacherForClass(newClass, classrooms, teachers)
    if (detected) {
      setHomeroomName(detected.name)
      const cleanDetectedNiy = detected.niy && detected.niy !== "-" ? detected.niy : ""
      setHomeroomNiy(cleanDetectedNiy)
      setIsManualInput(false)
    }
  }

  const handleSyncWithSipaksa = () => {
    const detected = getTeacherForClass(selectedClass, classrooms, teachers)
    if (detected) {
      setHomeroomName(detected.name)
      const cleanDetectedNiy = detected.niy && detected.niy !== "-" ? detected.niy : ""
      setHomeroomNiy(cleanDetectedNiy)
      setIsManualInput(false)
      toast.success(`Wali kelas disinkronkan ke ${detected.name}`)
    } else {
      toast.info("Data wali kelas di SiPAKSa belum ditentukan")
    }
  }

  const handleTeacherSelect = (val: string | null) => {
    if (!val) return
    if (val === "__MANUAL__") {
      setIsManualInput(true)
      return
    }

    setHomeroomName(val)
    setIsManualInput(false)

    // Isi NIY otomatis jika terdaftar
    const teacher = teachers.find((t) => t.name === val)
    if (teacher?.niy && teacher.niy !== "-") {
      setHomeroomNiy(teacher.niy)
    } else {
      setHomeroomNiy("")
    }
  }

  React.useEffect(() => {
    if (currentClass) {
      setSelectedClass(currentClass)
    }
  }, [currentClass])

  const handleSave = async () => {
    if (!selectedClass) {
      toast.error("Pilih kelas terlebih dahulu")
      return
    }

    if (!homeroomName.trim()) {
      toast.error("Nama wali kelas wajib diisi")
      return
    }

    try {
      setIsSaving(true)
      await saveClassSettingMutation({
        className: selectedClass,
        academicYear,
        semester,
        homeroomTeacherName: homeroomName.trim(),
        homeroomTeacherNiy: homeroomNiy.trim() || "-",
        reportDate: reportDate.trim() || "Pangkalpinang, 19 Desember 2025",
        principalName: principalName.trim() || "Meditoma, S.Pd.",
        principalNiy: principalNiy.trim() || "199405220720181024",
      })

      toast.success(`Pengaturan kelas ${selectedClass} berhasil disimpan`)
      onSaved?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menyimpan pengaturan kelas")
    } finally {
      setIsSaving(false)
    }
  }

  const handleApplyToAllClasses = async () => {
    if (!availableClasses || availableClasses.length === 0) {
      toast.error("Tidak ada daftar rombel yang tersedia")
      return
    }

    try {
      setIsApplyingAll(true)
      await batchApplyMutation({
        academicYear,
        semester,
        reportDate: reportDate.trim() || "Pangkalpinang, 19 Desember 2025",
        principalName: principalName.trim() || "Meditoma, S.Pd.",
        principalNiy: principalNiy.trim() || "199405220720181024",
        classNames: availableClasses,
      })

      toast.success(
        `Tanggal dokumen dan kepala sekolah berhasil diterapkan ke seluruh rombel (${availableClasses.length} kelas)`
      )
      onSaved?.()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Gagal menerapkan ke seluruh rombel")
    } finally {
      setIsApplyingAll(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2 border-b">
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <DialogTitle className="text-lg font-semibold">Pengaturan Wali Kelas & Tanggal Dokumen</DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Atur identitas Guru Kelas, tanggal cetak dokumen rapor, dan Kepala Sekolah per rombel untuk Tahun Ajaran {academicYear} Semester {semester}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-3">
          {/* 1. Pemilihan Rombel / Kelas */}
          <div className="bg-muted/30 border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="class-select" className="text-xs font-semibold text-foreground uppercase tracking-wide">
                Rombel / Kelas
              </Label>
              <a
                href="https://icentresmart.my.id/kelola-kelas"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline inline-flex items-center gap-1 font-medium"
                title="Kelola data kelas dan wali kelas di SiPAKSa iCentre"
              >
                <span>Kelola di SiPAKSa</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <Select value={selectedClass} onValueChange={handleClassChange}>
              <SelectTrigger id="class-select" className="bg-background w-full">
                <SelectValue placeholder="Pilih Kelas" />
              </SelectTrigger>
              <SelectContent>
                {availableClasses.map((c) => (
                  <SelectItem key={c} value={c}>
                    Kelas {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Kartu Identitas Guru Kelas / Wali Kelas */}
          <div className="border rounded-lg p-3.5 bg-card space-y-3 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
              <div className="flex items-center gap-1.5 font-medium text-sm text-foreground">
                <User className="h-4 w-4 text-primary" />
                <span>Guru Kelas {selectedClass ? `(${selectedClass})` : ""}</span>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-xs px-2 gap-1 text-muted-foreground hover:text-foreground"
                  onClick={handleSyncWithSipaksa}
                  title="Deteksi dan pasang otomatis wali kelas resmi dari SiPAKSa untuk kelas ini"
                >
                  <RotateCw className="h-3 w-3" />
                  <span>Otomatis SiPAKSa</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2 text-primary hover:bg-primary/10"
                  onClick={() => setIsManualInput(!isManualInput)}
                >
                  {isManualInput ? "Pilih dari Daftar" : "Input Manual"}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Nama Wali Kelas */}
              <div className="space-y-1.5">
                <Label htmlFor="homeroom-select" className="text-xs">
                  Nama Wali Kelas
                </Label>
                {!isManualInput ? (
                  <Select
                    value={
                      teachers.some((t) => t.name === homeroomName)
                        ? homeroomName
                        : ""
                    }
                    onValueChange={handleTeacherSelect}
                  >
                    <SelectTrigger id="homeroom-select" className="w-full text-xs sm:text-sm">
                      <SelectValue placeholder="Pilih Wali Kelas (SMP/SMA/MTA)..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {teachers.map((t) => (
                        <SelectItem key={t.id || t.name} value={t.name}>
                          <div className="flex items-center justify-between gap-2 w-full">
                            <span className="truncate">{t.name}</span>
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded ml-auto shrink-0">
                              {t.institution}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                      <SelectItem value="__MANUAL__">
                        <span className="text-muted-foreground italic">
                          + Input Nama Lainnya (Manual)...
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    id="homeroom-name"
                    value={homeroomName}
                    onChange={(e) => setHomeroomName(e.target.value)}
                    placeholder="Ketik nama lengkap wali kelas beserta gelar"
                    className="text-xs sm:text-sm"
                    autoFocus
                  />
                )}
              </div>

              {/* NIY Wali Kelas */}
              <div className="space-y-1.5">
                <Label htmlFor="homeroom-niy" className="text-xs">
                  NIY / NIP Wali Kelas
                </Label>
                <Input
                  id="homeroom-niy"
                  value={homeroomNiy}
                  onChange={(e) => setHomeroomNiy(e.target.value)}
                  placeholder="Contoh: 199512310120191027"
                  className="text-xs sm:text-sm font-mono"
                />
                <div className="flex items-center justify-between text-[10px] text-muted-foreground leading-tight">
                  <span>Ketik NIY jika belum ada, lalu klik Simpan.</span>
                  <a
                    href="https://icentresmart.my.id/staff-list"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline inline-flex items-center gap-0.5 font-medium ml-1 shrink-0"
                    title="Buka daftar staf & NIY di SiPAKSa"
                  >
                    <span>Daftar NIY SiPAKSa</span>
                    <ExternalLink className="h-2.5 w-2.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Tanggal Dokumen Rapor */}
          <div className="border rounded-lg p-3.5 bg-card space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <Label htmlFor="report-date" className="flex items-center gap-1.5 text-xs font-medium">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                Tanggal Dokumen Rapor
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleApplyToAllClasses}
                disabled={isApplyingAll}
                className="h-7 text-xs text-primary hover:bg-primary/10 px-2"
              >
                {isApplyingAll ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1" />
                ) : (
                  <CopyCheck className="h-3 w-3 mr-1" />
                )}
                Terapkan ke Semua Kelas
              </Button>
            </div>
            <Input
              id="report-date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              placeholder="Contoh: Pangkalpinang, 19 Desember 2025"
              className="text-xs sm:text-sm"
            />
            <p className="text-[11px] text-muted-foreground">
              Format tanggal yang akan tercetak di atas tanda tangan Guru Kelas.
            </p>
          </div>

          {/* 4. Pengaturan Kepala Sekolah */}
          <div className="border rounded-lg p-3.5 bg-card space-y-2.5 shadow-xs">
            <p className="text-xs font-semibold text-foreground uppercase tracking-wide border-b pb-1.5">
              Penandatangan Kepala Sekolah
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="principal-name" className="text-xs">Nama Kepala Sekolah</Label>
                <Input
                  id="principal-name"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  placeholder="Contoh: Meditoma, S.Pd."
                  className="text-xs sm:text-sm"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="principal-niy" className="text-xs">NIY Kepala Sekolah</Label>
                <Input
                  id="principal-niy"
                  value={principalNiy}
                  onChange={(e) => setPrincipalNiy(e.target.value)}
                  placeholder="Contoh: 199405220720181024"
                  className="text-xs sm:text-sm font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={onClose}>
            Tutup
          </Button>
          <Button type="button" onClick={handleSave} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Simpan Kelas {selectedClass}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
