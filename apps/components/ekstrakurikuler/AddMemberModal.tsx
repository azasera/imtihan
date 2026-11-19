"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
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
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  UserPlusIcon,
  SearchIcon,
  Loader2Icon,
  CheckIcon,
} from "lucide-react"
import {
  EXTRACURRICULAR_PREDICATES,
  getExtracurricularNarrative,
  OFFICIAL_CLASSES,
  formatClassDisplay,
} from "@/lib/extracurricular-constants"

interface AddMemberModalProps {
  isOpen: boolean
  onClose: () => void
  group: {
    _id: Id<"extracurricularGroups">
    name: string
    genderRestriction?: "all" | "ikhwan" | "akhwat"
  } | null
}

export function AddMemberModal({ isOpen, onClose, group }: AddMemberModalProps) {
  const [search, setSearch] = React.useState("")
  const [selectedClass, setSelectedClass] = React.useState("ALL")
  const [selectedSantriId, setSelectedSantriId] = React.useState<string | null>(null)
  const [score, setScore] = React.useState<"A" | "B" | "C">("A")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const availableStudents = useQuery(
    api.extracurricular.public.queries.getAvailableStudentsForGroup,
    group && isOpen
      ? {
          groupId: group._id,
          search: search.trim() || undefined,
          className: selectedClass !== "ALL" ? selectedClass : undefined,
          limit: 40,
        }
      : "skip"
  )

  const addMemberMutation = useMutation(
    api.extracurricular.public.mutations.addMemberToGroup
  )

  // Reset state when closed/opened
  React.useEffect(() => {
    if (isOpen) {
      setSearch("")
      setSelectedClass("ALL")
      setSelectedSantriId(null)
      setScore("A")
    }
  }, [isOpen])

  if (!group) return null

  const handleAdd = async () => {
    if (!selectedSantriId) {
      toast.error("Pilih salah satu santri terlebih dahulu.")
      return
    }

    setIsSubmitting(true)
    try {
      const desc = getExtracurricularNarrative(group.name, score)
      await addMemberMutation({
        groupId: group._id,
        santriId: selectedSantriId,
        score,
        description: desc,
      })
      toast.success("Santri berhasil ditambahkan ke kelompok ekskul.")
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menambahkan santri"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const selectedStudentObj = availableStudents?.find(
    (s) => s.santriId === selectedSantriId
  )

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[620px] max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <UserPlusIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Tambah Peserta Ekstrakurikuler
              </DialogTitle>
              <DialogDescription className="text-xs">
                Mendaftarkan santri ke kelompok{" "}
                <span className="font-semibold text-foreground">{group.name}</span>
                {group.genderRestriction === "ikhwan" && " (Khusus Ikhwan)"}
                {group.genderRestriction === "akhwat" && " (Khusus Akhwat)"}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-3 py-2 flex-1 overflow-hidden flex flex-col">
          {/* Filter Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2 relative">
              <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <Input
                placeholder="Cari nama, NISN, ID santri..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-8 text-xs h-8"
              />
            </div>
            <div>
              <select
                aria-label="Filter Rombel Kelas"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full text-xs h-8 px-2 border rounded bg-background text-foreground"
              >
                <option value="ALL">Semua Kelas</option>
                {OFFICIAL_CLASSES.map((cls) => (
                  <option key={cls} value={cls}>
                    {cls}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Student Candidates List */}
          <div className="flex-1 min-h-[180px] max-h-[260px] overflow-y-auto border rounded-md p-1 divide-y bg-background">
            {availableStudents === undefined ? (
              <div className="flex items-center justify-center h-36 gap-2 text-xs text-muted-foreground">
                <Loader2Icon className="size-4 animate-spin" />
                Memuat daftar santri...
              </div>
            ) : availableStudents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-36 text-xs text-muted-foreground">
                <p>Tidak ada santri yang sesuai kriteria pencarian.</p>
                <p className="text-[11px] text-muted-foreground/70">
                  Pastikan nama atau kelas sesuai dengan data master santri.
                </p>
              </div>
            ) : (
              availableStudents.map((s) => {
                const isSelected = selectedSantriId === s.santriId
                return (
                  <button
                    key={s.santriId}
                    type="button"
                    onClick={() => setSelectedSantriId(s.santriId)}
                    className={`w-full text-left p-2 rounded flex items-center justify-between text-xs transition-colors ${
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground font-medium"
                        : "hover:bg-muted/60 text-foreground"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div
                        className={`size-4 rounded-full border flex items-center justify-center shrink-0 ${
                          isSelected
                            ? "bg-primary border-primary text-primary-foreground"
                            : "border-muted-foreground/40"
                        }`}
                      >
                        {isSelected && <CheckIcon className="size-3" />}
                      </div>
                      <div className="truncate">
                        <span className="font-semibold block truncate">{s.nama}</span>
                        <span className="text-[10px] text-muted-foreground">
                          ID: {s.santriId} | NISN: {s.nisn || s.nis || "-"}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <Badge variant="outline" className="text-[10px] font-semibold py-0 px-2 h-4.5">
                        {formatClassDisplay(s.kelas)}
                      </Badge>
                      <Badge
                        variant="secondary"
                        className="text-[10px] py-0 px-1.5 h-4.5 font-normal text-muted-foreground"
                      >
                        {s.jenisKelamin === "L" ? "Ikhwan" : "Akhwat"}
                      </Badge>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Assessment Preset */}
          {selectedStudentObj && (
            <div className="p-2.5 rounded-md border bg-muted/30 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground">
                  Santri Terpilih: {selectedStudentObj.nama} ({formatClassDisplay(selectedStudentObj.kelas)})
                </span>
                <div className="flex items-center gap-2">
                  <Label htmlFor="predikat" className="text-[11px] text-muted-foreground font-medium">
                    Predikat Awal:
                  </Label>
                  <select
                    id="predikat"
                    aria-label="Predikat Awal"
                    value={score}
                    onChange={(e) => setScore(e.target.value as "A" | "B" | "C")}
                    className="h-7 w-28 px-2 border rounded font-semibold text-xs bg-background text-foreground"
                  >
                    {EXTRACURRICULAR_PREDICATES.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed italic border-t pt-1.5">
                "{getExtracurricularNarrative(group.name, score)}"
              </p>
            </div>
          )}
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
            type="button"
            size="sm"
            disabled={isSubmitting || !selectedSantriId}
            onClick={handleAdd}
            className="text-xs gap-1.5"
          >
            {isSubmitting && <Loader2Icon className="size-3.5 animate-spin" />}
            Daftarkan ke Ekskul
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
