import { v } from "convex/values"

import { mutation, internalMutation, type MutationCtx } from "../../_generated/server"
import { cleanStudentName } from "../../../lib/rapor-utils"
import type { Doc, Id } from "../../_generated/dataModel"
import { normalizeSubjectCode, resolveBankLevelPair } from "../../model/institutions"
import { ACHIEVEMENT_REF_MAX_LENGTH } from "../../model/thinkingLevels"
import {
  nextOrderNumber,
  requireAuthenticatedUser,
  requireBankEditable,
  requireEditableQuestion,
  requireOwnedBank,
  requireSelectableSubject,
} from "../private/helpers"

type QuestionOption = NonNullable<Doc<"questions">["options"]>[number]

/**
 * Kolom isi butir soal yang sama dipakai oleh jalur tambah dan jalur sunting,
 * agar aturan penyimpanan tidak bisa berbeda tanpa disengaja.
 */
const questionBodyFields = {
  type: v.union(
    v.literal("multiple_choice"),
    v.literal("pg_kompleks"),
    v.literal("true_false"),
    v.literal("essay")
  ),
  stimulusText: v.optional(v.string()),
  stimulusMediaUrl: v.optional(v.string()),
  stimulusMediaStorageId: v.optional(v.id("_storage")),
  questionText: v.string(),
  points: v.number(),
  options: v.optional(
    v.array(
      v.object({
        id: v.string(),
        label: v.string(),
        text: v.string(),
        isCorrect: v.boolean(),
      })
    )
  ),
  rubric: v.optional(v.string()),
  explanation: v.optional(v.string()),
  thinkingLevel: v.optional(
    v.union(
      v.literal("mengingat"),
      v.literal("memahami"),
      v.literal("mengaplikasikan"),
      v.literal("menganalisis")
    )
  ),
  achievementRef: v.optional(v.string()),
}

type QuestionBodyArgs = {
  type: Doc<"questions">["type"]
  questionText: string
  points: number
  options?: QuestionOption[]
  explanation?: string
  achievementRef?: string
}

/** Isian opsional yang kosong disimpan sebagai absen, bukan string kosong. */
function optionalText(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

/**
 * Aturan kunci jawaban per tipe soal. Dipakai saat menambah dan saat menyunting butir.
 * Baris opsi yang kosong teksnya tidak ikut dikirim layar, jadi aturan ini menjaga jalur lain.
 */
function validateQuestionBody(args: QuestionBodyArgs) {
  if (!args.questionText.trim()) {
    throw new Error("Teks butir soal harus diisi.")
  }
  if (!Number.isFinite(args.points) || args.points <= 0) {
    throw new Error("Bobot poin butir soal harus berupa angka lebih besar dari nol.")
  }
  if ((args.achievementRef?.trim().length ?? 0) > ACHIEVEMENT_REF_MAX_LENGTH) {
    throw new Error(
      `Rujukan capaian materi maksimal ${ACHIEVEMENT_REF_MAX_LENGTH} karakter karena dipakai sebagai label pendek.`
    )
  }

  // Validasi opsi pilihan ganda
  if (args.type === "multiple_choice") {
    if (!args.options || args.options.length < 2) {
      throw new Error("Soal pilihan ganda harus memiliki minimal 2 opsi jawaban.")
    }
    if (args.options.length > 5) {
      throw new Error("Soal pilihan ganda maksimal memiliki 5 opsi jawaban (A sampai E).")
    }
    if (args.options.some((o) => !o.text.trim())) {
      throw new Error("Setiap opsi jawaban harus berisi teks.")
    }
    const correctCount = args.options.filter((o) => o.isCorrect).length
    if (correctCount !== 1) {
      throw new Error("Soal pilihan ganda harus memiliki tepat satu kunci jawaban yang benar.")
    }
  }

  // Validasi opsi pilihan ganda kompleks (multi-kunci benar)
  if (args.type === "pg_kompleks") {
    if (!args.options || args.options.length < 3) {
      throw new Error("Soal pilihan ganda kompleks harus memiliki minimal 3 opsi jawaban.")
    }
    if (args.options.length > 5) {
      throw new Error("Soal pilihan ganda kompleks maksimal memiliki 5 opsi jawaban (A sampai E).")
    }
    if (args.options.some((o) => !o.text.trim())) {
      throw new Error("Setiap opsi jawaban harus berisi teks.")
    }
    const correctCount = args.options.filter((o) => o.isCorrect).length
    if (correctCount < 2) {
      throw new Error("Soal pilihan ganda kompleks harus memiliki minimal 2 kunci jawaban yang benar.")
    }
  }

  // Validasi opsi benar/salah
  if (args.type === "true_false") {
    if (!args.options || args.options.length !== 2) {
      throw new Error("Soal benar/salah harus memiliki tepat 2 opsi pilihan (Benar dan Salah).")
    }
    const correctCount = args.options.filter((o) => o.isCorrect).length
    if (correctCount !== 1) {
      throw new Error("Soal benar/salah harus memiliki tepat satu status jawaban yang benar.")
    }
  }
}

/**
 * Menambahkan butir soal baru ke dalam bank soal.
 */
export const createQuestion = mutation({
  args: {
    bankId: v.id("questionBanks"),
    ...questionBodyFields,
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    await requireOwnedBank(ctx, user, args.bankId)

    validateQuestionBody(args)

    const orderNumber = await nextOrderNumber(ctx, args.bankId)
    const now = Date.now()

    let finalMediaUrl = args.stimulusMediaUrl?.trim() || undefined
    if (args.stimulusMediaStorageId) {
      const storageUrl = await ctx.storage.getUrl(args.stimulusMediaStorageId)
      if (storageUrl) finalMediaUrl = storageUrl
    }

    const questionId = await ctx.db.insert("questions", {
      bankId: args.bankId,
      orderNumber,
      type: args.type,
      stimulusText: args.stimulusText?.trim() || undefined,
      stimulusMediaUrl: finalMediaUrl,
      stimulusMediaStorageId: args.stimulusMediaStorageId,
      questionText: args.questionText.trim(),
      points: args.points,
      options: args.options,
      rubric: args.rubric?.trim(),
      explanation: optionalText(args.explanation),
      thinkingLevel: args.thinkingLevel,
      achievementRef: optionalText(args.achievementRef),
      createdAt: now,
      updatedAt: now,
    })

    return questionId
  },
})

/**
 * Menyunting isi butir soal yang sudah tersimpan.
 * Nomor urut dan paket induknya tidak ikut berubah.
 */
export const updateQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    ...questionBodyFields,
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    const { question } = await requireEditableQuestion(ctx, user, args.questionId)

    validateQuestionBody(args)

    let finalMediaUrl = args.stimulusMediaUrl?.trim() || undefined
    if (args.stimulusMediaStorageId) {
      const storageUrl = await ctx.storage.getUrl(args.stimulusMediaStorageId)
      if (storageUrl) finalMediaUrl = storageUrl
    }

    if (question.stimulusMediaStorageId && args.stimulusMediaStorageId !== question.stimulusMediaStorageId) {
      try {
        await ctx.storage.delete(question.stimulusMediaStorageId)
      } catch {}
    }

    await ctx.db.patch("questions", args.questionId, {
      type: args.type,
      stimulusText: args.stimulusText?.trim() || undefined,
      stimulusMediaUrl: finalMediaUrl,
      stimulusMediaStorageId: args.stimulusMediaStorageId,
      questionText: args.questionText.trim(),
      points: args.points,
      options: args.options,
      rubric: args.rubric?.trim(),
      explanation: optionalText(args.explanation),
      thinkingLevel: args.thinkingLevel,
      achievementRef: optionalText(args.achievementRef),
      updatedAt: Date.now(),
    })

    return question.orderNumber
  },
})

/**
 * Menggandakan butir soal menjadi salinan utuh di akhir daftar paket yang sama.
 */
export const duplicateQuestion = mutation({
  args: {
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    const { question } = await requireEditableQuestion(ctx, user, args.questionId)

    const orderNumber = await nextOrderNumber(ctx, question.bankId)
    const now = Date.now()

    return await ctx.db.insert("questions", {
      bankId: question.bankId,
      orderNumber,
      type: question.type,
      stimulusText: question.stimulusText,
      stimulusMediaUrl: question.stimulusMediaUrl,
      stimulusMediaStorageId: question.stimulusMediaStorageId,
      questionText: question.questionText,
      points: question.points,
      options: question.options,
      rubric: question.rubric,
      explanation: question.explanation,
      thinkingLevel: question.thinkingLevel,
      achievementRef: question.achievementRef,
      createdAt: now,
      updatedAt: now,
    })
  },
})

/**
 * Menghapus butir soal.
 */
export const deleteQuestion = mutation({
  args: {
    questionId: v.id("questions"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    const { question } = await requireEditableQuestion(ctx, user, args.questionId)

    if (question.stimulusMediaStorageId) {
      try {
        await ctx.storage.delete(question.stimulusMediaStorageId)
      } catch {}
    }

    await ctx.db.delete("questions", args.questionId)
  },
})

/** Batas butir per tahap impor; layar mengirim bertahap jauh di bawah batas ini. */
const IMPORT_BATCH_LIMIT = 200

/**
 * Menyimpan sekelompok hasil tafsiran tempelan ke akhir daftar satu paket.
 * Nomor urut dihitung sekali per panggilan dan seluruh butir diperiksa sebelum ada yang ditulis,
 * sehingga kegagalan di tengah tidak meninggalkan daftar setengah jadi tanpa keterangan.
 * Paket yang sedang dipakai ujian berjalan ditolak: menulis berpuluh butir sekaligus ke
 * daftar yang sedang dikerjakan santri lebih berbahaya daripada menyunting satu butirnya.
 */
export const importQuestions = mutation({
  args: {
    bankId: v.id("questionBanks"),
    items: v.array(v.object(questionBodyFields)),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    await requireBankEditable(ctx, user, args.bankId)

    if (args.items.length === 0) {
      throw new Error("Tidak ada butir soal yang dapat disimpan dari tempelan ini.")
    }
    if (args.items.length > IMPORT_BATCH_LIMIT) {
      throw new Error(`Satu tahap impor maksimal ${IMPORT_BATCH_LIMIT} butir soal.`)
    }

    args.items.forEach((item, index) => {
      try {
        validateQuestionBody(item)
      } catch (error) {
        const reason = error instanceof Error ? error.message : "isinya belum lengkap."
        throw new Error(`Butir ke-${index + 1} pada tahap ini tidak dapat disimpan: ${reason}`)
      }
    })

    const now = Date.now()
    let orderNumber = await nextOrderNumber(ctx, args.bankId)
    const firstOrderNumber = orderNumber

    for (const item of args.items) {
      await ctx.db.insert("questions", {
        bankId: args.bankId,
        orderNumber,
        type: item.type,
        stimulusText: item.stimulusText?.trim() || undefined,
        stimulusMediaUrl: item.stimulusMediaUrl?.trim() || undefined,
        questionText: item.questionText.trim(),
        points: item.points,
        options: item.options,
        rubric: item.rubric?.trim(),
        explanation: optionalText(item.explanation),
        thinkingLevel: item.thinkingLevel,
        achievementRef: optionalText(item.achievementRef),
        createdAt: now,
        updatedAt: now,
      })
      orderNumber += 1
    }

    return {
      inserted: args.items.length,
      firstOrderNumber,
      lastOrderNumber: orderNumber - 1,
    }
  },
})

/**
 * Membuat paket bank soal baru.
 */
export const createQuestionBank = mutation({
  args: {
    title: v.string(),
    subjectCode: v.string(),
    institution: v.string(),
    gradeLevel: v.string(),
    description: v.optional(v.string()),
    totalPoints: v.optional(v.number()),
    passingScore: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)

    // Tingkat paket bukan teks bebas: pasangan lembaga + jenjang resmi divalidasi di sini,
    // bukan hanya di dropdown, agar data yang masuk tetap sebanding dengan kelas santri.
    const level = resolveBankLevelPair(args.institution, args.gradeLevel)
    await requireSelectableSubject(ctx, args.subjectCode)

    const now = Date.now()
    const bankId = await ctx.db.insert("questionBanks", {
      title: args.title.trim(),
      subjectCode: args.subjectCode.trim().toUpperCase(),
      gradeLevel: level.gradeLevel,
      institution: level.institution,
      description: args.description?.trim(),
      totalPoints: args.totalPoints ?? 100,
      passingScore: args.passingScore ?? 75,
      authorTokenIdentifier: user.tokenIdentifier,
      authorName: user.name,
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    })

    return bankId
  },
})

/**
 * Memperbarui data paket bank soal.
 */
export const updateQuestionBank = mutation({
  args: {
    bankId: v.id("questionBanks"),
    title: v.optional(v.string()),
    subjectCode: v.optional(v.string()),
    institution: v.optional(v.string()),
    gradeLevel: v.optional(v.string()),
    description: v.optional(v.string()),
    totalPoints: v.optional(v.number()),
    passingScore: v.optional(v.number()),
    isArchived: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    const bank = await requireOwnedBank(ctx, user, args.bankId)

    const updates: Record<string, unknown> = {
      updatedAt: Date.now(),
    }

    if (args.subjectCode !== undefined) {
      const code = args.subjectCode.trim().toUpperCase()
      if (code !== bank.subjectCode) {
        await requireSelectableSubject(ctx, code)
      }
      updates.subjectCode = code
    }

    // Lembaga dan tingkat selalu disimpan berpasangan; mengirim salah satunya saja
    // berisiko meninggalkan paket dengan tingkat yang tidak lagi cocok dengan lembaga.
    if (args.institution !== undefined || args.gradeLevel !== undefined) {
      const institution = args.institution ?? bank.institution ?? ""
      const gradeLevel = args.gradeLevel ?? bank.gradeLevel
      const level = resolveBankLevelPair(institution, gradeLevel)
      updates.institution = level.institution
      updates.gradeLevel = level.gradeLevel
    }

    if (args.title !== undefined) updates.title = args.title.trim()
    if (args.description !== undefined) updates.description = args.description?.trim()
    if (args.totalPoints !== undefined) updates.totalPoints = args.totalPoints
    if (args.passingScore !== undefined) updates.passingScore = args.passingScore
    if (args.isArchived !== undefined) updates.isArchived = args.isArchived

    await ctx.db.patch("questionBanks", args.bankId, updates)
  },
})

/**
 * Menghapus paket bank soal dan butir-butir soal di dalamnya.
 */
export const deleteQuestionBank = mutation({
  args: {
    bankId: v.id("questionBanks"),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    const bank = await ctx.db.get("questionBanks", args.bankId)
    if (!bank) {
      throw new Error("Paket bank soal tidak ditemukan.")
    }

    if (bank.authorTokenIdentifier !== user.tokenIdentifier) {
      throw new Error("Akses ditolak: Anda bukan pemilik paket bank soal ini.")
    }

    // Periksa apakah paket dipakai pada sesi ujian (aktif atau riwayat)
    const sessions = await ctx.db
      .query("examSessions")
      .withIndex("by_bank", (idx) => idx.eq("bankId", args.bankId))
      .collect()

    if (sessions.length > 0) {
      const active = sessions.find((s) => s.status === "active")
      if (active) {
        throw new Error(
          `Paket bank soal tidak dapat dihapus karena sedang dipakai pada sesi "${active.title}" yang masih berjalan.`
        )
      }
      const firstSession = sessions[0]
      throw new Error(
        `Paket bank soal tidak dapat dihapus karena sudah dipakai pada sesi "${firstSession.title}". Paket yang memiliki riwayat sesi ujian dilindungi agar data ujian santri tidak rusak.`
      )
    }

    // Hapus seluruh butir soal yang berelasi
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_bank", (idx) => idx.eq("bankId", args.bankId))
      .collect()

    for (const q of questions) {
      await ctx.db.delete("questions", q._id)
    }

    await ctx.db.delete("questionBanks", args.bankId)
  },
})

/**
 * Inisialisasi daftar mata pelajaran default pesantren/madrasah.
 */
export async function executeSeedOfficialSubjects(ctx: MutationCtx) {
  const officialSubjects = [
    // 10 Mapel Umum (Kurikulum Merdeka)
    { code: "PAI", name: "Pendidikan Agama Islam dan Budi Pekerti", category: "umum" as const, description: "Pendidikan Agama Islam dan Budi Pekerti" },
    { code: "PP", name: "Pendidikan Pancasila", category: "umum" as const, description: "Pendidikan Pancasila" },
    { code: "BINDO", name: "Bahasa Indonesia", category: "umum" as const, description: "Bahasa Indonesia" },
    { code: "MTK", name: "Matematika", category: "umum" as const, description: "Matematika" },
    { code: "IPA", name: "Ilmu Pengetahuan Alam", category: "umum" as const, description: "Ilmu Pengetahuan Alam" },
    { code: "IPS", name: "Ilmu Pengetahuan Sosial", category: "umum" as const, description: "Ilmu Pengetahuan Sosial" },
    { code: "BING", name: "Bahasa Inggris", category: "umum" as const, description: "Bahasa Inggris" },
    { code: "PJOK", name: "Pendidikan Jasmani Olahraga dan Kesehatan", category: "umum" as const, description: "Pendidikan Jasmani Olahraga dan Kesehatan" },
    { code: "INFOR", name: "Informatika", category: "umum" as const, description: "Informatika" },
    { code: "PRA", name: "Prakarya Kerajinan", category: "umum" as const, description: "Prakarya Kerajinan" },

    // 6 Mapel Diniyah (Kepesantrenan - KKM 70)
    { code: "AQIDAH", name: "Aqidah", category: "diniyah" as const, passingScore: 70, description: "Aqidah & Tauhid Pesantren At-Tauhid" },
    { code: "ADAB", name: "Adab & Akhlak", category: "diniyah" as const, passingScore: 70, description: "Adab & Akhlak Santri" },
    { code: "FIQIH", name: "Fiqih", category: "diniyah" as const, passingScore: 70, description: "Fiqih Ibadah Pesantren At-Tauhid" },
    { code: "BARAB", name: "Bahasa Arab", category: "diniyah" as const, passingScore: 70, description: "Bahasa Arab (Durusul Lughah & Mufradat)" },
    { code: "NAHWU", name: "Nahwu", category: "diniyah" as const, passingScore: 70, description: "Kaidah Bahasa Arab & Nahwu" },
    { code: "SHIROH", name: "Shiroh", category: "diniyah" as const, passingScore: 70, description: "Sejarah Perjuangan Rasulullah SAW & Sahabat" },
  ]

  const officialCodes = new Set(officialSubjects.map((s) => s.code))

  // 1. Harmonisasi B_ARAB -> BARAB bila ada
  const legacyBarab = await ctx.db
    .query("subjects")
    .withIndex("by_code", (idx) => idx.eq("code", "B_ARAB"))
    .first()
  if (legacyBarab) {
    const existingBarab = await ctx.db
      .query("subjects")
      .withIndex("by_code", (idx) => idx.eq("code", "BARAB"))
      .first()
    if (!existingBarab) {
      await ctx.db.patch(legacyBarab._id, {
        code: "BARAB",
        name: "Bahasa Arab",
        category: "diniyah",
        passingScore: 70,
        description: "Bahasa Arab (Durusul Lughah & Mufradat)",
        isActive: true,
        updatedAt: Date.now(),
      })
    } else {
      await ctx.db.delete(legacyBarab._id)
    }
  }

  // 2. Hapus mapel contoh / lama yang bukan bagian dari 16 mapel resmi (TARIKH, HADITS, TAHFIDZ, dll.)
  const allCurrent = await ctx.db.query("subjects").collect()
  for (const curr of allCurrent) {
    if (!officialCodes.has(curr.code)) {
      const banks = await ctx.db
        .query("questionBanks")
        .withIndex("by_subject", (idx) => idx.eq("subjectCode", curr.code))
        .collect()
      for (const b of banks) {
        const questions = await ctx.db
          .query("questions")
          .withIndex("by_bank", (idx) => idx.eq("bankId", b._id))
          .collect()
        for (const q of questions) {
          await ctx.db.delete(q._id)
        }
        await ctx.db.delete(b._id)
      }
      await ctx.db.delete(curr._id)
    }
  }

  // 3. Upsert 16 mapel resmi
  for (const s of officialSubjects) {
    const existing = await ctx.db
      .query("subjects")
      .withIndex("by_code", (idx) => idx.eq("code", s.code))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: s.name,
        category: s.category,
        passingScore: s.passingScore,
        description: s.description,
        isActive: true,
        updatedAt: Date.now(),
      })
    } else {
      await ctx.db.insert("subjects", {
        code: s.code,
        name: s.name,
        category: s.category,
        passingScore: s.passingScore,
        description: s.description,
        isActive: true,
        createdAt: Date.now(),
      })
    }
  }

  // 4. Bersihkan nama santri dari sufiks NISN di tabel students
  const students = await ctx.db.query("students").collect()
  let cleanedCount = 0
  for (const st of students) {
    const cleaned = cleanStudentName(st.nama)
    if (cleaned !== st.nama) {
      await ctx.db.patch(st._id, { nama: cleaned })
      cleanedCount++
    }
  }

  return { success: true, count: officialSubjects.length, cleanedStudents: cleanedCount }
}

export const seedDefaultSubjects = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx)
    return await executeSeedOfficialSubjects(ctx)
  },
})

async function loadSubject(ctx: MutationCtx, subjectId: Id<"subjects">) {
  const subject = await ctx.db.get("subjects", subjectId)
  if (!subject) {
    throw new Error("Mata pelajaran tidak ditemukan.")
  }
  return subject
}

/**
 * Menambah mata pelajaran pada daftar bersama madrasah.
 */
export const addSubject = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx)

    const name = args.name.trim()
    if (!name) {
      throw new Error("Nama mata pelajaran harus diisi.")
    }

    const code = normalizeSubjectCode(args.code)
    if (!code) {
      throw new Error("Kode singkat mata pelajaran harus diisi, misalnya FIQIH atau B_ARAB.")
    }

    const taken = await ctx.db.query("subjects").withIndex("by_code", (idx) => idx.eq("code", code)).first()
    if (taken) {
      throw new Error(
        `Kode "${code}" sudah dipakai oleh mata pelajaran "${taken.name}". Pakai kode lain, atau ganti nama mata pelajaran yang sudah ada itu.`
      )
    }

    const now = Date.now()
    return await ctx.db.insert("subjects", {
      code,
      name,
      description: args.description?.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    })
  },
})

/**
 * Mengganti nama dan deskripsi mata pelajaran. Kode tidak diubah karena ia menjadi
 * pengenal pada paket yang sudah ada, sehingga nama baru otomatis terbaca di sana.
 */
export const renameSubject = mutation({
  args: {
    subjectId: v.id("subjects"),
    name: v.string(),
    description: v.optional(v.string()),
    code: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx)
    const subject = await loadSubject(ctx, args.subjectId)

    const name = args.name.trim()
    if (!name) {
      throw new Error("Nama mata pelajaran harus diisi.")
    }

    let newCode = subject.code
    let updatedBanksCount = 0

    if (args.code !== undefined) {
      const normalized = normalizeSubjectCode(args.code)
      if (!normalized) {
        throw new Error("Kode singkat mata pelajaran tidak boleh kosong.")
      }
      if (normalized !== subject.code) {
        const existing = await ctx.db
          .query("subjects")
          .withIndex("by_code", (idx) => idx.eq("code", normalized))
          .first()
        if (existing && existing._id !== subject._id) {
          throw new Error(
            `Kode "${normalized}" sudah dipakai oleh mata pelajaran "${existing.name}". Pakai kode lain.`
          )
        }

        // Pembaruan beruntun (cascading update) ke seluruh paket bank soal yang memakai kode lama
        const affectedBanks = await ctx.db
          .query("questionBanks")
          .withIndex("by_subject", (idx) => idx.eq("subjectCode", subject.code))
          .collect()

        for (const bank of affectedBanks) {
          await ctx.db.patch("questionBanks", bank._id, {
            subjectCode: normalized,
            updatedAt: Date.now(),
          })
          updatedBanksCount++
        }

        newCode = normalized
      }
    }

    await ctx.db.patch("subjects", subject._id, {
      code: newCode,
      name,
      description: args.description?.trim(),
      updatedAt: Date.now(),
    })

    return {
      updatedBanksCount,
      codeChanged: newCode !== subject.code,
      newCode,
    }
  },
})

/**
 * Menonaktifkan atau mengaktifkan kembali mata pelajaran. Nonaktif berarti tidak
 * lagi ditawarkan pada pembuatan paket baru; paket lama tetap menampilkan namanya.
 */
export const setSubjectActive = mutation({
  args: {
    subjectId: v.id("subjects"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx)
    const subject = await loadSubject(ctx, args.subjectId)

    await ctx.db.patch("subjects", subject._id, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    })
  },
})

/**
 * Menghapus mata pelajaran permanen. Hanya boleh bila tidak ada satu pun paket yang memakainya.
 */
export const deleteSubject = mutation({
  args: {
    subjectId: v.id("subjects"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx)
    const subject = await loadSubject(ctx, args.subjectId)

    const usingBanks = await ctx.db
      .query("questionBanks")
      .withIndex("by_subject", (idx) => idx.eq("subjectCode", subject.code))
      .collect()

    if (usingBanks.length > 0) {
      throw new Error(
        `Mata pelajaran "${subject.name}" masih dipakai ${usingBanks.length} paket bank soal sehingga tidak bisa dihapus. Nonaktifkan saja supaya pilihan ini hilang dari paket baru.`
      )
    }

    await ctx.db.delete("subjects", subject._id)
  },
})

/**
 * Menghasilkan URL unggah berkas sementara ke Convex Storage untuk berkas gambar stimulus.
 */
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requireAuthenticatedUser(ctx)
    return await ctx.storage.generateUploadUrl()
  },
})

/**
 * Mengambil URL publik langsung dari storage ID yang baru diunggah ke Convex.
 */
export const getStorageMediaUrl = mutation({
  args: {
    storageId: v.id("_storage"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx)
    const url = await ctx.storage.getUrl(args.storageId)
    return { url }
  },
})
