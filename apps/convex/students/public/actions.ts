import { action } from "../../_generated/server"
import { internal } from "../../_generated/api"
import { requireAuthenticatedUser } from "../../model/auth"
import { officialNisn } from "../../model/nisn"
import { cleanStudentName } from "../../model/nisn"

// Sumber data dikunci di sisi server: pemanggil tidak boleh menentukan URL
// karena action ini menulis ke seluruh tabel master santri.
const SIPAKSA_ENDPOINT = "https://sipaksa.azaseradigital.workers.dev/api/setoran?status=aktif&limit=3000"

export interface SyncResult {
  success: boolean
  totalFetched: number
  totalFiltered: number
  totalInserted: number
  totalUpdated: number
  totalPruned: number
  byJenjang: {
    SMPITA: number
    SMAITA: number
    MTA: number
  }
}

export const syncStudentsFromSipaksa = action({
  args: {},
  handler: async (ctx): Promise<SyncResult> => {
    await requireAuthenticatedUser(ctx)

    const res = await fetch(SIPAKSA_ENDPOINT)
    if (!res.ok) {
      throw new Error(`Gagal mengambil data dari SiPAKSa: HTTP ${res.status}`)
    }

    const json = (await res.json()) as {
      ok: boolean
      data?: Array<{
        santriId?: string
        id?: string
        id_santri?: string
        nama?: string
        nis?: string | null
        nisn?: string | null
        jenisKelamin?: string
        kelas?: string
        jenjang?: string
        status?: string
        dormitory?: string
        guruHalaqah?: string | null
        namaHalaqah?: string | null
        totalHafalan?: number
        targetJuz?: number | null
      }>
    }

    if (!json.ok || !Array.isArray(json.data)) {
      throw new Error("Format respons SiPAKSa tidak sesuai")
    }

    // Filter KETAT: hanya SMPITA, SMAITA, dan MTA (SD/TK disaring keluar)
    const ALLOWED_JENJANG = new Set(["SMPITA", "SMAITA", "MTA"])
    const filtered = json.data.filter((item) => {
      const jenjang = item.jenjang?.toUpperCase() || ""
      return ALLOWED_JENJANG.has(jenjang) && item.nama && (item.santriId || item.id_santri || item.id)
    })

    const payload = filtered.map((s) => ({
      santriId: (s.santriId || s.id_santri || s.id) as string,
      sipaksaId: (s.id || s.santriId || "") as string,
      nama: cleanStudentName(s.nama || ""),
      nis: s.nis ? String(s.nis).trim() : undefined,
      nisn: officialNisn(String(s.nisn ?? "")),
      jenjang: s.jenjang as "SMPITA" | "SMAITA" | "MTA",
      kelas: s.kelas || "-",
      jenisKelamin: s.jenisKelamin || "L",
      status: s.status || "Aktif",
      dormitory: s.dormitory || undefined,
      guruHalaqah: s.guruHalaqah || undefined,
      namaHalaqah: s.namaHalaqah || undefined,
      totalHafalan: typeof s.totalHafalan === "number" ? s.totalHafalan : undefined,
      targetJuz: typeof s.targetJuz === "number" ? s.targetJuz : undefined,
    }))

    const syncTimestamp = Date.now()
    // Batch proses per 100 santri untuk efisiensi transaksi Convex
    const BATCH_SIZE = 100
    let totalInserted = 0
    let totalUpdated = 0

    for (let i = 0; i < payload.length; i += BATCH_SIZE) {
      const chunk = payload.slice(i, i + BATCH_SIZE)
      const result = await ctx.runMutation(internal.students.private.mutations.upsertStudentsBatch, {
        students: chunk,
        syncTimestamp,
      })
      totalInserted += result.inserted
      totalUpdated += result.updated
    }

    // Pangkas data santri lama/stale yang sudah tidak ada di SiPAKSa aktif
    const activeSantriIds = payload.map((s) => s.santriId)
    const pruneResult = (await ctx.runMutation(
      internal.students.private.mutations.pruneStaleStudents,
      {
        currentSyncTimestamp: syncTimestamp,
        activeSantriIds,
      }
    )) as { pruned: number }

    const byJenjang = {
      SMPITA: payload.filter((s) => s.jenjang === "SMPITA").length,
      SMAITA: payload.filter((s) => s.jenjang === "SMAITA").length,
      MTA: payload.filter((s) => s.jenjang === "MTA").length,
    }

    return {
      success: true,
      totalFetched: json.data.length,
      totalFiltered: payload.length,
      totalInserted,
      totalUpdated,
      totalPruned: pruneResult.pruned,
      byJenjang,
    }
  },
})
