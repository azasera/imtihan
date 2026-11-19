import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const APPS_ROOT = path.resolve(__dirname, "..")

describe("Modul Terpusat Manajemen Kelompok & Anggota Ekstrakurikuler", () => {
  it("memverifikasi menu navigasi Ekstrakurikuler terdaftar di AppSidebar", () => {
    const sidebarSource = fs.readFileSync(
      path.join(APPS_ROOT, "components/app-sidebar.tsx"),
      "utf8"
    )

    assert.match(sidebarSource, /title:\s*"Ekstrakurikuler"/)
    assert.match(sidebarSource, /url:\s*"\/ekstrakurikuler"/)
    assert.match(sidebarSource, /<TrophyIcon\s*\/>/)
  })

  it("memverifikasi skema Convex memiliki tabel extracurricularGroups dan extracurricularEnrollments", () => {
    const schemaSource = fs.readFileSync(
      path.join(APPS_ROOT, "convex/schema.ts"),
      "utf8"
    )

    assert.match(schemaSource, /extracurricularGroups:\s*defineTable/)
    assert.match(schemaSource, /extracurricularEnrollments:\s*defineTable/)
    assert.match(schemaSource, /\.index\("by_group_and_status",\s*\["groupId",\s*"status"\]\)/)
    assert.match(schemaSource, /\.index\("by_santri_and_period",\s*\["santriId",\s*"academicYear",\s*"semester"\]\)/)
    assert.match(schemaSource, /\.index\("by_santri_and_group",\s*\["santriId",\s*"groupCode",\s*"academicYear",\s*"semester"\]\)/)
  })

  it("memverifikasi kueri Convex untuk modul ekstrakurikuler terdefinisi lengkap", () => {
    const queriesSource = fs.readFileSync(
      path.join(APPS_ROOT, "convex/extracurricular/public/queries.ts"),
      "utf8"
    )

    assert.match(queriesSource, /export const getGroups/)
    assert.match(queriesSource, /export const getGroupDetails/)
    assert.match(queriesSource, /export const getGroupMembers/)
    assert.match(queriesSource, /export const getAvailableStudentsForGroup/)
    assert.match(queriesSource, /export const getAllActiveGroupsForTransfer/)
  })

  it("memverifikasi mutasi Convex untuk modul ekstrakurikuler terdefinisi lengkap", () => {
    const mutationsSource = fs.readFileSync(
      path.join(APPS_ROOT, "convex/extracurricular/public/mutations.ts"),
      "utf8"
    )

    assert.match(mutationsSource, /export const seedDefaultGroupsAndRoster/)
    assert.match(mutationsSource, /export const addMemberToGroup/)
    assert.match(mutationsSource, /export const removeMemberFromGroup/)
    assert.match(mutationsSource, /export const transferMemberGroup/)
    assert.match(mutationsSource, /export const updateMemberAssessment/)
    assert.match(mutationsSource, /export const updateGroupCoach/)
  })

  it("memverifikasi fungsi helper sinkronisasi ke homeroomAssessments", () => {
    const helperSource = fs.readFileSync(
      path.join(APPS_ROOT, "convex/extracurricular/private/helpers.ts"),
      "utf8"
    )

    assert.match(helperSource, /export async function syncSantriExtracurricularsToHomeroom/)
    assert.match(helperSource, /homeroomAssessments/)
    assert.match(helperSource, /extracurriculars/)
  })

  it("memverifikasi halaman UI ekstrakurikuler mengintegrasikan dialog mutasi dan tambah peserta", () => {
    const pageSource = fs.readFileSync(
      path.join(APPS_ROOT, "app/(main)/ekstrakurikuler/page.tsx"),
      "utf8"
    )

    assert.match(pageSource, /EditCoachModal/)
    assert.match(pageSource, /AddMemberModal/)
    assert.match(pageSource, /TransferMemberModal/)
    assert.match(pageSource, /api\.extracurricular\.public\.queries\.getGroups/)
    assert.match(pageSource, /api\.extracurricular\.public\.queries\.getGroupMembers/)
    assert.match(pageSource, /handleScoreChange/)
    assert.match(pageSource, /handleRemoveMember/)
    assert.match(pageSource, /handleSeedInitialRoster/)
  })

  it("memverifikasi komponen dialog transfer ekskul memiliki validasi keamanan", () => {
    const transferSource = fs.readFileSync(
      path.join(APPS_ROOT, "components/ekstrakurikuler/TransferMemberModal.tsx"),
      "utf8"
    )

    assert.match(transferSource, /api\.extracurricular\.public\.mutations\.transferMemberGroup/)
    assert.match(transferSource, /Pindah Kelompok Ekstrakurikuler/)
  })

  it("memverifikasi perlindungan ekskul wajib Rohis pada mutasi hapus dan pindah", () => {
    const mutationsSource = fs.readFileSync(
      path.join(APPS_ROOT, "convex/extracurricular/public/mutations.ts"),
      "utf8"
    )

    assert.match(mutationsSource, /Ekskul Rohis adalah ekskul wajib dan tidak dapat dihapus/)
    assert.match(mutationsSource, /Ekskul Rohis adalah ekskul wajib dan tidak dapat dipindahkan/)
  })
})
