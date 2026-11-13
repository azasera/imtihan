"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import {
  BookOpenIcon,
  CheckCircle2Icon,
  FolderPlusIcon,
  GraduationCapIcon,
  LayersIcon,
  MoreVerticalIcon,
  PlusIcon,
  SearchIcon,
  Trash2Icon,
} from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { INSTITUTION_LABELS, INSTITUTION_LEVELS, INSTITUTION_NAMES, INSTITUTIONS, type Institution } from "@/convex/model/institutions"
import { authClient } from "@/lib/auth-client"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

function BankSoalContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const actionParam = searchParams.get("action")

  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const questionBanks = useQuery(api.bank.public.queries.listQuestionBanks, {})
  const subjects = useQuery(api.bank.public.queries.listSubjects, {})
  const createBank = useMutation(api.bank.public.mutations.createQuestionBank)
  const deleteBank = useMutation(api.bank.public.mutations.deleteQuestionBank)

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedSubject, setSelectedSubject] = React.useState<string>("all")

  // Alihkan langsung ke Studio Pembuatan jika parameter action=new diterima
  React.useEffect(() => {
    if (actionParam === "new") {
      router.replace("/bank-soal/baru")
    }
  }, [actionParam, router])

  // Form states
  const [title, setTitle] = React.useState("")
  const [subjectCode, setSubjectCode] = React.useState("")
  const [institution, setInstitution] = React.useState<Institution | "">("")
  const [gradeLevel, setGradeLevel] = React.useState("")
  const [description, setDescription] = React.useState("")
  const [totalPoints, setTotalPoints] = React.useState(100)
  const [passingScore, setPassingScore] = React.useState(75)

  // Mata pelajaran nonaktif tidak lagi ditawarkan, tetapi paket lama tetap memakai namanya.
  const selectableSubjects = React.useMemo(
    () => (subjects ?? []).filter((s) => s.isActive !== false),
    [subjects]
  )
  const subjectNameByCode = React.useMemo(() => {
    const map = new Map<string, string>()
    for (const s of subjects ?? []) map.set(s.code, s.name)
    return map
  }, [subjects])

  function handleInstitutionChange(value: string | null) {
    const next = (value ?? "") as Institution | ""
    setInstitution(next)
    // Tingkat bergantung lembaga, jadi pilihan lama harus dibuang, bukan dipertahankan diam-diam.
    setGradeLevel("")
  }

  async function handleCreateBank(e: React.FormEvent) {
    e.preventDefault()
    if (!session?.user) {
      toast.error("Silakan login terlebih dahulu sebagai pengajar untuk membuat paket bank soal.")
      router.push("/login")
      return
    }
    if (!title.trim()) {
      toast.error("Judul paket bank soal wajib diisi.")
      return
    }
    if (!subjectCode) {
      toast.error("Silakan pilih mata pelajaran.")
      return
    }
    if (!institution) {
      toast.error("Silakan pilih lembaga terlebih dahulu sebelum memilih tingkat.")
      return
    }
    if (!gradeLevel) {
      toast.error("Silakan pilih tingkat / kelas resmi lembaga ini.")
      return
    }

    try {
      setIsSubmitting(true)
      const newBankId = await createBank({
        title: title.trim(),
        subjectCode,
        institution,
        gradeLevel,
        description: description.trim() || undefined,
        totalPoints: Number(totalPoints),
        passingScore: Number(passingScore),
      })

      toast.success("Paket bank soal berhasil dibuat!")
      setIsDialogOpen(false)
      // Reset form
      setTitle("")
      setDescription("")
      // Langsung arahkan pengajar ke editor butir soal
      router.push(`/bank-soal/${newBankId}`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal membuat paket bank soal."
      if (msg.includes("login") || msg.includes("Akses ditolak")) {
        toast.error("Sesi login Anda telah berakhir atau belum aktif. Silakan login kembali.")
        router.push("/login")
        return
      }
      toast.error(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleDeleteBank(
    bankId: Id<"questionBanks">,
    bankTitle: string,
    sessionCount: number,
    activeSessionTitle?: string | null
  ) {
    if (!session?.user) {
      toast.error("Silakan login terlebih dahulu.")
      router.push("/login")
      return
    }

    if (sessionCount > 0) {
      toast.error(
        `Paket "${bankTitle}" tidak dapat dihapus karena sudah dipakai pada sesi ujian${activeSessionTitle ? ` "${activeSessionTitle}"` : ""}.`
      )
      return
    }

    if (
      !confirm(
        `Apakah Anda yakin ingin menghapus paket bank soal "${bankTitle}" beserta seluruh butir soalnya? Tindakan ini tidak dapat dibatalkan.`
      )
    ) {
      return
    }

    try {
      await deleteBank({ bankId })
      toast.success(`Paket bank soal "${bankTitle}" berhasil dihapus.`)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal menghapus paket bank soal."
      toast.error(msg)
    }
  }

  const filteredBanks = React.useMemo(() => {
    if (!questionBanks) return []
    return questionBanks.filter((bank) => {
      const matchesSearch = bank.title.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesSubject = selectedSubject === "all" || bank.subjectCode === selectedSubject
      return matchesSearch && matchesSubject
    })
  }, [questionBanks, searchQuery, selectedSubject])

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-primary/30 text-primary">
              Modul Pengajar
            </Badge>
            <span className="text-xs text-muted-foreground font-mono">Manajemen Evaluasi</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 font-heading">
            Bank Soal & Materi Ujian
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Susun paket butir soal pilihan ganda dan essay untuk pelaksanaan ujian santri terstandar.
          </p>
          <Link
            href="/mata-pelajaran"
            className={buttonVariants({
              variant: "ghost",
              size: "sm",
              className: "-ml-2 mt-1 gap-1.5 text-xs text-muted-foreground hover:text-foreground",
            })}
          >
            <BookOpenIcon className="size-3.5" />
            Kelola Mata Pelajaran
          </Link>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/bank-soal/baru"
            className={buttonVariants({
              className: "gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-sm",
            })}
          >
            <PlusIcon className="size-4" />
            <span>Buat Paket Bank Soal</span>
          </Link>

          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              if (open && !session?.user) {
                toast.error("Silakan login terlebih dahulu sebagai pengajar untuk membuat paket bank soal.")
                router.push("/login")
                return
              }
              setIsDialogOpen(open)
              if (!open && actionParam === "new") {
                router.replace("/bank-soal")
              }
            }}
          >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-heading">Paket Bank Soal Baru</DialogTitle>
              <DialogDescription>
                Masukkan rincian paket bank soal sebelum mulai menginput butir-butir pertanyaan.
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateBank} className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label htmlFor="bank-title">Judul Paket Ujian *</Label>
                <Input
                  id="bank-title"
                  placeholder="Misal: Ujian Akhir Semester Fiqih Ibadah"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bank-subject">Mata Pelajaran *</Label>
                  <Select
                    items={selectableSubjects.map((subject) => ({
                      value: subject.code,
                      label: subject.name,
                    }))}
                    value={subjectCode}
                    onValueChange={(val) => setSubjectCode(val ?? "")}
                  >
                    <SelectTrigger id="bank-subject" className="w-full">
                      <SelectValue placeholder="Pilih mapel..." />
                    </SelectTrigger>
                    <SelectContent className="w-[var(--anchor-width)] min-w-[300px] sm:min-w-[360px] rounded-md shadow-lg border">
                      {selectableSubjects.map((s) => (
                        <SelectItem key={s.code} value={s.code}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bank-institution">Lembaga *</Label>
                  <Select
                    items={INSTITUTIONS.map((item) => ({
                      value: item,
                      label: item,
                    }))}
                    value={institution}
                    onValueChange={handleInstitutionChange}
                  >
                    <SelectTrigger id="bank-institution" className="w-full">
                      <SelectValue placeholder="Pilih lembaga..." />
                    </SelectTrigger>
                    <SelectContent>
                      {INSTITUTIONS.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bank-grade">Tingkat / Kelas *</Label>
                <Select
                  items={(institution ? INSTITUTION_LEVELS[institution] : []).map((level) => ({
                    value: level,
                    label: level,
                  }))}
                  value={gradeLevel}
                  onValueChange={(val) => setGradeLevel(val ?? "")}
                  disabled={!institution}
                >
                  <SelectTrigger id="bank-grade" className="w-full">
                    <SelectValue placeholder={institution ? "Pilih tingkat..." : "Pilih lembaga terlebih dahulu"} />
                  </SelectTrigger>
                  <SelectContent>
                    {(institution ? INSTITUTION_LEVELS[institution] : []).map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Tingkat mengikuti jenjang resmi lembaga yang sama dengan data santri; memilih lembaga
                  baru mengosongkan tingkat yang sudah dipilih.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="bank-points">Bobot Nilai Total</Label>
                  <Input
                    id="bank-points"
                    type="number"
                    min={10}
                    max={1000}
                    value={totalPoints}
                    onChange={(e) => setTotalPoints(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="bank-kkm">Nilai KKM Minimal</Label>
                  <Input
                    id="bank-kkm"
                    type="number"
                    min={0}
                    max={100}
                    value={passingScore}
                    onChange={(e) => setPassingScore(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bank-desc">Catatan / Deskripsi (Opsional)</Label>
                <Textarea
                  id="bank-desc"
                  placeholder="Informasi pengantar atau instruksi khusus untuk paket soal ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                />
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Menyimpan..." : "Buat Paket & Tulis Soal"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {/* Kartu Metrik Portofolio Bank Soal */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="border bg-card/60 p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Total Paket</span>
            <LayersIcon className="size-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {questionBanks?.length ?? 0}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Paket asesmen terdaftar</p>
        </Card>

        <Card className="border bg-card/60 p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Aktif di Sesi</span>
            <CheckCircle2Icon className="size-4 text-blue-600 dark:text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {questionBanks?.filter((b) => Boolean(b.sessionCount && b.sessionCount > 0)).length ?? 0}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Dipakai pada ujian santri</p>
        </Card>

        <Card className="border bg-card/60 p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Draf / Mandiri</span>
            <FolderPlusIcon className="size-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {questionBanks?.filter((b) => !b.sessionCount || b.sessionCount === 0).length ?? 0}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Siap dijadwalkan</p>
        </Card>

        <Card className="border bg-card/60 p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-xs font-medium">Mata Pelajaran</span>
            <BookOpenIcon className="size-4 text-teal-600 dark:text-teal-400" />
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-foreground">
            {new Set(questionBanks?.map((b) => b.subjectCode)).size}
          </div>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Bidang studi tercakup</p>
        </Card>
      </div>

      {!isSessionPending && !session?.user && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200">
          <div className="space-y-0.5">
            <p className="text-sm font-medium">Anda belum login sebagai Pengajar</p>
            <p className="text-xs text-muted-foreground">
              Untuk menyusun paket bank soal dan mengelola butir pertanyaan, silakan login dengan akun pengajar Anda.
            </p>
          </div>
          <Link href="/login" className={buttonVariants({ size: "sm" })}>
            Login Pengajar
          </Link>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <SearchIcon className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            placeholder="Cari judul paket bank soal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 text-xs sm:text-sm"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            items={[
              { value: "all", label: "Semua Mata Pelajaran" },
              ...(subjects?.map((subject) => ({ value: subject.code, label: subject.name })) ?? []),
            ]}
            value={selectedSubject}
            onValueChange={(val) => setSelectedSubject(val ?? "all")}
          >
            <SelectTrigger className="w-full sm:w-56 text-xs sm:text-sm">
              <SelectValue placeholder="Semua Mata Pelajaran" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Mata Pelajaran</SelectItem>
              {subjects?.map((s) => (
                <SelectItem key={s.code} value={s.code}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bank Soal List / Cards */}
      {questionBanks === undefined ? (
        <div className="p-12 text-center text-sm text-muted-foreground animate-pulse">
          Memuat data bank soal...
        </div>
      ) : filteredBanks.length === 0 ? (
        <Card className="border-dashed p-10 text-center flex flex-col items-center justify-center gap-3">
          <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
            <FolderPlusIcon className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-semibold text-base">Belum Ada Paket Bank Soal</h3>
            <p className="text-xs text-muted-foreground max-w-sm">
              Mulai buat paket bank soal pertama Anda untuk menyusun lembar pertanyaan santri.
            </p>
          </div>
          <Link
            href="/bank-soal/baru"
            className={buttonVariants({
              size: "sm",
              className: "mt-2 gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold",
            })}
          >
            <PlusIcon className="size-4" />
            Buat Paket Bank Soal Sekarang
          </Link>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBanks.map((bank) => (
            <Card key={bank._id} className="border flex flex-col justify-between hover:border-primary/40 transition-all shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary" className="text-xs font-normal">
                    {subjectNameByCode.get(bank.subjectCode) ?? bank.subjectCode}
                  </Badge>
                  <Badge variant="outline" className="text-xs font-mono">
                    {bank.gradeLevel}
                  </Badge>
                </div>
                <CardTitle className="text-base font-heading mt-2 line-clamp-2">
                  {bank.title}
                </CardTitle>
                {bank.description && (
                  <CardDescription className="text-xs line-clamp-2">
                    {bank.description}
                  </CardDescription>
                )}
              </CardHeader>

              <CardContent className="pb-3 text-xs text-muted-foreground space-y-1">
                <div className="flex items-center justify-between">
                  <span>Bobot Nilai:</span>
                  <span className="font-semibold font-mono text-foreground">{bank.totalPoints} Poin</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Standar KKM:</span>
                  <span className="font-semibold font-mono text-foreground">{bank.passingScore}</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span>Status Pemakaian:</span>
                  {Boolean(bank.sessionCount && bank.sessionCount > 0) ? (
                    <Badge variant="outline" className="text-[11px] font-normal border-blue-500/30 text-blue-600 dark:text-blue-400 bg-blue-500/10">
                      Dipakai ({bank.sessionCount} sesi)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-[11px] font-normal text-muted-foreground">
                      Belum dipakai
                    </Badge>
                  )}
                </div>
              </CardContent>

              <CardFooter className="pt-2 border-t flex items-center justify-between gap-2">
                <Link
                  href={`/bank-soal/${bank._id}`}
                  className={buttonVariants({ size: "sm", className: "flex-1 text-xs gap-1.5" })}
                >
                  <LayersIcon className="size-3.5" />
                  Kelola Butir Soal
                </Link>
                <Button
                  variant="outline"
                  size="icon"
                  disabled={Boolean(bank.sessionCount && bank.sessionCount > 0)}
                  className={cn(
                    "size-8 shrink-0",
                    bank.sessionCount && bank.sessionCount > 0
                      ? "opacity-40 cursor-not-allowed text-muted-foreground"
                      : "text-destructive hover:bg-destructive/10"
                  )}
                  onClick={() => handleDeleteBank(bank._id, bank.title, bank.sessionCount ?? 0, bank.activeSessionTitle)}
                  title={
                    bank.sessionCount && bank.sessionCount > 0
                      ? `Paket terkunci karena sudah dipakai pada sesi ujian${bank.activeSessionTitle ? ` (${bank.activeSessionTitle})` : ""}`
                      : "Hapus paket bank soal"
                  }
                >
                  <Trash2Icon className="size-4" />
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default function BankSoalPage() {
  return (
    <React.Suspense fallback={null}>
      <BankSoalContent />
    </React.Suspense>
  )
}
