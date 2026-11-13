import type { Doc, Id } from "../../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../../_generated/server"
import { requireAuthenticatedUser, type AuthenticatedUser } from "../../model/auth"

export { requireAuthenticatedUser, type AuthenticatedUser }

type AnyCtx = QueryCtx | MutationCtx

/**
 * Memuat paket bank soal dan memastikan identitas yang sudah diverifikasi adalah pemiliknya.
 * Kepemilikan selalu dibandingkan dengan identitas sisi server, bukan argumen pemanggil.
 */
export async function requireOwnedBank(
  ctx: AnyCtx,
  user: AuthenticatedUser,
  bankId: Id<"questionBanks">
): Promise<Doc<"questionBanks">> {
  const bank = await ctx.db.get("questionBanks", bankId)
  if (!bank) {
    throw new Error("Paket bank soal tidak ditemukan.")
  }
  if (bank.authorTokenIdentifier !== user.tokenIdentifier) {
    throw new Error("Akses ditolak: Anda bukan pemilik paket bank soal ini.")
  }
  return bank
}

/**
 * Sesi ujian berstatus aktif yang memakai paket ini, bila ada.
 */
export async function getActiveSessionForBank(
  ctx: AnyCtx,
  bankId: Id<"questionBanks">
): Promise<Doc<"examSessions"> | null> {
  const sessions = await ctx.db
    .query("examSessions")
    .withIndex("by_bank", (q) => q.eq("bankId", bankId))
    .collect()

  return sessions.find((s) => s.status === "active") ?? null
}

/**
 * Menolak perubahan butir selama paket dipakai sesi yang masih berjalan.
 */
export async function requireBankEditable(
  ctx: AnyCtx,
  user: AuthenticatedUser,
  bankId: Id<"questionBanks">
): Promise<Doc<"questionBanks">> {
  const bank = await requireOwnedBank(ctx, user, bankId)
  const activeSession = await getActiveSessionForBank(ctx, bankId)

  if (activeSession) {
    throw new Error(
      `Butir soal paket ini tidak dapat diubah, digandakan, dihapus, atau ditambah lewat impor karena sedang dipakai pada sesi "${activeSession.title}" yang masih berjalan.`
    )
  }

  return bank
}

/**
 * Gerbang tulis untuk satu butir: butinya ada, paketnya milik pemanggil, dan tidak sedang ujian berjalan.
 */
export async function requireEditableQuestion(
  ctx: AnyCtx,
  user: AuthenticatedUser,
  questionId: Id<"questions">
): Promise<{ question: Doc<"questions">; bank: Doc<"questionBanks"> }> {
  const question = await ctx.db.get("questions", questionId)
  if (!question) {
    throw new Error("Butir soal tidak ditemukan.")
  }

  const bank = await requireBankEditable(ctx, user, question.bankId)
  return { question, bank }
}

/**
 * Nomor urut berikutnya = nomor terakhir paket ditambah satu.
 * Jumlah butir tidak dipakai karena penghapusan butir dapat membuat nomor urut ganda.
 */
export async function nextOrderNumber(
  ctx: MutationCtx,
  bankId: Id<"questionBanks">
): Promise<number> {
  const last = await ctx.db
    .query("questions")
    .withIndex("by_bank_and_order", (q) => q.eq("bankId", bankId))
    .order("desc")
    .first()

  return (last?.orderNumber ?? 0) + 1
}

/**
 * Memastikan mata pelajaran yang dipilih pada paket baru benar-benar ada dan masih aktif.
 * Mata pelajaran nonaktif tetap terbaca pada paket lama, tapi tidak ditawarkan lagi.
 */
export async function requireSelectableSubject(
  ctx: AnyCtx,
  subjectCode: string
): Promise<Doc<"subjects">> {
  const code = subjectCode.trim().toUpperCase()
  const subject = await ctx.db
    .query("subjects")
    .withIndex("by_code", (q) => q.eq("code", code))
    .first()

  if (!subject) {
    throw new Error(
      `Mata pelajaran "${code}" belum ada di daftar. Pilih dari daftar yang tersedia atau tambahkan lewat halaman Kelola Mata Pelajaran.`
    )
  }
  if (subject.isActive === false) {
    throw new Error(
      `Mata pelajaran "${subject.name}" sudah dinonaktifkan sehingga tidak dapat dipakai pada paket baru. Aktifkan kembali bila paket ini memang memakai mata pelajaran tersebut.`
    )
  }

  return subject
}
