"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useMutation, useQuery } from "convex/react"
import { BookOpenIcon, LayersIcon, Trash2Icon } from "lucide-react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { normalizeSubjectCode } from "@/convex/model/institutions"
import { authClient } from "@/lib/auth-client"
import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Textarea } from "@/components/ui/textarea"
import { RenameSubjectDialog } from "@/components/bank-soal/rename-subject-dialog"

type SubjectWithUsage = Omit<Doc<"subjects">, "isActive"> & { isActive: boolean; bankCount: number }

function statusOf(subject: SubjectWithUsage) {
  return subject.isActive
    ? {
        label: "Aktif",
        badgeClass: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
        dotClass: "bg-emerald-500",
        rowClass: "",
        cardClass: "border shadow-xs bg-card",
      }
    : {
        label: "Nonaktif",
        badgeClass: "bg-muted text-muted-foreground border-border",
        dotClass: "bg-muted-foreground/60",
        rowClass: "bg-muted/30 opacity-70",
        cardClass: "border shadow-xs bg-muted/20 border-dashed opacity-75",
      }
}

export default function KelolaMataPelajaranPage() {
  const router = useRouter()
  const { data: session, isPending: isSessionPending } = authClient.useSession()
  const isLoggedIn = !!session?.user
  const subjects = useQuery(
    api.bank.public.queries.listSubjectsWithUsage,
    isLoggedIn ? {} : "skip"
  )
  const addSubject = useMutation(api.bank.public.mutations.addSubject)
  const renameSubject = useMutation(api.bank.public.mutations.renameSubject)
  const setSubjectActive = useMutation(api.bank.public.mutations.setSubjectActive)
  const deleteSubject = useMutation(api.bank.public.mutations.deleteSubject)

  const [name, setName] = React.useState("")
  const [code, setCode] = React.useState("")
  const [codeTouched, setCodeTouched] = React.useState(false)
  const [description, setDescription] = React.useState("")
  const [isAdding, setIsAdding] = React.useState(false)
  const [pendingRow, setPendingRow] = React.useState<string | null>(null)

  function requireLogin() {
    if (isLoggedIn) return true
    toast.error("Silakan login terlebih dahulu sebagai pengajar untuk mengubah daftar mata pelajaran.")
    router.push("/login")
    return false
  }

  function handleNameChange(value: string) {
    setName(value)
    // Kode hanyalah pengenal singkat; biarkan ikut terbentuk selama pengajar belum menulis kode sendiri.
    if (!codeTouched) setCode(normalizeSubjectCode(value))
  }

  async function handleAddSubject(e: React.FormEvent) {
    e.preventDefault()
    if (!requireLogin()) return
    if (!name.trim()) {
      toast.error("Nama mata pelajaran harus diisi.")
      return
    }
    if (!normalizeSubjectCode(code)) {
      toast.error("Kode singkat mata pelajaran harus diisi, misalnya FIQIH atau B_ARAB.")
      return
    }

    try {
      setIsAdding(true)
      await addSubject({ code, name: name.trim(), description: description.trim() })
      toast.success("Mata pelajaran ditambahkan ke daftar bersama.")
      setName("")
      setCode("")
      setCodeTouched(false)
      setDescription("")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mata pelajaran gagal ditambahkan.")
    } finally {
      setIsAdding(false)
    }
  }

  async function handleRename(
    subject: SubjectWithUsage,
    nextName: string,
    nextDescription: string,
    nextCode?: string
  ) {
    const res = await renameSubject({
      subjectId: subject._id,
      name: nextName,
      description: nextDescription,
      code: nextCode,
    })
    if (res?.codeChanged) {
      toast.success(
        res.updatedBanksCount > 0
          ? `Mata pelajaran diperbarui beserta ${res.updatedBanksCount} paket terkait.`
          : "Mata pelajaran dan kode singkat diperbarui."
      )
    } else {
      toast.success("Nama mata pelajaran diperbarui.")
    }
  }

  async function handleToggleActive(subject: SubjectWithUsage) {
    if (!requireLogin()) return
    try {
      setPendingRow(`aktif:${subject._id}`)
      await setSubjectActive({ subjectId: subject._id, isActive: !subject.isActive })
      toast.success(
        subject.isActive
          ? `"${subject.name}" tidak lagi ditawarkan pada paket baru.`
          : `"${subject.name}" kembali tersedia untuk paket baru.`
      )
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Perubahan status gagal disimpan.")
    } finally {
      setPendingRow(null)
    }
  }

  async function handleDelete(subject: SubjectWithUsage) {
    if (!requireLogin()) return
    if (subject.bankCount > 0) {
      toast.error(`Mata pelajaran ini masih dipakai ${subject.bankCount} paket sehingga tidak bisa dihapus.`)
      return
    }
    if (!confirm(`Hapus "${subject.name}" dari daftar mata pelajaran?`)) return

    try {
      setPendingRow(`hapus:${subject._id}`)
      await deleteSubject({ subjectId: subject._id })
      toast.success("Mata pelajaran dihapus dari daftar.")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Mata pelajaran gagal dihapus.")
    } finally {
      setPendingRow(null)
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 md:p-8 max-w-6xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <Link
            href="/bank-soal"
            className={buttonVariants({ variant: "ghost", size: "sm", className: "-ml-2 mb-1 gap-1 text-xs" })}
          >
            <LayersIcon className="size-3.5" />
            Kembali ke Daftar Bank Soal
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight mt-1 font-heading">
            Kelola Mata Pelajaran
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Daftar ini dipakai bersama oleh seluruh pengajar madrasah, jadi perubahan di sini langsung
            terlihat pada paket milik setiap pengajar.
          </p>
        </div>
      </div>

      {!isSessionPending && !isLoggedIn ? (
        <Card className="border-dashed">
          <CardContent className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Daftar mata pelajaran terbuka untuk pengajar yang sudah login</p>
              <p className="text-xs text-muted-foreground">
                Menambah, mengganti nama, dan menonaktifkan mata pelajaran memerlukan akun pengajar.
              </p>
            </div>
            <Link href="/login" className={buttonVariants({ size: "sm" })}>
              Login Pengajar
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card className="border shadow-xs">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-heading">Tambah Mata Pelajaran</CardTitle>
              <CardDescription className="text-xs">
                Nama dipakai pada seluruh layar, kode dipakai sebagai pengenal pada paket, dan deskripsi
                hanya membantu mengingat cakupannya.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSubject} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="new-subject-name">Nama Mata Pelajaran *</Label>
                    <Input
                      id="new-subject-name"
                      placeholder="Misal: Fiqih Ibadah"
                      value={name}
                      onChange={(e) => handleNameChange(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="new-subject-code">Kode Singkat *</Label>
                    <Input
                      id="new-subject-code"
                      placeholder="Misal: FIQIH"
                      className="font-mono uppercase"
                      value={code}
                      onChange={(e) => {
                        setCodeTouched(true)
                        setCode(e.target.value)
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="new-subject-description">Deskripsi (Opsional)</Label>
                  <Textarea
                    id="new-subject-description"
                    rows={2}
                    placeholder="Cakupan materi singkat agar pengajar lain tidak membuat ganda"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <p className="text-[11px] text-muted-foreground">
                    Kode disimpan huruf besar dan tidak berubah setelah dipakai paket.
                  </p>
                  <Button type="submit" size="sm" className="shrink-0" disabled={isAdding}>
                    {isAdding ? "Menyimpan..." : "Tambah Mata Pelajaran"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          {subjects === undefined ? (
            <div className="flex items-center justify-center gap-2 p-10 text-sm text-muted-foreground">
              <Spinner className="size-4" />
              Memuat daftar mata pelajaran...
            </div>
          ) : subjects.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-sm text-muted-foreground">
                Belum ada mata pelajaran di daftar ini. Tambahkan lewat formulir di atas.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Meja pada layar sedang ke atas */}
              <div className="hidden md:block border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow>
                      <TableHead className="font-semibold">Nama</TableHead>
                      <TableHead className="font-semibold w-32">Kode</TableHead>
                      <TableHead className="font-semibold">Deskripsi</TableHead>
                      <TableHead className="font-semibold w-28">Paket</TableHead>
                      <TableHead className="font-semibold w-24">Status</TableHead>
                      <TableHead className="font-semibold w-72 text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjects.map((subject) => {
                      const status = statusOf(subject)
                      return (
                        <TableRow key={subject._id} className={status.rowClass}>
                          <TableCell className="font-medium text-xs">
                            <div className="flex items-center gap-1.5">
                              <span className={subject.isActive ? "font-semibold text-foreground" : "text-muted-foreground line-through decoration-muted-foreground/40"}>
                                {subject.name}
                              </span>
                              {!subject.isActive && (
                                <span className="text-[10px] text-muted-foreground font-normal">
                                  (Nonaktif)
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-[11px] text-muted-foreground">
                            {subject.code}
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground max-w-xs">
                            {subject.description || "—"}
                          </TableCell>
                          <TableCell className="text-xs font-mono">{subject.bankCount} paket</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`text-[11px] font-semibold gap-1.5 px-2 py-0.5 ${status.badgeClass}`}>
                              <span className={`size-1.5 rounded-full inline-block shrink-0 ${status.dotClass}`} />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <RenameSubjectDialog
                                subject={{
                                  id: subject._id,
                                  code: subject.code,
                                  name: subject.name,
                                  description: subject.description,
                                  bankCount: subject.bankCount,
                                  isActive: subject.isActive,
                                }}
                                onRename={(nextName, nextDescription, nextCode) =>
                                  handleRename(subject, nextName, nextDescription, nextCode)
                                }
                              />
                              <Button
                                variant="outline"
                                size="sm"
                                className={`text-xs h-7 px-2 ${
                                  subject.isActive
                                    ? "text-muted-foreground hover:text-foreground"
                                    : "text-emerald-700 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 font-medium"
                                }`}
                                onClick={() => handleToggleActive(subject)}
                                disabled={pendingRow === `aktif:${subject._id}`}
                              >
                                {pendingRow === `aktif:${subject._id}`
                                  ? "Menyimpan..."
                                  : subject.isActive
                                    ? "Nonaktifkan"
                                    : "Aktifkan kembali"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10"
                                onClick={() => handleDelete(subject)}
                                disabled={subject.bankCount > 0 || pendingRow === `hapus:${subject._id}`}
                              >
                                <Trash2Icon className="size-3.5" />
                                Hapus
                              </Button>
                            </div>
                            {subject.bankCount > 0 && (
                              <p className="text-[11px] text-muted-foreground mt-1">
                                Belum bisa dihapus, masih dipakai {subject.bankCount} paket
                              </p>
                            )}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Kartu per mata pelajaran pada layar kecil */}
              <div className="md:hidden space-y-2">
                {subjects.map((subject) => {
                  const status = statusOf(subject)
                  return (
                    <Card key={subject._id} className={`border ${status.cardClass}`}>
                      <CardContent className="p-3 space-y-2 text-xs">
                        <div className="flex items-start justify-between gap-2">
                          <div className="space-y-0.5">
                            <p className={`font-semibold ${subject.isActive ? "" : "text-muted-foreground line-through decoration-muted-foreground/40"}`}>
                              {subject.name}
                            </p>
                            <p className="font-mono text-[11px] text-muted-foreground">{subject.code}</p>
                          </div>
                          <Badge variant="outline" className={`text-[11px] font-semibold gap-1.5 px-2 py-0.5 ${status.badgeClass}`}>
                            <span className={`size-1.5 rounded-full inline-block shrink-0 ${status.dotClass}`} />
                            {status.label}
                          </Badge>
                        </div>
                        {subject.description && (
                          <p className="text-[11px] text-muted-foreground">{subject.description}</p>
                        )}
                        <p className="text-[11px] text-muted-foreground">Dipakai {subject.bankCount} paket</p>
                        <div className="flex flex-wrap items-center gap-1 pt-1 border-t">
                          <RenameSubjectDialog
                            subject={{
                              id: subject._id,
                              code: subject.code,
                              name: subject.name,
                              description: subject.description,
                              bankCount: subject.bankCount,
                              isActive: subject.isActive,
                            }}
                            onRename={(nextName, nextDescription, nextCode) =>
                              handleRename(subject, nextName, nextDescription, nextCode)
                            }
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            className={`text-xs h-7 px-2 ${
                              subject.isActive
                                ? "text-muted-foreground hover:text-foreground"
                                : "text-emerald-700 dark:text-emerald-400 border-emerald-500/40 hover:bg-emerald-500/10 font-medium"
                            }`}
                            onClick={() => handleToggleActive(subject)}
                            disabled={pendingRow === `aktif:${subject._id}`}
                          >
                            {subject.isActive ? "Nonaktifkan" : "Aktifkan kembali"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-7 px-2 text-destructive hover:bg-destructive/10"
                            onClick={() => handleDelete(subject)}
                            disabled={subject.bankCount > 0}
                          >
                            Hapus
                          </Button>
                        </div>
                        {subject.bankCount > 0 && (
                          <p className="text-[11px] text-muted-foreground">
                            Hapus belum tersedia karena masih dipakai {subject.bankCount} paket.
                          </p>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                <BookOpenIcon className="size-3.5 mt-0.5 shrink-0" />
                Mata pelajaran nonaktif hilang dari pilihan pada pembuatan paket baru, tetapi paket dan
                sesi lama tetap menampilkan namanya.
              </p>
            </>
          )}
        </>
      )}
    </div>
  )
}
