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
import { SlidersHorizontal, Save, Calendar, User, CopyCheck, Loader2 } from "lucide-react"

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
    if (existingSetting) {
      setHomeroomName(existingSetting.homeroomTeacherName || "Muhammad Yasser, S.Pd.")
      setHomeroomNiy(existingSetting.homeroomTeacherNiy || "199512310120191027")
      setReportDate(existingSetting.reportDate || "Pangkalpinang, 19 Desember 2025")
      setPrincipalName(existingSetting.principalName || "Meditoma, S.Pd.")
      setPrincipalNiy(existingSetting.principalNiy || "199405220720181024")
    }
  }, [existingSetting])

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
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5 text-primary" />
            <DialogTitle>Pengaturan Wali Kelas & Tanggal Dokumen</DialogTitle>
          </div>
          <DialogDescription>
            Atur identitas Guru Kelas, tanggal cetak dokumen rapor, dan Kepala Sekolah per rombel untuk Tahun Ajaran {academicYear} Semester {semester}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Pemilihan Rombel / Kelas */}
          <div className="space-y-1.5">
            <Label htmlFor="class-select">Rombel / Kelas</Label>
            <Select value={selectedClass} onValueChange={(val) => { if (val) setSelectedClass(val) }}>
              <SelectTrigger id="class-select">
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Nama Wali Kelas */}
            <div className="space-y-1.5">
              <Label htmlFor="homeroom-name" className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Nama Wali Kelas
              </Label>
              <Input
                id="homeroom-name"
                value={homeroomName}
                onChange={(e) => setHomeroomName(e.target.value)}
                placeholder="Contoh: Muhammad Yasser, S.Pd."
              />
            </div>

            {/* NIY Wali Kelas */}
            <div className="space-y-1.5">
              <Label htmlFor="homeroom-niy">NIY / NIP Wali Kelas</Label>
              <Input
                id="homeroom-niy"
                value={homeroomNiy}
                onChange={(e) => setHomeroomNiy(e.target.value)}
                placeholder="Contoh: 199512310120191027"
              />
            </div>
          </div>

          {/* Tanggal Dokumen Rapor */}
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between">
              <Label htmlFor="report-date" className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Tanggal Dokumen Rapor
              </Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleApplyToAllClasses}
                disabled={isApplyingAll}
                className="h-7 text-xs text-primary hover:text-primary/90 px-2"
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
            />
            <p className="text-[11px] text-muted-foreground">
              Format tanggal yang akan tercetak di atas tanda tangan Guru Kelas.
            </p>
          </div>

          {/* Pengaturan Kepala Sekolah */}
          <div className="border-t pt-3 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Penandatangan Kepala Sekolah
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="principal-name">Nama Kepala Sekolah</Label>
                <Input
                  id="principal-name"
                  value={principalName}
                  onChange={(e) => setPrincipalName(e.target.value)}
                  placeholder="Contoh: Meditoma, S.Pd."
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="principal-niy">NIY Kepala Sekolah</Label>
                <Input
                  id="principal-niy"
                  value={principalNiy}
                  onChange={(e) => setPrincipalNiy(e.target.value)}
                  placeholder="Contoh: 199405220720181024"
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
