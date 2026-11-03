"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import {
  BookOpenIcon,
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
import { authClient } from "@/lib/auth-client"
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

export default function BankSoalPage() {
  const router = useRouter()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const questionBanks = useQuery(api.bank.public.queries.listQuestionBanks, {})
  const subjects = useQuery(api.bank.public.queries.listSubjects, {})
  const createBank = useMutation(api.bank.public.mutations.createQuestionBank)
  const deleteBank = useMutation(api.bank.public.mutations.deleteQuestionBank)

  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [searchQuery, setSearchQuery] = React.useState("")
  const [selectedSubject, setSelectedSubject] = React.useState<string>("all")

  // Form states
  const [title, setTitle] = React.useState("")
  const [subjectCode, setSubjectCode] = React.useState("")
  const [gradeLevel, setGradeLevel] = React.useState("Kelas 7")
  const [description, setDescription] = React.useState("")
  const [totalPoints, setTotalPoints] = React.useState(100)
  const [passingScore, setPassingScore] = React.useState(75)

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

    try {
      setIsSubmitting(true)
      const newBankId = await createBank({
        title: title.trim(),
        subjectCode,
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

  async function handleDeleteBank(bankId: Id<"questionBanks">, bankTitle: string) {
    if (!session?.user) {
      toast.error("Silakan login terlebih dahulu.")
      router.push("/login")
      return
    }
    if (!confirm(`Apakah Anda yakin ingin menghapus paket "${bankTitle}" beserta seluruh butir soalnya?`)) {
      return
    }

    try {
      await deleteBank({ bankId })
      toast.success("Paket bank soal berhasil dihapus.")
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
        </div>

        <Dialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            if (open && !session?.user) {
              toast.error("Silakan login terlebih dahulu sebagai pengajar untuk membuat paket bank soal.")
              router.push("/login")
              return
            }
            setIsDialogOpen(open)
          }}
        >
          <DialogTrigger
            render={
              <Button className="shrink-0 gap-1.5">
                <PlusIcon className="size-4" />
                Buat Paket Bank Soal
              </Button>
            }
          />
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
                  <Select value={subjectCode} onValueChange={(val) => setSubjectCode(val ?? "")}>
                    <SelectTrigger id="bank-subject" className="w-full">
                      <SelectValue placeholder="Pilih mapel..." />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects?.map((s) => (
                        <SelectItem key={s.code} value={s.code}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bank-grade">Tingkat / Kelas</Label>
                  <Select value={gradeLevel} onValueChange={(val) => setGradeLevel(val ?? "Kelas 7")}>
                    <SelectTrigger id="bank-grade" className="w-full">
                      <SelectValue placeholder="Pilih kelas..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Kelas 7">Kelas 7 / Ula 1</SelectItem>
                      <SelectItem value="Kelas 8">Kelas 8 / Ula 2</SelectItem>
                      <SelectItem value="Kelas 9">Kelas 9 / Ula 3</SelectItem>
                      <SelectItem value="Kelas 10">Kelas 10 / Wustha 1</SelectItem>
                      <SelectItem value="Kelas 11">Kelas 11 / Wustha 2</SelectItem>
                      <SelectItem value="Kelas 12">Kelas 12 / Wustha 3</SelectItem>
                      <SelectItem value="Tarbiyah / Takhassus">Tarbiyah / Takhassus</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
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
          <Select value={selectedSubject} onValueChange={(val) => setSelectedSubject(val ?? "all")}>
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
          <Button onClick={() => setIsDialogOpen(true)} size="sm" className="mt-2 gap-1.5">
            <PlusIcon className="size-4" />
            Buat Paket Bank Soal Sekarang
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredBanks.map((bank) => (
            <Card key={bank._id} className="border flex flex-col justify-between hover:border-primary/40 transition-all shadow-xs">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="secondary" className="text-xs font-normal">
                    {bank.subjectCode}
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
              </CardContent>

              <CardFooter className="pt-2 border-t flex items-center justify-between gap-2">
                <Link
                  href={`/bank-soal/${bank._id}`}
                  className={buttonVariants({ size: "sm", className: "w-full text-xs gap-1.5" })}
                >
                  <LayersIcon className="size-3.5" />
                  Kelola Butir Soal
                </Link>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => handleDeleteBank(bank._id, bank.title)}
                  title="Hapus paket bank soal"
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
