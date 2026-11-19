"use client"

import * as React from "react"
import { useQuery, useMutation } from "convex/react"
import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import {
  TrophyIcon,
  UsersIcon,
  UserIcon,
  UserPlusIcon,
  UserCheckIcon,
  ArrowRightLeftIcon,
  Trash2Icon,
  RefreshCwIcon,
  SearchIcon,
  Loader2Icon,
  FilterIcon,
  CheckCircle2Icon,
  SparklesIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  EXTRACURRICULAR_PREDICATES,
  getExtracurricularNarrative,
  OFFICIAL_CLASSES,
  formatClassDisplay,
} from "@/lib/extracurricular-constants"
import { EKSKUL_ROSTER_DATA } from "@/lib/extracurricular-roster"
import { EditCoachModal } from "@/components/ekstrakurikuler/EditCoachModal"
import { AddMemberModal } from "@/components/ekstrakurikuler/AddMemberModal"
import { TransferMemberModal } from "@/components/ekstrakurikuler/TransferMemberModal"

export default function EkstrakurikulerPage() {
  const [selectedGroupId, setSelectedGroupId] = React.useState<Id<"extracurricularGroups"> | null>(null)
  const [search, setSearch] = React.useState("")
  const [selectedClass, setSelectedClass] = React.useState("ALL")
  const [selectedGender, setSelectedGender] = React.useState("ALL")

  // Modals state
  const [isEditCoachOpen, setIsEditCoachOpen] = React.useState(false)
  const [isAddMemberOpen, setIsAddMemberOpen] = React.useState(false)
  const [transferringMember, setTransferringMember] = React.useState<{
    _id: Id<"extracurricularEnrollments">
    studentName: string
    className: string
    groupName: string
    groupCode: string
    academicYear: string
    semester: 1 | 2
    gender?: string
  } | null>(null)

  const [isSyncingInitial, setIsSyncingInitial] = React.useState(false)

  // Queries
  const groupsData = useQuery(api.extracurricular.public.queries.getGroups, {})
  const membersData = useQuery(
    api.extracurricular.public.queries.getGroupMembers,
    selectedGroupId
      ? {
          groupId: selectedGroupId,
          search: search.trim() || undefined,
          className: selectedClass !== "ALL" ? selectedClass : undefined,
          gender: selectedGender !== "ALL" ? selectedGender : undefined,
        }
      : "skip"
  )

  // Mutations
  const seedMutation = useMutation(api.extracurricular.public.mutations.seedDefaultGroupsAndRoster)
  const removeMemberMutation = useMutation(api.extracurricular.public.mutations.removeMemberFromGroup)
  const updateAssessmentMutation = useMutation(api.extracurricular.public.mutations.updateMemberAssessment)

  const groups = groupsData?.groups || []
  const selectedGroup = groups.find((g) => g._id === selectedGroupId) || groups[0] || null

  // Auto-select first group once loaded
  React.useEffect(() => {
    if (!selectedGroupId && groups.length > 0 && groups[0]) {
      setSelectedGroupId(groups[0]._id)
    }
  }, [groups, selectedGroupId])

  // Inisialisasi awal dari berkas Excel
  const handleSeedInitialRoster = async () => {
    setIsSyncingInitial(true)
    try {
      const res = await seedMutation({
        rosterEntries: EKSKUL_ROSTER_DATA.map((r) => ({
          studentName: r.studentName,
          className: r.className,
          ekskul: r.ekskul,
        })),
      })
      toast.success(
        `Berhasil menyinkronkan data awal! Dibuat ${res.groupsCreated} kelompok dan ${res.enrollmentsCreated} entri keanggotaan santri.`
      )
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menyinkronkan data awal"
      toast.error(msg)
    } finally {
      setIsSyncingInitial(false)
    }
  }

  // Handle Ubah Predikat Langsung
  const handleScoreChange = async (
    enrollmentId: Id<"extracurricularEnrollments">,
    newScore: "A" | "B" | "C",
    groupName: string
  ) => {
    try {
      const newDesc = getExtracurricularNarrative(groupName, newScore)
      await updateAssessmentMutation({
        enrollmentId,
        score: newScore,
        description: newDesc,
      })
      toast.success(`Predikat diperbarui menjadi ${newScore}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memperbarui nilai"
      toast.error(msg)
    }
  }

  // Handle Hapus / Keluarkan Santri
  const handleRemoveMember = async (
    enrollmentId: Id<"extracurricularEnrollments">,
    studentName: string,
    isWajib: boolean
  ) => {
    if (isWajib) {
      toast.error("Ekskul Rohis adalah ekskul wajib dan tidak dapat dihapus.")
      return
    }

    if (!window.confirm(`Keluarkan ${studentName} dari kelompok ekskul ini?`)) {
      return
    }

    try {
      await removeMemberMutation({ enrollmentId })
      toast.success(`${studentName} telah dikeluarkan dari kelompok ekskul.`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengeluarkan santri"
      toast.error(msg)
    }
  }

  const isSelectedGroupWajib = selectedGroup?.category === "wajib"

  return (
    <div className="flex-1 space-y-4 p-4 md:p-6 max-w-7xl mx-auto w-full">
      {/* Header Halaman */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b pb-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <TrophyIcon className="size-5" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">
                Kelompok & Pembina Ekstrakurikuler
              </h1>
              <p className="text-xs text-muted-foreground">
                Manajemen kelompok santri lintas kelas, mutasi pindah ekskul, dan penilaian capaian terintegrasi E-Rapor
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {groupsData && (
            <Badge variant="outline" className="text-xs font-medium py-1 px-2.5">
              Tahun Ajaran {groupsData.academicYear} | Semester {groupsData.semester}
            </Badge>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleSeedInitialRoster}
            disabled={isSyncingInitial}
            className="text-xs gap-1.5 h-8 font-medium"
            title="Muat data kelompok dan keanggotaan santri dari berkas rujukan resmi"
          >
            <RefreshCwIcon className={cn("size-3.5", isSyncingInitial && "animate-spin")} />
            Sinkronkan Data Awal Roster
          </Button>
        </div>
      </div>

      {/* Main Grid: Master List (Kiri) & Roster Anggota (Kanan) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* Kolom Kiri: Daftar Kelompok Ekskul */}
        <div className="lg:col-span-4 space-y-2">
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Daftar Cabang Ekskul ({groups.length})
            </span>
          </div>

          <div className="space-y-1.5 max-h-[calc(100vh-220px)] overflow-y-auto pr-1">
            {groupsData === undefined ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2Icon className="size-4 animate-spin" />
                Memuat daftar ekskul...
              </div>
            ) : groups.length === 0 ? (
              <Card className="p-6 text-center text-xs text-muted-foreground">
                <p className="mb-2">Belum ada kelompok ekstrakurikuler yang diinisialisasi.</p>
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleSeedInitialRoster}
                  disabled={isSyncingInitial}
                  className="text-xs gap-1.5"
                >
                  <SparklesIcon className="size-3.5" />
                  Inisialisasi 15 Kelompok Ekskul
                </Button>
              </Card>
            ) : (
              groups.map((group) => {
                const isSelected = selectedGroup?._id === group._id
                const isWajib = group.category === "wajib"
                return (
                  <button
                    key={group._id}
                    type="button"
                    onClick={() => {
                      setSelectedGroupId(group._id)
                      setSearch("")
                    }}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border transition-all text-xs flex flex-col gap-1.5",
                      isSelected
                        ? "bg-primary/10 border-primary text-foreground shadow-xs font-medium"
                        : "bg-card hover:bg-muted/50 border-border text-foreground"
                    )}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-2 truncate">
                        <span className="font-bold text-sm truncate">{group.name}</span>
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-[10px] px-1.5 py-0 h-4 font-normal",
                            isWajib
                              ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700"
                              : "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700"
                          )}
                        >
                          {isWajib ? "Wajib" : "Pilihan"}
                        </Badge>
                      </div>
                      <Badge variant="secondary" className="text-[11px] px-2 py-0 h-5 font-semibold shrink-0">
                        {group.memberCount} Santri
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span className="truncate">
                        {group.coaches && group.coaches.length > 0
                          ? `Pembina: ${group.coaches.map((c: { name: string }) => c.name).join(", ")}`
                          : group.coachName
                            ? `Pembina: ${group.coachName}`
                            : "Belum ada pembina"}
                      </span>
                      {group.genderRestriction && group.genderRestriction !== "all" && (
                        <span className="capitalize text-[10px] bg-muted px-1.5 py-0.5 rounded">
                          {group.genderRestriction}
                        </span>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* Kolom Kanan: Roster Peserta Kelompok Terpilih */}
        <div className="lg:col-span-8 space-y-3">
          {selectedGroup ? (
            <Card className="border shadow-xs">
              <CardHeader className="p-4 pb-3 border-b bg-muted/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-base font-bold text-foreground">
                        {selectedGroup.name}
                      </CardTitle>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-4.5 font-medium",
                          isSelectedGroupWajib
                            ? "bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-700"
                            : "bg-blue-50 text-blue-700 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-700"
                        )}
                      >
                        {isSelectedGroupWajib ? "Ekskul Wajib" : "Ekskul Pilihan"}
                      </Badge>
                    </div>
                    <div className="mt-1.5 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5 text-xs">
                        <span className="text-muted-foreground font-medium">Pembina:</span>
                        {selectedGroup.coaches && selectedGroup.coaches.length > 0 ? (
                          selectedGroup.coaches.map((c: { name: string; role?: string }, idx: number) => (
                            <Badge
                              key={idx}
                              variant="secondary"
                              className="text-xs font-normal py-0.5 px-2 bg-muted text-foreground border border-border/60 gap-1.5"
                            >
                              <UserIcon className="size-3 text-muted-foreground" />
                              <span className="font-medium">{c.name}</span>
                              {c.role && (
                                <span className="text-[10px] text-muted-foreground font-normal bg-background/80 px-1 py-0.2 rounded border border-border/40">
                                  {c.role}
                                </span>
                              )}
                            </Badge>
                          ))
                        ) : selectedGroup.coachName ? (
                          <Badge
                            variant="secondary"
                            className="text-xs font-normal py-0.5 px-2 bg-muted text-foreground border border-border/60 gap-1.5"
                          >
                            <UserIcon className="size-3 text-muted-foreground" />
                            <span className="font-medium">{selectedGroup.coachName}</span>
                          </Badge>
                        ) : (
                          <span className="italic text-xs text-muted-foreground">Data pembina belum diatur</span>
                        )}
                      </div>
                      {selectedGroup.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {selectedGroup.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditCoachOpen(true)}
                      className="text-xs h-8 gap-1"
                    >
                      <UserCheckIcon className="size-3.5" />
                      Edit Pembina
                    </Button>

                    <Button
                      size="sm"
                      onClick={() => setIsAddMemberOpen(true)}
                      className="text-xs h-8 gap-1 font-semibold"
                    >
                      <UserPlusIcon className="size-3.5" />
                      Tambah Peserta
                    </Button>
                  </div>
                </div>

                {/* Filter & Search Bar */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 pt-3 mt-1 border-t">
                  <div className="sm:col-span-6 relative">
                    <SearchIcon className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
                    <Input
                      placeholder="Cari santri berdasarkan nama / NISN..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-8 text-xs h-8"
                    />
                  </div>
                  <div className="sm:col-span-3">
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
                  <div className="sm:col-span-3">
                    <select
                      aria-label="Filter Jenis Kelamin"
                      value={selectedGender}
                      onChange={(e) => setSelectedGender(e.target.value)}
                      className="w-full text-xs h-8 px-2 border rounded bg-background text-foreground"
                    >
                      <option value="ALL">Semua Gender</option>
                      <option value="L">Ikhwan (L)</option>
                      <option value="P">Akhwat (P)</option>
                    </select>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="p-0">
                {membersData === undefined ? (
                  <div className="p-12 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2Icon className="size-4 animate-spin" />
                    Memuat daftar anggota...
                  </div>
                ) : membersData.members.length === 0 ? (
                  <div className="p-12 text-center text-xs text-muted-foreground space-y-2">
                    <UsersIcon className="size-8 mx-auto text-muted-foreground/40" />
                    <p className="font-medium text-foreground">Belum ada anggota yang sesuai dengan filter.</p>
                    <p className="text-[11px]">
                      Gunakan tombol <strong>"Tambah Peserta"</strong> untuk mendaftarkan santri ke kelompok ini.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader className="bg-muted/40">
                        <TableRow className="text-[11px]">
                          <TableHead className="w-12 text-center">No</TableHead>
                          <TableHead>Nama Santri & NISN</TableHead>
                          <TableHead className="w-24">Kelas</TableHead>
                          <TableHead className="w-20">Gender</TableHead>
                          <TableHead className="w-32">Predikat</TableHead>
                          <TableHead className="min-w-[200px]">Deskripsi Capaian Rapor</TableHead>
                          <TableHead className="w-24 text-center">Aksi</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {membersData.members.map((member, idx) => (
                          <TableRow key={member._id} className="text-xs hover:bg-muted/30">
                            <TableCell className="text-center text-muted-foreground text-[11px]">
                              {idx + 1}
                            </TableCell>

                            <TableCell>
                              <div className="font-semibold text-foreground">{member.studentName}</div>
                              <div className="text-[10px] text-muted-foreground">
                                ID: {member.santriId} | NISN: {member.nisn || "-"}
                              </div>
                            </TableCell>

                            <TableCell>
                              <Badge variant="outline" className="text-[10px] font-semibold py-0 px-2 h-5 text-foreground">
                                {formatClassDisplay(member.className)}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-[11px] text-muted-foreground">
                              {member.gender === "L" ? "Ikhwan" : member.gender === "P" ? "Akhwat" : "-"}
                            </TableCell>

                            <TableCell>
                              <select
                                aria-label={`Predikat ${member.studentName}`}
                                value={member.score}
                                onChange={(e) =>
                                  handleScoreChange(
                                    member._id,
                                    e.target.value as "A" | "B" | "C",
                                    selectedGroup.name
                                  )
                                }
                                className="h-7 w-28 px-1.5 border rounded font-semibold text-xs bg-background text-foreground"
                              >
                                {EXTRACURRICULAR_PREDICATES.map((opt) => (
                                  <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </TableCell>

                            <TableCell className="text-[11px] text-muted-foreground leading-relaxed">
                              {member.description}
                            </TableCell>

                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                {!isSelectedGroupWajib && (
                                  <>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        setTransferringMember({
                                          _id: member._id,
                                          studentName: member.studentName,
                                          className: member.className,
                                          groupName: selectedGroup.name,
                                          groupCode: selectedGroup.code,
                                          academicYear: member.academicYear,
                                          semester: member.semester,
                                          gender: member.gender,
                                        })
                                      }
                                      title="Pindahkan santri ke kelompok ekskul lain"
                                      className="size-7 p-0 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40"
                                    >
                                      <ArrowRightLeftIcon className="size-3.5" />
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() =>
                                        handleRemoveMember(
                                          member._id,
                                          member.studentName,
                                          isSelectedGroupWajib
                                        )
                                      }
                                      title="Keluarkan dari ekskul ini"
                                      className="size-7 p-0 text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2Icon className="size-3.5" />
                                    </Button>
                                  </>
                                )}
                                {isSelectedGroupWajib && (
                                  <span className="text-[10px] text-muted-foreground italic">
                                    Wajib
                                  </span>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center text-xs text-muted-foreground">
              Pilih salah satu cabang ekstrakurikuler di panel kiri.
            </Card>
          )}
        </div>
      </div>

      {/* Modals */}
      <EditCoachModal
        isOpen={isEditCoachOpen}
        onClose={() => setIsEditCoachOpen(false)}
        group={selectedGroup}
      />

      <AddMemberModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        group={selectedGroup}
      />

      <TransferMemberModal
        isOpen={Boolean(transferringMember)}
        onClose={() => setTransferringMember(null)}
        member={transferringMember}
      />
    </div>
  )
}
