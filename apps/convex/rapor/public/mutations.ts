import { v } from "convex/values"
import { mutation } from "../../_generated/server"
import { requireAuthenticatedUser } from "../private/helpers"
import { calculateNAR, getGradePredicate, generateCompetencyNarrative } from "../../../lib/rapor-utils"

export const saveAcademicPeriod = mutation({
  args: {
    year: v.string(),
    semester: v.union(v.literal(1), v.literal(2)),
    reportDate: v.string(),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    const now = Date.now()

    // Bila diaktifkan, nonaktifkan periode lain
    if (args.isActive) {
      const activePeriods = await ctx.db
        .query("academicPeriods")
        .withIndex("by_active", (q) => q.eq("isActive", true))
        .collect()

      for (const p of activePeriods) {
        await ctx.db.patch(p._id, { isActive: false, updatedAt: now })
      }
    }

    const existing = await ctx.db
      .query("academicPeriods")
      .withIndex("by_year_semester", (q) =>
        q.eq("year", args.year).eq("semester", args.semester)
      )
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        reportDate: args.reportDate,
        isActive: args.isActive,
        updatedAt: now,
      })
      return existing._id
    }

    return await ctx.db.insert("academicPeriods", {
      year: args.year,
      semester: args.semester,
      reportDate: args.reportDate,
      isActive: args.isActive,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const saveLearningObjective = mutation({
  args: {
    id: v.optional(v.id("learningObjectives")),
    subjectCode: v.string(),
    gradeLevel: v.string(),
    semester: v.union(v.literal(1), v.literal(2)),
    code: v.string(),
    description: v.string(),
    curriculumType: v.union(v.literal("umum"), v.literal("diniyah")),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    const now = Date.now()

    if (args.id) {
      await ctx.db.patch(args.id, {
        code: args.code.trim().toUpperCase(),
        description: args.description.trim(),
        curriculumType: args.curriculumType,
        updatedAt: now,
      })
      return args.id
    }

    return await ctx.db.insert("learningObjectives", {
      subjectCode: args.subjectCode,
      gradeLevel: args.gradeLevel,
      semester: args.semester,
      code: args.code.trim().toUpperCase(),
      description: args.description.trim(),
      curriculumType: args.curriculumType,
      authorTokenIdentifier: user.tokenIdentifier,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const deleteLearningObjective = mutation({
  args: {
    id: v.id("learningObjectives"),
  },
  handler: async (ctx, args) => {
    await requireAuthenticatedUser(ctx)
    await ctx.db.delete(args.id)
    return { success: true }
  },
})

export const saveSubjectGrades = mutation({
  args: {
    subjectCode: v.string(),
    className: v.string(),
    academicYear: v.string(),
    semester: v.union(v.literal(1), v.literal(2)),
    grades: v.array(
      v.object({
        santriId: v.string(),
        nisn: v.string(),
        studentName: v.string(),
        institution: v.optional(v.string()),
        dailyScore: v.number(),
        midtermScore: v.number(),
        finalExamScore: v.number(),
        finalScore: v.optional(v.number()),
        predicate: v.optional(v.string()),
        competencyNarrative: v.optional(v.string()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    const now = Date.now()

    let savedCount = 0

    for (const g of args.grades) {
      const dailyScore = typeof g.dailyScore === "number" && !isNaN(g.dailyScore) ? g.dailyScore : 0
      const midtermScore = typeof g.midtermScore === "number" && !isNaN(g.midtermScore) ? g.midtermScore : 0
      const finalExamScore = typeof g.finalExamScore === "number" && !isNaN(g.finalExamScore) ? g.finalExamScore : 0
      const finalScore = calculateNAR(dailyScore, midtermScore, finalExamScore)
      const predicate = getGradePredicate(finalScore)
      const competencyNarrative = g.competencyNarrative ?? ""

      const instRaw = (g.institution || "").toUpperCase()
      const institution: "SMPITA" | "SMAITA" | "MTA" =
        instRaw === "SMAITA" || instRaw.includes("SMA")
          ? "SMAITA"
          : instRaw === "MTA" || instRaw.includes("MANZHUMAH")
            ? "MTA"
            : "SMPITA"

      const existing = await ctx.db
        .query("reportGrades")
        .withIndex("by_subject_and_class", (q) =>
          q
            .eq("subjectCode", args.subjectCode)
            .eq("className", args.className)
            .eq("academicYear", args.academicYear)
            .eq("semester", args.semester)
        )
        .filter((q) => q.eq(q.field("santriId"), g.santriId))
        .first()

      if (existing) {
        await ctx.db.patch(existing._id, {
          dailyScore,
          midtermScore,
          finalExamScore,
          finalScore,
          predicate,
          competencyNarrative,
          updatedBy: user.name,
          updatedAt: now,
        })
      } else {
        await ctx.db.insert("reportGrades", {
          academicYear: args.academicYear,
          semester: args.semester,
          subjectCode: args.subjectCode,
          santriId: g.santriId,
          nisn: g.nisn || "-",
          studentName: g.studentName,
          className: args.className,
          institution,
          dailyScore,
          midtermScore,
          finalExamScore,
          finalScore,
          predicate,
          competencyNarrative,
          updatedBy: user.name,
          createdAt: now,
          updatedAt: now,
        })
      }
      savedCount++
    }

    return { success: true, count: savedCount }
  },
})

export const pullGradesFromExamSession = mutation({
  args: {
    subjectCode: v.string(),
    className: v.string(),
    academicYear: v.string(),
    semester: v.union(v.literal(1), v.literal(2)),
    sessionId: v.id("examSessions"),
    targetColumn: v.union(v.literal("midterm"), v.literal("finalExam")),
    cpDescription: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    const now = Date.now()

    // Ambil peserta ujian dari sesi CBT
    const participants = await ctx.db
      .query("examParticipants")
      .withIndex("by_session", (q) => q.eq("sessionId", args.sessionId))
      .collect()

    if (participants.length === 0) {
      throw new Error("Sesi ujian yang dipilih tidak memiliki peserta terdaftar.")
    }

    // Ambil santri di kelas target
    const studentsInClass = await ctx.db
      .query("students")
      .withIndex("by_kelas", (q) => q.eq("kelas", args.className))
      .collect()

    const participantMap = new Map<string, number>()
    for (const p of participants) {
      const score = p.totalScore ?? p.multipleChoiceScore ?? 0
      participantMap.set(p.nisn.trim(), score)
      participantMap.set(p.studentName.trim().toLowerCase(), score)
    }

    let matchedCount = 0

    for (const s of studentsInClass) {
      const nisnKey = (s.nisn ?? s.nis ?? "").trim()
      const nameKey = s.nama.trim().toLowerCase()

      const pulledScore = participantMap.get(nisnKey) ?? participantMap.get(nameKey)
      if (pulledScore === undefined) continue

      matchedCount++

      const existing = await ctx.db
        .query("reportGrades")
        .withIndex("by_subject_and_class", (q) =>
          q
            .eq("subjectCode", args.subjectCode)
            .eq("className", args.className)
            .eq("academicYear", args.academicYear)
            .eq("semester", args.semester)
        )
        .filter((q) => q.eq(q.field("santriId"), s.santriId))
        .first()

      const dailyScore = existing?.dailyScore ?? 0
      const midtermScore =
        args.targetColumn === "midterm" ? pulledScore : (existing?.midtermScore ?? 0)
      const finalExamScore =
        args.targetColumn === "finalExam" ? pulledScore : (existing?.finalExamScore ?? 0)

      const finalScore = calculateNAR(dailyScore, midtermScore, finalExamScore)
      const predicate = getGradePredicate(finalScore)
      const narrative = args.cpDescription
        ? generateCompetencyNarrative(finalScore, args.cpDescription)
        : (existing?.competencyNarrative ?? "")

      if (existing) {
        await ctx.db.patch(existing._id, {
          midtermScore,
          finalExamScore,
          finalScore,
          predicate,
          competencyNarrative: narrative,
          sourcePtsSessionId:
            args.targetColumn === "midterm" ? args.sessionId : existing.sourcePtsSessionId,
          sourcePasSessionId:
            args.targetColumn === "finalExam" ? args.sessionId : existing.sourcePasSessionId,
          updatedBy: user.name,
          updatedAt: now,
        })
      } else {
        await ctx.db.insert("reportGrades", {
          academicYear: args.academicYear,
          semester: args.semester,
          subjectCode: args.subjectCode,
          santriId: s.santriId,
          nisn: s.nisn ?? s.nis ?? "-",
          studentName: s.nama,
          className: args.className,
          institution: s.jenjang,
          dailyScore,
          midtermScore,
          finalExamScore,
          finalScore,
          predicate,
          competencyNarrative: narrative,
          sourcePtsSessionId: args.targetColumn === "midterm" ? args.sessionId : undefined,
          sourcePasSessionId: args.targetColumn === "finalExam" ? args.sessionId : undefined,
          updatedBy: user.name,
          createdAt: now,
          updatedAt: now,
        })
      }
    }

    return {
      success: true,
      matchedCount,
      totalStudentsInClass: studentsInClass.length,
    }
  },
})

export const saveHomeroomAssessment = mutation({
  args: {
    academicYear: v.string(),
    semester: v.union(v.literal(1), v.literal(2)),
    santriId: v.string(),
    nisn: v.string(),
    studentName: v.string(),
    className: v.string(),
    institution: v.optional(v.string()),
    sickDays: v.number(),
    permissionDays: v.number(),
    absentDays: v.number(),
    extracurriculars: v.optional(
      v.array(
        v.object({
          name: v.string(),
          score: v.string(),
          description: v.string(),
        })
      )
    ),
    p5Dimensions: v.optional(
      v.array(
        v.object({
          dimension: v.string(),
          predicate: v.string(),
          description: v.string(),
        })
      )
    ),
    haditsTarget: v.optional(v.string()),
    haditsAchievement: v.optional(v.string()),
    tahfidzNotes: v.optional(v.string()),
    homeroomNotes: v.optional(v.string()),
    promotionDecision: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    const now = Date.now()

    const existing = await ctx.db
      .query("homeroomAssessments")
      .withIndex("by_santri", (q) =>
        q
          .eq("santriId", args.santriId)
          .eq("academicYear", args.academicYear)
          .eq("semester", args.semester)
      )
      .first()

    const instRaw = (args.institution || "").toUpperCase()
    const institution: "SMPITA" | "SMAITA" | "MTA" =
      instRaw === "SMAITA" || instRaw.includes("SMA")
        ? "SMAITA"
        : instRaw === "MTA" || instRaw.includes("MANZHUMAH")
          ? "MTA"
          : "SMPITA"

    if (existing) {
      await ctx.db.patch(existing._id, {
        institution,
        sickDays: args.sickDays,
        permissionDays: args.permissionDays,
        absentDays: args.absentDays,
        extracurriculars: args.extracurriculars,
        p5Dimensions: args.p5Dimensions,
        haditsTarget: args.haditsTarget,
        haditsAchievement: args.haditsAchievement,
        tahfidzNotes: args.tahfidzNotes,
        homeroomNotes: args.homeroomNotes,
        promotionDecision: args.promotionDecision,
        updatedBy: user.name,
        updatedAt: now,
      })
      return existing._id
    }

    return await ctx.db.insert("homeroomAssessments", {
      academicYear: args.academicYear,
      semester: args.semester,
      santriId: args.santriId,
      nisn: args.nisn,
      studentName: args.studentName,
      className: args.className,
      institution,
      sickDays: args.sickDays,
      permissionDays: args.permissionDays,
      absentDays: args.absentDays,
      extracurriculars: args.extracurriculars,
      p5Dimensions: args.p5Dimensions,
      haditsTarget: args.haditsTarget,
      haditsAchievement: args.haditsAchievement,
      tahfidzNotes: args.tahfidzNotes,
      homeroomNotes: args.homeroomNotes,
      promotionDecision: args.promotionDecision,
      updatedBy: user.name,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const saveClassSetting = mutation({
  args: {
    className: v.string(),
    academicYear: v.string(),
    semester: v.union(v.literal(1), v.literal(2)),
    homeroomTeacherName: v.string(),
    homeroomTeacherNiy: v.string(),
    reportDate: v.string(),
    principalName: v.optional(v.string()),
    principalNiy: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    const now = Date.now()

    const existing = await ctx.db
      .query("classSettings")
      .withIndex("by_class_and_period", (q) =>
        q
          .eq("className", args.className)
          .eq("academicYear", args.academicYear)
          .eq("semester", args.semester)
      )
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, {
        homeroomTeacherName: args.homeroomTeacherName.trim(),
        homeroomTeacherNiy: args.homeroomTeacherNiy.trim(),
        reportDate: args.reportDate.trim(),
        principalName: args.principalName?.trim(),
        principalNiy: args.principalNiy?.trim(),
        updatedBy: user.name,
        updatedAt: now,
      })
      return existing._id
    }

    return await ctx.db.insert("classSettings", {
      className: args.className,
      academicYear: args.academicYear,
      semester: args.semester,
      homeroomTeacherName: args.homeroomTeacherName.trim(),
      homeroomTeacherNiy: args.homeroomTeacherNiy.trim(),
      reportDate: args.reportDate.trim(),
      principalName: args.principalName?.trim(),
      principalNiy: args.principalNiy?.trim(),
      updatedBy: user.name,
      createdAt: now,
      updatedAt: now,
    })
  },
})

export const batchApplyDateAndPrincipal = mutation({
  args: {
    academicYear: v.string(),
    semester: v.union(v.literal(1), v.literal(2)),
    reportDate: v.string(),
    principalName: v.optional(v.string()),
    principalNiy: v.optional(v.string()),
    classNames: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireAuthenticatedUser(ctx)
    const now = Date.now()

    let count = 0
    for (const className of args.classNames) {
      const existing = await ctx.db
        .query("classSettings")
        .withIndex("by_class_and_period", (q) =>
          q
            .eq("className", className)
            .eq("academicYear", args.academicYear)
            .eq("semester", args.semester)
        )
        .first()

      if (existing) {
        await ctx.db.patch(existing._id, {
          reportDate: args.reportDate.trim(),
          ...(args.principalName !== undefined ? { principalName: args.principalName.trim() } : {}),
          ...(args.principalNiy !== undefined ? { principalNiy: args.principalNiy.trim() } : {}),
          updatedBy: user.name,
          updatedAt: now,
        })
      } else {
        await ctx.db.insert("classSettings", {
          className,
          academicYear: args.academicYear,
          semester: args.semester,
          homeroomTeacherName: "Muhammad Yasser, S.Pd.",
          homeroomTeacherNiy: "199512310120191027",
          reportDate: args.reportDate.trim(),
          principalName: args.principalName?.trim() || "Meditoma, S.Pd.",
          principalNiy: args.principalNiy?.trim() || "199405220720181024",
          updatedBy: user.name,
          createdAt: now,
          updatedAt: now,
        })
      }
      count++
    }

    return { updatedCount: count }
  },
})
