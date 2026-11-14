import { v } from "convex/values"
import { query } from "../../_generated/server"
import { requireAuthenticatedUser, findStudentsByClassFlexible } from "../private/helpers"
import { getInstitutionHeader, cleanStudentName } from "../../../lib/rapor-utils"

export const listAcademicPeriods = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    return await ctx.db.query("academicPeriods").order("desc").collect()
  },
})

export const getActivePeriod = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) {
      return {
        _id: "default" as const,
        year: "2026/2027",
        semester: 1 as const,
        reportDate: "Pangkalpinang, 09 Oktober 2026",
        isActive: true,
      }
    }
    const active = await ctx.db
      .query("academicPeriods")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .first()

    if (active) return active

    return {
      _id: "default" as const,
      year: "2026/2027",
      semester: 1 as const,
      reportDate: "Pangkalpinang, 09 Oktober 2026",
      isActive: true,
    }
  },
})

export const listLearningObjectives = query({
  args: {
    subjectCode: v.string(),
    gradeLevel: v.string(),
    semester: v.union(v.literal(1), v.literal(2)),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []
    return await ctx.db
      .query("learningObjectives")
      .withIndex("by_subject_and_grade", (q) =>
        q
          .eq("subjectCode", args.subjectCode)
          .eq("gradeLevel", args.gradeLevel)
          .eq("semester", args.semester)
      )
      .collect()
  },
})

export const getSubjectGradesForClass = query({
  args: {
    subjectCode: v.string(),
    className: v.string(),
    academicYear: v.string(),
    semester: v.union(v.literal(1), v.literal(2)),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    // Ambil santri di kelas ini dari tabel students (mendukung pencocokan fleksibel)
    const studentsInClass = await findStudentsByClassFlexible(ctx, args.className)

    // Ambil nilai rapor yang sudah tersimpan
    const existingGrades = await ctx.db
      .query("reportGrades")
      .withIndex("by_subject_and_class", (q) =>
        q
          .eq("subjectCode", args.subjectCode)
          .eq("className", args.className)
          .eq("academicYear", args.academicYear)
          .eq("semester", args.semester)
      )
      .collect()

    const gradeMap = new Map(existingGrades.map((g) => [g.santriId, g]))

    // Gabungkan santri dengan nilai yang ada
    return studentsInClass.map((s, index) => {
      const g = gradeMap.get(s.santriId)
      return {
        no: index + 1,
        santriId: s.santriId,
        nisn: s.nisn ?? s.nis ?? "-",
        studentName: cleanStudentName(s.nama),
        className: s.kelas,
        institution: s.jenjang,
        dailyScore: g?.dailyScore ?? 0,
        midtermScore: g?.midtermScore ?? 0,
        finalExamScore: g?.finalExamScore ?? 0,
        finalScore: g?.finalScore ?? 0,
        predicate: g?.predicate ?? "D",
        competencyNarrative: g?.competencyNarrative ?? "",
        gradeId: g?._id,
        sourcePtsSessionId: g?.sourcePtsSessionId,
        sourcePasSessionId: g?.sourcePasSessionId,
      }
    })
  },
})

export const getClassLeger = query({
  args: {
    className: v.string(),
    academicYear: v.string(),
    semester: v.union(v.literal(1), v.literal(2)),
  },
  handler: async (ctx, args) => {
    await ctx.auth.getUserIdentity()

    const students = await findStudentsByClassFlexible(ctx, args.className)

    const allGrades = await ctx.db
      .query("reportGrades")
      .withIndex("by_class", (q) =>
        q
          .eq("className", args.className)
          .eq("academicYear", args.academicYear)
          .eq("semester", args.semester)
      )
      .collect()

    const allSubjects = await ctx.db.query("subjects").collect()
    const officialOrder = [
      "PAI", "PP", "BINDO", "MTK", "IPA", "IPS", "BING", "PJOK", "INFOR", "PRA",
      "AQIDAH", "ADAB", "FIQIH", "BARAB", "B_ARAB", "NAHWU", "SHIROH"
    ]
    const rawActive = allSubjects.filter(
      (s) => s.isActive !== false && officialOrder.includes(s.code.toUpperCase())
    )
    const activeSubjects = [...rawActive].sort((a, b) => {
      const idxA = officialOrder.indexOf(a.code.toUpperCase())
      const idxB = officialOrder.indexOf(b.code.toUpperCase())
      return idxA - idxB
    })

    // Petakan nilai per santri
    const studentGradesMap = new Map<string, Map<string, number>>()
    for (const g of allGrades) {
      if (!studentGradesMap.has(g.santriId)) {
        studentGradesMap.set(g.santriId, new Map())
      }
      studentGradesMap.get(g.santriId)!.set(g.subjectCode, g.finalScore)
    }

    // Ambil asesmen wali kelas
    const assessments = await ctx.db
      .query("homeroomAssessments")
      .withIndex("by_class", (q) =>
        q
          .eq("className", args.className)
          .eq("academicYear", args.academicYear)
          .eq("semester", args.semester)
      )
      .collect()

    const assessmentMap = new Map(assessments.map((a) => [a.santriId, a]))

    // Hitung total dan rerata tiap santri
    const rows = students.map((s, idx) => {
      const grades = studentGradesMap.get(s.santriId) ?? new Map<string, number>()
      const subjectScores: Record<string, number> = {}

      let totalScore = 0
      let count = 0

      for (const subj of activeSubjects) {
        const score = grades.get(subj.code) ?? 0
        subjectScores[subj.code] = score
        if (score > 0) {
          totalScore += score
          count++
        }
      }

      const averageScore = count > 0 ? Math.round((totalScore / count) * 100) / 100 : 0
      const homeroom = assessmentMap.get(s.santriId)

      return {
        no: idx + 1,
        santriId: s.santriId,
        nisn: s.nisn ?? s.nis ?? "-",
        studentName: cleanStudentName(s.nama),
        className: s.kelas,
        institution: s.jenjang,
        subjectScores,
        totalScore,
        averageScore,
        rank: 1, // dihitung ulang di bawah
        homeroom: {
          sickDays: homeroom?.sickDays ?? 0,
          permissionDays: homeroom?.permissionDays ?? 0,
          absentDays: homeroom?.absentDays ?? 0,
          haditsAchievement: homeroom?.haditsAchievement ?? "-",
          promotionDecision: homeroom?.promotionDecision ?? "-",
        },
      }
    })

    // Hitung peringkat berdasarkan rerata nilai
    const sortedByAverage = [...rows].sort((a, b) => b.averageScore - a.averageScore)
    let currentRank = 1
    for (let i = 0; i < sortedByAverage.length; i++) {
      if (i > 0 && sortedByAverage[i].averageScore < sortedByAverage[i - 1].averageScore) {
        currentRank = i + 1
      }
      const match = rows.find((r) => r.santriId === sortedByAverage[i].santriId)
      if (match) match.rank = currentRank
    }

    return {
      subjects: activeSubjects.map((s) => ({ code: s.code, name: s.name })),
      students: rows,
    }
  },
})

export const getStudentReportCard = query({
  args: {
    santriId: v.string(),
    academicYear: v.string(),
    semester: v.union(v.literal(1), v.literal(2)),
  },
  handler: async (ctx, args) => {
    await ctx.auth.getUserIdentity()
    const student = await ctx.db
      .query("students")
      .withIndex("by_santri_id", (q) => q.eq("santriId", args.santriId))
      .first()

    if (!student) {
      throw new Error(`Data santri dengan ID ${args.santriId} tidak ditemukan.`)
    }

    const grades = await ctx.db
      .query("reportGrades")
      .withIndex("by_santri", (q) =>
        q
          .eq("santriId", args.santriId)
          .eq("academicYear", args.academicYear)
          .eq("semester", args.semester)
      )
      .collect()

    const homeroom = await ctx.db
      .query("homeroomAssessments")
      .withIndex("by_santri", (q) =>
        q
          .eq("santriId", args.santriId)
          .eq("academicYear", args.academicYear)
          .eq("semester", args.semester)
      )
      .first()

    const allSubjects = await ctx.db.query("subjects").collect()
    const subjectMap = new Map(allSubjects.map((s) => [s.code, s.name]))

    const header = getInstitutionHeader(student.jenjang)

    const classSetting = await ctx.db
      .query("classSettings")
      .withIndex("by_class_and_period", (q) =>
        q
          .eq("className", student.kelas)
          .eq("academicYear", args.academicYear)
          .eq("semester", args.semester)
      )
      .first()

    return {
      student: {
        santriId: student.santriId,
        nama: cleanStudentName(student.nama),
        nisn: student.nisn ?? student.nis ?? "-",
        nis: student.nis ?? "-",
        kelas: student.kelas,
        jenjang: student.jenjang,
        jenisKelamin: student.jenisKelamin,
      },
      header,
      grades: grades.map((g) => ({
        subjectCode: g.subjectCode,
        subjectName: subjectMap.get(g.subjectCode) ?? g.subjectCode,
        dailyScore: g.dailyScore,
        midtermScore: g.midtermScore,
        finalExamScore: g.finalExamScore,
        finalScore: g.finalScore,
        predicate: g.predicate,
        competencyNarrative: g.competencyNarrative,
      })),
      homeroom: homeroom ?? {
        sickDays: 0,
        permissionDays: 0,
        absentDays: 0,
        extracurriculars: [],
        p5Dimensions: [],
        haditsTarget: "3 Hadits Arba'in",
        haditsAchievement: "-",
        tahfidzNotes: "-",
        homeroomNotes: "-",
        promotionDecision: "-",
      },
      classSetting: {
        className: student.kelas,
        academicYear: args.academicYear,
        semester: args.semester,
        homeroomTeacherName: classSetting?.homeroomTeacherName || "Muhammad Yasser, S.Pd.",
        homeroomTeacherNiy: classSetting?.homeroomTeacherNiy || "199512310120191027",
        reportDate: classSetting?.reportDate || "Pangkalpinang, 19 Desember 2025",
        principalName: classSetting?.principalName || "Meditoma, S.Pd.",
        principalNiy: classSetting?.principalNiy || "199405220720181024",
      },
    }
  },
})

export const getClassReportCards = query({
  args: {
    className: v.string(),
    academicYear: v.string(),
    semester: v.union(v.literal(1), v.literal(2)),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    const students = await findStudentsByClassFlexible(ctx, args.className)
    if (students.length === 0) return []

    const allSubjects = await ctx.db.query("subjects").collect()
    const subjectMap = new Map(allSubjects.map((s) => [s.code, s.name]))

    const classSetting = await ctx.db
      .query("classSettings")
      .withIndex("by_class_and_period", (q) =>
        q
          .eq("className", args.className)
          .eq("academicYear", args.academicYear)
          .eq("semester", args.semester)
      )
      .first()

    const resolvedClassSetting = {
      className: args.className,
      academicYear: args.academicYear,
      semester: args.semester,
      homeroomTeacherName: classSetting?.homeroomTeacherName || "Muhammad Yasser, S.Pd.",
      homeroomTeacherNiy: classSetting?.homeroomTeacherNiy || "199512310120191027",
      reportDate: classSetting?.reportDate || "Pangkalpinang, 19 Desember 2025",
      principalName: classSetting?.principalName || "Meditoma, S.Pd.",
      principalNiy: classSetting?.principalNiy || "199405220720181024",
    }

    const results = []

    for (const student of students) {
      const grades = await ctx.db
        .query("reportGrades")
        .withIndex("by_santri", (q) =>
          q
            .eq("santriId", student.santriId)
            .eq("academicYear", args.academicYear)
            .eq("semester", args.semester)
        )
        .collect()

      const homeroom = await ctx.db
        .query("homeroomAssessments")
        .withIndex("by_santri", (q) =>
          q
            .eq("santriId", student.santriId)
            .eq("academicYear", args.academicYear)
            .eq("semester", args.semester)
        )
        .first()

      const header = getInstitutionHeader(student.jenjang)

      results.push({
        student: {
          santriId: student.santriId,
          nama: cleanStudentName(student.nama),
          nisn: student.nisn ?? student.nis ?? "-",
          nis: student.nis ?? "-",
          kelas: student.kelas,
          jenjang: student.jenjang,
          jenisKelamin: student.jenisKelamin,
        },
        header,
        grades: grades.map((g) => ({
          subjectCode: g.subjectCode,
          subjectName: subjectMap.get(g.subjectCode) ?? g.subjectCode,
          dailyScore: g.dailyScore,
          midtermScore: g.midtermScore,
          finalExamScore: g.finalExamScore,
          finalScore: g.finalScore,
          predicate: g.predicate,
          competencyNarrative: g.competencyNarrative,
        })),
        homeroom: homeroom ?? {
          sickDays: 0,
          permissionDays: 0,
          absentDays: 0,
          extracurriculars: [],
          p5Dimensions: [],
          haditsTarget: "3 Hadits Arba'in",
          haditsAchievement: "-",
          tahfidzNotes: "-",
          homeroomNotes: "-",
          promotionDecision: "-",
        },
        classSetting: resolvedClassSetting,
      })
    }

    return results
  },
})

export const getClassSettings = query({
  args: {
    className: v.string(),
    academicYear: v.string(),
    semester: v.union(v.literal(1), v.literal(2)),
  },
  handler: async (ctx, args) => {
    await ctx.auth.getUserIdentity()

    const setting = await ctx.db
      .query("classSettings")
      .withIndex("by_class_and_period", (q) =>
        q
          .eq("className", args.className)
          .eq("academicYear", args.academicYear)
          .eq("semester", args.semester)
      )
      .first()

    return setting ?? {
      className: args.className,
      academicYear: args.academicYear,
      semester: args.semester,
      homeroomTeacherName: "Muhammad Yasser, S.Pd.",
      homeroomTeacherNiy: "199512310120191027",
      reportDate: "Pangkalpinang, 19 Desember 2025",
      principalName: "Meditoma, S.Pd.",
      principalNiy: "199405220720181024",
    }
  },
})

export const getAllClassSettings = query({
  args: {
    academicYear: v.string(),
    semester: v.union(v.literal(1), v.literal(2)),
  },
  handler: async (ctx, args) => {
    await ctx.auth.getUserIdentity()

    return await ctx.db
      .query("classSettings")
      .withIndex("by_period", (q) =>
        q.eq("academicYear", args.academicYear).eq("semester", args.semester)
      )
      .collect()
  },
})

export const getHomeroomAssessment = query({
  args: {
    santriId: v.string(),
    academicYear: v.string(),
    semester: v.union(v.literal(1), v.literal(2)),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return null
    return await ctx.db
      .query("homeroomAssessments")
      .withIndex("by_santri", (q) =>
        q
          .eq("santriId", args.santriId)
          .eq("academicYear", args.academicYear)
          .eq("semester", args.semester)
      )
      .first()
  },
})

export const listAvailableExamSessionsForPull = query({
  args: {
    subjectCode: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    // Cari bank soal yang cocok dengan subjectCode
    const banks = await ctx.db
      .query("questionBanks")
      .withIndex("by_subject", (q) => q.eq("subjectCode", args.subjectCode))
      .collect()

    const bankIds = new Set(banks.map((b) => b._id))

    // Ambil sesi ujian yang menggunakan bank tersebut
    const sessions = await ctx.db.query("examSessions").collect()
    return sessions
      .filter((s) => bankIds.has(s.bankId))
      .map((s) => ({
        sessionId: s._id,
        title: s.title,
        status: s.status,
        startTime: s.startTime,
        endTime: s.endTime,
      }))
  },
})
