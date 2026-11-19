import { v } from "convex/values"
import { mutation } from "../../_generated/server"
import {
  getActiveAcademicPeriod,
  syncSantriExtracurricularsToHomeroom,
} from "../private/helpers"
import {
  normalizeEkskulName,
  getExtracurricularNarrative,
} from "../../../lib/extracurricular-constants"

export const seedDefaultGroupsAndRoster = mutation({
  args: {
    academicYear: v.optional(v.string()),
    semester: v.optional(v.union(v.literal(1), v.literal(2))),
    rosterEntries: v.optional(
      v.array(
        v.object({
          studentName: v.string(),
          className: v.string(),
          ekskul: v.string(),
        })
      )
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userName = identity?.name || "Pengajar/Pembina Ekskul"
    const period = await getActiveAcademicPeriod(ctx)
    const academicYear = args.academicYear || period.year
    const semester = args.semester || period.semester
    const now = Date.now()

    // 1. Buat grup default jika belum ada
    const existingGroups = await ctx.db
      .query("extracurricularGroups")
      .withIndex("by_period", (q) =>
        q.eq("academicYear", academicYear).eq("semester", semester)
      )
      .collect()

    const groupMapByCode = new Map<string, typeof existingGroups[0]>()
    for (const g of existingGroups) {
      groupMapByCode.set(g.code.toLowerCase(), g)
    }

    const defaultGroupDefs: Array<{
      code: string
      name: string
      category: "wajib" | "pilihan"
      genderRestriction?: "all" | "ikhwan" | "akhwat"
      description?: string
    }> = [
      { code: "Rohis", name: "Rohis", category: "wajib", genderRestriction: "all", description: "Pembinaan kerohanian Islam dan ibadah harian." },
      { code: "Futsal", name: "Futsal", category: "pilihan", genderRestriction: "ikhwan", description: "Penguasaan teknik bermain futsal dan kerjasama tim." },
      { code: "Badminton", name: "Badminton", category: "pilihan", genderRestriction: "all", description: "Teknik servis, lob, smash, dan kelincahan bulu tangkis." },
      { code: "Pingpong", name: "Pingpong", category: "pilihan", genderRestriction: "all", description: "Teknik forehand, backhand, dan reli tenis meja." },
      { code: "Panahan", name: "Panahan", category: "pilihan", genderRestriction: "all", description: "Konsentrasi, postur memanah, dan akurasi bidikan." },
      { code: "Volly", name: "Volly", category: "pilihan", genderRestriction: "all", description: "Passing, servis, blocking, dan kekompakan tim bola voli." },
      { code: "Agrobisnis", name: "Agrobisnis", category: "pilihan", genderRestriction: "all", description: "Teknik pembibitan, perawatan tanaman, dan hidroponik." },
      { code: "TIK", name: "TIK", category: "pilihan", genderRestriction: "ikhwan", description: "Pengoperasian komputer, aplikasi produktif, dan literasi digital." },
      { code: "Tata Boga", name: "Tata Boga", category: "pilihan", genderRestriction: "akhwat", description: "Pengolahan bahan makanan higienis, tata hidang, dan sanitasi." },
      { code: "Jurnalis", name: "Jurnalis", category: "pilihan", genderRestriction: "ikhwan", description: "Kepenulisan berita, wawancara, fotografi, dan majalah dinding." },
      { code: "IPA", name: "IPA", category: "pilihan", genderRestriction: "all", description: "Eksperimen sains, metode ilmiah, dan persiapan kompetisi OSN IPA." },
      { code: "IPS", name: "IPS", category: "pilihan", genderRestriction: "all", description: "Wawasan sosial, ekonomi, geografi, dan kompetisi OSN IPS." },
      { code: "Jurnalis Akhwat", name: "Jurnalis Akhwat", category: "pilihan", genderRestriction: "akhwat", description: "Kepenulisan artikel, fotografi, dan literasi mading santriwati." },
      { code: "Matematika", name: "Matematika", category: "pilihan", genderRestriction: "all", description: "Pemecahan masalah logika, olimpiade matematika, dan analisis angka." },
      { code: "TIK Akhwat", name: "TIK Akhwat", category: "pilihan", genderRestriction: "akhwat", description: "Aplikasi perkantoran, desain grafis komputer santriwati." },
      { code: "Pramuka", name: "Pramuka", category: "pilihan", genderRestriction: "all", description: "Kepanduan, kemandirian, dan kepemimpinan." },
    ]

    let groupsCreated = 0
    for (const def of defaultGroupDefs) {
      if (!groupMapByCode.has(def.code.toLowerCase())) {
        const id = await ctx.db.insert("extracurricularGroups", {
          code: def.code,
          name: def.name,
          category: def.category,
          genderRestriction: def.genderRestriction || "all",
          description: def.description,
          isActive: true,
          academicYear,
          semester,
          createdAt: now,
          updatedAt: now,
          updatedBy: userName,
        })
        const created = (await ctx.db.get(id))!
        groupMapByCode.set(def.code.toLowerCase(), created)
        groupsCreated++
      }
    }

    let enrollmentsCreated = 0

    // 2. Inisialisasi roster santri dari argumen
    if (args.rosterEntries && args.rosterEntries.length > 0) {
      const allStudents = await ctx.db.query("students").collect()

      // Ambil seluruh enrollment aktif yang sudah ada untuk periode ini
      const existingEnrollments = await ctx.db
        .query("extracurricularEnrollments")
        .withIndex("by_period_and_status", (q) =>
          q.eq("academicYear", academicYear).eq("semester", semester).eq("status", "active")
        )
        .collect()

      const enrolledKeys = new Set<string>()
      for (const e of existingEnrollments) {
        enrolledKeys.add(`${e.santriId}_${e.groupCode.toLowerCase()}`)
      }

      const rohisGroup = groupMapByCode.get("rohis")
      const santriEkskulMap = new Map<
        string,
        {
          santriId: string
          studentName: string
          className: string
          nisn: string
          institution: "SMPITA" | "SMAITA" | "MTA"
          extracurriculars: Array<{ name: string; score: string; description: string }>
        }
      >()

      for (const entry of args.rosterEntries) {
        const cleanedEntryName = entry.studentName.toLowerCase().trim()

        // Cari di students table secara fleksibel
        const matchedStudent = allStudents.find((s) => {
          const sName = s.nama.toLowerCase().trim()
          return sName === cleanedEntryName || sName.includes(cleanedEntryName) || cleanedEntryName.includes(sName)
        })

        const normClass = entry.className.trim()
        const isSMA = /X|XI|XII/i.test(normClass)
        const isMTA = /MTA/i.test(normClass)
        const institution: "SMPITA" | "SMAITA" | "MTA" = isSMA ? "SMAITA" : isMTA ? "MTA" : "SMPITA"

        const santriId =
          matchedStudent?.santriId ||
          `s_${cleanedEntryName.replace(/[^a-z0-9]/g, "_").slice(0, 30)}`
        const studentName = matchedStudent?.nama || entry.studentName
        const className = matchedStudent?.kelas || entry.className
        const nisn = matchedStudent?.nisn || matchedStudent?.nis || "-"
        const gender =
          matchedStudent?.jenisKelamin ||
          (/akhwat/i.test(entry.ekskul) || /[CD]$/i.test(normClass) ? "P" : "L")

        const normEkskul = normalizeEkskulName(entry.ekskul)
        const targetGroup =
          groupMapByCode.get(normEkskul.toLowerCase()) ||
          groupMapByCode.get(entry.ekskul.toLowerCase())

        // 1. Daftarkan ke ekskul pilihan
        if (targetGroup) {
          const key = `${santriId}_${targetGroup.code.toLowerCase()}`
          if (!enrolledKeys.has(key)) {
            await ctx.db.insert("extracurricularEnrollments", {
              groupId: targetGroup._id,
              groupCode: targetGroup.code,
              groupName: targetGroup.name,
              santriId,
              nisn,
              studentName,
              className,
              gender,
              institution,
              academicYear,
              semester,
              score: "A",
              description: getExtracurricularNarrative(targetGroup.name, "A"),
              status: "active",
              updatedBy: userName,
              createdAt: now,
              updatedAt: now,
            })
            enrolledKeys.add(key)
            enrollmentsCreated++
          }

          if (!santriEkskulMap.has(santriId)) {
            santriEkskulMap.set(santriId, {
              santriId,
              studentName,
              className,
              nisn,
              institution,
              extracurriculars: [],
            })
          }
          const rec = santriEkskulMap.get(santriId)!
          if (!rec.extracurriculars.some((e) => e.name.toLowerCase() === targetGroup.name.toLowerCase())) {
            rec.extracurriculars.push({
              name: targetGroup.name,
              score: "A",
              description: getExtracurricularNarrative(targetGroup.name, "A"),
            })
          }
        }

        // 2. Daftarkan ke ekskul wajib Rohis
        if (rohisGroup) {
          const rohisKey = `${santriId}_${rohisGroup.code.toLowerCase()}`
          if (!enrolledKeys.has(rohisKey)) {
            await ctx.db.insert("extracurricularEnrollments", {
              groupId: rohisGroup._id,
              groupCode: rohisGroup.code,
              groupName: rohisGroup.name,
              santriId,
              nisn,
              studentName,
              className,
              gender,
              institution,
              academicYear,
              semester,
              score: "A",
              description: getExtracurricularNarrative("Rohis", "A"),
              status: "active",
              updatedBy: userName,
              createdAt: now,
              updatedAt: now,
            })
            enrolledKeys.add(rohisKey)
            enrollmentsCreated++
          }

          if (!santriEkskulMap.has(santriId)) {
            santriEkskulMap.set(santriId, {
              santriId,
              studentName,
              className,
              nisn,
              institution,
              extracurriculars: [],
            })
          }
          const rec = santriEkskulMap.get(santriId)!
          if (!rec.extracurriculars.some((e) => e.name.toLowerCase() === "rohis")) {
            rec.extracurriculars.unshift({
              name: "Rohis",
              score: "A",
              description: getExtracurricularNarrative("Rohis", "A"),
            })
          }
        }
      }

      // Sinkronkan ke homeroomAssessments santri
      for (const [sId, item] of santriEkskulMap.entries()) {
        const existingHomeroom = await ctx.db
          .query("homeroomAssessments")
          .withIndex("by_santri", (q) =>
            q.eq("santriId", sId).eq("academicYear", academicYear).eq("semester", semester)
          )
          .first()

        if (existingHomeroom) {
          await ctx.db.patch(existingHomeroom._id, {
            extracurriculars: item.extracurriculars,
            updatedBy: userName,
            updatedAt: now,
          })
        } else {
          await ctx.db.insert("homeroomAssessments", {
            academicYear,
            semester,
            santriId: item.santriId,
            nisn: item.nisn,
            studentName: item.studentName,
            className: item.className,
            institution: item.institution,
            sickDays: 0,
            permissionDays: 0,
            absentDays: 0,
            extracurriculars: item.extracurriculars,
            haditsTarget: "3 Hadits Arba'in",
            haditsAchievement: "3 Hadits Tuntas",
            homeroomNotes:
              "Alhamdulillah, semangat belajar dan tingkatkan terus prestasimu. Ta'at kepada guru dan orangtua serta istiqomah muraja'ah Al-Qur'an dan Hadits setiap hari.",
            promotionDecision: "-",
            updatedBy: userName,
            createdAt: now,
            updatedAt: now,
          })
        }
      }
    }

    return {
      academicYear,
      semester,
      groupsCreated: groupsCreated > 0 ? groupsCreated : existingGroups.length,
      enrollmentsCreated,
    }
  },
})

export const addMemberToGroup = mutation({
  args: {
    groupId: v.id("extracurricularGroups"),
    santriId: v.string(),
    score: v.optional(v.union(v.literal("A"), v.literal("B"), v.literal("C"))),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userName = identity?.name || "Pengajar/Pembina Ekskul"
    const now = Date.now()

    const group = await ctx.db.get(args.groupId)
    if (!group) throw new Error("Kelompok ekskul tidak ditemukan.")

    const student = await ctx.db
      .query("students")
      .withIndex("by_santri_id", (q) => q.eq("santriId", args.santriId))
      .first()

    if (!student) throw new Error("Data santri tidak ditemukan.")

    // Cek duplikasi
    const existing = await ctx.db
      .query("extracurricularEnrollments")
      .withIndex("by_santri_and_group", (q) =>
        q
          .eq("santriId", args.santriId)
          .eq("groupCode", group.code)
          .eq("academicYear", group.academicYear)
          .eq("semester", group.semester)
      )
      .first()

    const score = args.score || "A"
    const desc = args.description || getExtracurricularNarrative(group.name, score)

    let enrollmentId = existing?._id

    if (existing) {
      if (existing.status === "active") {
        throw new Error(`Santri sudah aktif terdaftar di ekskul ${group.name}.`)
      }
      await ctx.db.patch(existing._id, {
        status: "active",
        score,
        description: desc,
        updatedBy: userName,
        updatedAt: now,
      })
    } else {
      enrollmentId = await ctx.db.insert("extracurricularEnrollments", {
        groupId: group._id,
        groupCode: group.code,
        groupName: group.name,
        santriId: student.santriId,
        nisn: student.nisn || student.nis || "-",
        studentName: student.nama,
        className: student.kelas,
        gender: student.jenisKelamin,
        institution: student.jenjang,
        academicYear: group.academicYear,
        semester: group.semester,
        score,
        description: desc,
        status: "active",
        updatedBy: userName,
        createdAt: now,
        updatedAt: now,
      })
    }

    // Sinkronkan ke Rapor
    await syncSantriExtracurricularsToHomeroom(ctx, {
      santriId: args.santriId,
      academicYear: group.academicYear,
      semester: group.semester,
      updatedBy: userName,
    })

    return { success: true, enrollmentId }
  },
})

export const removeMemberFromGroup = mutation({
  args: {
    enrollmentId: v.id("extracurricularEnrollments"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userName = identity?.name || "Pengajar/Pembina Ekskul"
    const enrollment = await ctx.db.get(args.enrollmentId)
    if (!enrollment) throw new Error("Data keanggotaan tidak ditemukan.")

    if (enrollment.groupCode.toLowerCase() === "rohis") {
      throw new Error("Ekskul Rohis adalah ekskul wajib dan tidak dapat dihapus.")
    }

    const now = Date.now()
    await ctx.db.patch(enrollment._id, {
      status: "dropped",
      updatedBy: userName,
      updatedAt: now,
    })

    // Sinkronkan ke Rapor
    await syncSantriExtracurricularsToHomeroom(ctx, {
      santriId: enrollment.santriId,
      academicYear: enrollment.academicYear,
      semester: enrollment.semester,
      updatedBy: userName,
    })

    return { success: true }
  },
})

export const transferMemberGroup = mutation({
  args: {
    enrollmentId: v.id("extracurricularEnrollments"),
    targetGroupId: v.id("extracurricularGroups"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userName = identity?.name || "Pengajar/Pembina Ekskul"
    const now = Date.now()

    const sourceEnrollment = await ctx.db.get(args.enrollmentId)
    if (!sourceEnrollment) throw new Error("Data keanggotaan asal tidak ditemukan.")

    if (sourceEnrollment.groupCode.toLowerCase() === "rohis") {
      throw new Error("Ekskul Rohis adalah ekskul wajib dan tidak dapat dipindahkan.")
    }

    const targetGroup = await ctx.db.get(args.targetGroupId)
    if (!targetGroup) throw new Error("Kelompok ekskul tujuan tidak ditemukan.")

    if (sourceEnrollment.groupId === targetGroup._id) {
      throw new Error("Kelompok tujuan sama dengan kelompok saat ini.")
    }

    // Tandai enrollment lama sebagai transferred
    await ctx.db.patch(sourceEnrollment._id, {
      status: "transferred",
      transferredToGroupCode: targetGroup.code,
      updatedBy: userName,
      updatedAt: now,
    })

    // Daftarkan ke target group
    const existingInTarget = await ctx.db
      .query("extracurricularEnrollments")
      .withIndex("by_santri_and_group", (q) =>
        q
          .eq("santriId", sourceEnrollment.santriId)
          .eq("groupCode", targetGroup.code)
          .eq("academicYear", targetGroup.academicYear)
          .eq("semester", targetGroup.semester)
      )
      .first()

    const newScore = sourceEnrollment.score || "A"
    const newDesc = getExtracurricularNarrative(targetGroup.name, newScore)

    if (existingInTarget) {
      await ctx.db.patch(existingInTarget._id, {
        status: "active",
        score: newScore,
        description: newDesc,
        updatedBy: userName,
        updatedAt: now,
      })
    } else {
      await ctx.db.insert("extracurricularEnrollments", {
        groupId: targetGroup._id,
        groupCode: targetGroup.code,
        groupName: targetGroup.name,
        santriId: sourceEnrollment.santriId,
        nisn: sourceEnrollment.nisn,
        studentName: sourceEnrollment.studentName,
        className: sourceEnrollment.className,
        gender: sourceEnrollment.gender,
        institution: sourceEnrollment.institution,
        academicYear: targetGroup.academicYear,
        semester: targetGroup.semester,
        score: newScore,
        description: newDesc,
        status: "active",
        updatedBy: userName,
        createdAt: now,
        updatedAt: now,
      })
    }

    // Sinkronkan ke Rapor
    await syncSantriExtracurricularsToHomeroom(ctx, {
      santriId: sourceEnrollment.santriId,
      academicYear: targetGroup.academicYear,
      semester: targetGroup.semester,
      updatedBy: userName,
    })

    return { success: true }
  },
})

export const updateMemberAssessment = mutation({
  args: {
    enrollmentId: v.id("extracurricularEnrollments"),
    score: v.union(v.literal("A"), v.literal("B"), v.literal("C")),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userName = identity?.name || "Pengajar/Pembina Ekskul"
    const enrollment = await ctx.db.get(args.enrollmentId)
    if (!enrollment) throw new Error("Data keanggotaan tidak ditemukan.")

    const now = Date.now()
    await ctx.db.patch(enrollment._id, {
      score: args.score,
      description: args.description,
      updatedBy: userName,
      updatedAt: now,
    })

    // Sinkronkan ke Rapor
    await syncSantriExtracurricularsToHomeroom(ctx, {
      santriId: enrollment.santriId,
      academicYear: enrollment.academicYear,
      semester: enrollment.semester,
      updatedBy: userName,
    })

    return { success: true }
  },
})

export const updateGroupCoach = mutation({
  args: {
    groupId: v.id("extracurricularGroups"),
    coachName: v.string(),
    coachNiy: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userName = identity?.name || "Pengajar/Pembina Ekskul"
    const group = await ctx.db.get(args.groupId)
    if (!group) throw new Error("Kelompok ekskul tidak ditemukan.")

    const now = Date.now()
    await ctx.db.patch(args.groupId, {
      coachName: args.coachName.trim() || undefined,
      coachNiy: args.coachNiy?.trim() || undefined,
      description: args.description?.trim() || group.description,
      updatedBy: userName,
      updatedAt: now,
    })

    return { success: true }
  },
})
