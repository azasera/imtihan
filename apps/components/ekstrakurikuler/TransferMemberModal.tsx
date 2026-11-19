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
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowRightLeftIcon, Loader2Icon, AlertCircleIcon } from "lucide-react"
import { formatClassDisplay } from "@/lib/extracurricular-constants"

interface TransferMemberModalProps {
  isOpen: boolean
  onClose: () => void
  member: {
    _id: Id<"extracurricularEnrollments">
    studentName: string
    className: string
    groupName: string
    groupCode: string
    academicYear: string
    semester: 1 | 2
    gender?: string
  } | null
}

export function TransferMemberModal({
  isOpen,
  onClose,
  member,
}: TransferMemberModalProps) {
  const [targetGroupId, setTargetGroupId] = React.useState<Id<"extracurricularGroups"> | "">("")
  const [isSubmitting, setIsSubmitting] = React.useState(false)

  const activeGroups = useQuery(
    api.extracurricular.public.queries.getAllActiveGroupsForTransfer,
    member && isOpen
      ? {
          academicYear: member.academicYear,
          semester: member.semester,
        }
      : "skip"
  )

  const transferMutation = useMutation(
    api.extracurricular.public.mutations.transferMemberGroup
  )

  React.useEffect(() => {
    if (isOpen) {
      setTargetGroupId("")
    }
  }, [isOpen])

  if (!member) return null

  // Filter kelompok tujuan: jangan tampilkan kelompok saat ini & ekskul wajib (Rohis)
  const availableTargetGroups =
    activeGroups?.filter(
      (g) =>
        g.code.toLowerCase() !== member.groupCode.toLowerCase() &&
        g.category !== "wajib"
    ) || []

  const handleTransfer = async () => {
    if (!targetGroupId) {
      toast.error("Pilih kelompok ekskul tujuan terlebih dahulu.")
      return
    }

    setIsSubmitting(true)
    try {
      await transferMutation({
        enrollmentId: member._id,
        targetGroupId,
      })
      toast.success(
        `Santri ${member.studentName} berhasil dipindahkan ke ekskul tujuan.`
      )
      onClose()
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memindahkan santri"
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <ArrowRightLeftIcon className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold">
                Pindah Kelompok Ekstrakurikuler
              </DialogTitle>
              <DialogDescription className="text-xs">
                Mutasi peserta dari satu cabang ke cabang ekskul pilihan lainnya
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Card Info Santri & Ekskul Asal */}
          <div className="p-3 rounded-lg border bg-muted/40 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold text-foreground text-sm block">
                  {member.studentName}
                </span>
                <span className="text-muted-foreground text-[11px]">
                  Kelas {formatClassDisplay(member.className)} {member.gender && `(${member.gender === "L" ? "Ikhwan" : "Akhwat"})`}
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                Ekskul Asal: {member.groupName}
              </Badge>
            </div>
          </div>

          {/* Form Pemilihan Ekskul Tujuan */}
          <div className="space-y-1.5">
            <Label htmlFor="targetGroup" className="text-xs font-medium">
              Pilih Kelompok Ekskul Tujuan:
            </Label>
            <select
              id="targetGroup"
              aria-label="Pilih Kelompok Ekskul Tujuan"
              value={targetGroupId}
              onChange={(e) =>
                setTargetGroupId(e.target.value as Id<"extracurricularGroups">)
              }
              className="w-full text-xs h-9 px-2.5 border rounded-md bg-background text-foreground"
            >
              <option value="" disabled>
                -- Pilih Cabang Ekskul Baru --
              </option>
              {availableTargetGroups.map((g) => {
                const isGenderMatched =
                  !g.genderRestriction ||
                  g.genderRestriction === "all" ||
                  (member.gender === "L" && g.genderRestriction === "ikhwan") ||
                  (member.gender === "P" && g.genderRestriction === "akhwat")

                return (
                  <option
                    key={g._id}
                    value={g._id}
                    disabled={!isGenderMatched}
                  >
                    {g.name}{" "}
                    {g.genderRestriction === "ikhwan"
                      ? "(Ikhwan)"
                      : g.genderRestriction === "akhwat"
                      ? "(Akhwat)"
                      : ""}
                    {!isGenderMatched ? " - Tidak sesuai gender" : ""}
                  </option>
                )
              })}
            </select>
          </div>

          <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
            <AlertCircleIcon className="size-4 shrink-0 mt-0.5" />
            <span>
              Status santri pada ekskul asal ({member.groupName}) akan otomatis diubah menjadi <strong>Dipindahkan</strong>, dan santri akan aktif terdaftar pada ekskul baru. Perubahan ini langsung disinkronkan ke nilai rapor santri.
            </span>
          </div>
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
            disabled={isSubmitting || !targetGroupId}
            onClick={handleTransfer}
            className="text-xs gap-1.5"
          >
            {isSubmitting && <Loader2Icon className="size-3.5 animate-spin" />}
            Proses Pindah Ekskul
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
