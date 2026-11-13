import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const APPS_ROOT = path.resolve(__dirname, "..")

const {
  formatCountdown,
  formatNotEnteredCount,
  formatTimeOfDay,
  isOvertime,
  remainingTimeMs,
  sortForMonitoring,
  summarizeParticipants,
  violationTier,
} = await import(new URL("../lib/exam-monitoring.ts", import.meta.url).href)

const MINUTE = 60_000

function participant(overrides = {}) {
  return {
    _id: "p1",
    studentName: "Ahmad Zayyan",
    nisn: "24.02.001",
    className: "7A",
    status: "in_progress",
    startedAt: 1_000_000,
    ...overrides,
  }
}

describe("Monitoring peserta (CHG-001)", () => {
  it("menggabungkan hitungan masuk, mengerjakan, selesai, dan pelanggaran", () => {
    const rows = [
      participant(),
      participant({ _id: "p2", status: "submitted", finishedAt: 1_100_000, tabViolations: 2 }),
      participant({ _id: "p3", status: "submitted", finishedAt: 1_200_000, tabViolations: 4 }),
      participant({ _id: "p4", tabViolations: 0 }),
    ]

    assert.deepEqual(summarizeParticipants(rows), {
      entered: 4,
      inProgress: 2,
      submitted: 2,
      violationsTotal: 6,
      flaggedCount: 2,
    })
  })

  it("aman untuk daftar kosong dan nilai pelanggaran yang belum tercatat", () => {
    assert.deepEqual(summarizeParticipants([]), {
      entered: 0,
      inProgress: 0,
      submitted: 0,
      violationsTotal: 0,
      flaggedCount: 0,
    })

    const summary = summarizeParticipants([participant({ tabViolations: undefined })])
    assert.equal(summary.violationsTotal, 0)
    assert.equal(summary.flaggedCount, 0)
  })

  it("sisa waktu dihitung dari waktu masuk ditambah durasi sesi", () => {
    const started = 500_000

    assert.equal(remainingTimeMs(participant({ startedAt: started }), 60, started + 10 * MINUTE), 50 * MINUTE)
    assert.equal(remainingTimeMs(participant({ startedAt: started }), 10, started + 10 * MINUTE), 0)
    assert.equal(remainingTimeMs(participant({ startedAt: started }), 5, started + 30 * MINUTE), 0)
  })

  it("sisa waktu null untuk peserta selesai atau data waktu tidak valid", () => {
    assert.equal(remainingTimeMs(participant({ status: "submitted" }), 60, Date.now()), null)
    assert.equal(remainingTimeMs(participant({ startedAt: Number.NaN }), 60, Date.now()), null)
    assert.equal(remainingTimeMs(participant(), Number.NaN, Date.now()), null)
    assert.equal(formatCountdown(null), "-")
  })

  it("menandai peserta yang melewati batas waktu tetapi belum mengumpulkan", () => {
    const started = 500_000

    assert.equal(isOvertime(participant({ startedAt: started }), 60, started + 59 * MINUTE), false)
    assert.equal(isOvertime(participant({ startedAt: started }), 60, started + 60 * MINUTE), true)
    assert.equal(isOvertime(participant({ startedAt: started, status: "submitted" }), 1, started + 90 * MINUTE), false)
  })

  it("menaruh peserta mengerjakan paling atas dengan sisa waktu paling mepet", () => {
    const rows = [
      participant({ _id: "done-new", status: "submitted", startedAt: 300, finishedAt: 900 }),
      participant({ _id: "work-late", startedAt: 200 }),
      participant({ _id: "done-old", status: "submitted", startedAt: 100, finishedAt: 500 }),
      participant({ _id: "work-early", startedAt: 100 }),
    ]

    assert.deepEqual(
      sortForMonitoring(rows).map((p: { _id: string }) => p._id),
      ["work-early", "work-late", "done-new", "done-old"]
    )
    assert.deepEqual(rows.map((p) => p._id), ["done-new", "work-late", "done-old", "work-early"])
  })

  it("jenjang badge pelanggaran tidak menonjolkan nol", () => {
    assert.equal(violationTier(undefined), "none")
    assert.equal(violationTier(0), "none")
    assert.equal(violationTier(1), "watch")
    assert.equal(violationTier(2), "watch")
    assert.equal(violationTier(3), "alert")
    assert.equal(violationTier(99), "alert")
  })

  it("format hitung mundur stabil untuk timer monospace", () => {
    assert.equal(formatCountdown(0), "00:00")
    assert.equal(formatCountdown(-5_000), "00:00")
    assert.equal(formatCountdown(90_000), "01:30")
    assert.equal(formatCountdown(59 * MINUTE + 59_000), "59:59")
    assert.equal(formatCountdown(3_600_000 + MINUTE), "1:01:00")
  })

  it("jumlah belum masuk tidak dikarang tanpa daftar kelas", () => {
    assert.equal(formatNotEnteredCount(null, 3), "Belum terhitung")
    assert.equal(formatNotEnteredCount(2, 5), "Belum terhitung")
    assert.equal(formatNotEnteredCount(34, 4), "30 santri")
    assert.equal(formatNotEnteredCount(4, 4), "0 santri")
  })

  it("waktu tanpa data tampil tanda hubung", () => {
    assert.equal(formatTimeOfDay(undefined), "-")
    assert.equal(formatTimeOfDay(Number.NaN), "-")
  })
})

describe("Penjaga layar monitoring", () => {
  const pagePath = path.join(APPS_ROOT, "app", "(main)", "monitoring-sesi", "page.tsx")
  const page = fs.readFileSync(pagePath, "utf-8")

  it("hanya memakai query sesi yang sudah dikunci per pengajar", () => {
    assert.ok(
      page.includes("api.examSession.public.queries.listExamSessions"),
      "harus memakai daftar sesi milik pengajar yang login"
    )
    assert.ok(
      page.includes("api.examSession.public.queries.listSessionParticipants"),
      "harus memakai daftar peserta yang menolak sesi milik pengajar lain"
    )

    const mutationCalls = [...page.matchAll(/api\.[\w.]+\.mutations\.\w+/g)].map((match) => match[0])
    assert.deepEqual(
      [...new Set(mutationCalls)].sort(),
      [
        "api.examSession.public.mutations.removeSessionParticipant",
        "api.examSession.public.mutations.unlockParticipant",
      ].sort(),
      "perubahan data dari layar monitoring mencakup buka kunci dan keluarkan peserta"
    )
  })

  it("tidak mengirim identitas pengajar sebagai argumen dari browser", () => {
    assert.ok(!/tokenIdentifier|creatorTokenIdentifier|userId:/.test(page))
  })

  it("menampilkan status pengerjaan dalam bahasa santri, bukan kode spesifikasi", () => {
    assert.ok(page.includes("Sedang Mengerjakan"))
    assert.ok(page.includes("Selesai"))
    assert.ok(page.includes("Terkunci"))
    assert.ok(!/SESI-|TASK-|CHG-|Fase\s+\d+/.test(page))
  })

  it("menampilkan status koreksi dan keadaan kosong yang netral", () => {
    assert.ok(page.includes(">Koreksi<"), "kolom status koreksi harus ada pada tabel peserta")
    assert.ok(page.includes("gradingStatus"), "badge koreksi dibaca dari status penilaian peserta")
    assert.ok(page.includes("Belum ada santri yang masuk ke sesi ini."))
    assert.ok(
      !page.includes("Jadwalkan sesi ujian terlebih dahulu"),
      "cukup satu ajakan aksi saat pengajar belum punya sesi"
    )
  })

  it("angka jam baru dirender setelah jam klien siap agar tidak bentrok saat hidrasi", () => {
    assert.ok(
      page.includes("React.useState<number | null>(null)"),
      "jam klien harus mulai dari null supaya tampilan awal server dan browser sama"
    )
    assert.ok(!/useState\(\(\) => Date\.now\(\)\)/.test(page))
    assert.ok(!page.includes("formatTimeOfDay(p."), "waktu peserta harus dirender lewat penjaga jam klien")
  })

  it("menyediakan bilah toolbar terpadu dengan pencarian, filter kelas, dan tab status", () => {
    assert.ok(page.includes("Cari nama santri, NISN, atau kelas..."), "harus ada input pencarian")
    assert.ok(page.includes("Semua Kelas"), "harus ada pilihan filter kelas")
    assert.ok(page.includes("statusFilter"), "harus ada kontrol filter status santri")
    assert.ok(page.includes("Semua ("), "harus ada tab semua santri")
    assert.ok(page.includes("Sedang Ujian ("), "harus ada tab sedang ujian")
    assert.ok(page.includes("Selesai ("), "harus ada tab selesai")
    assert.ok(page.includes("Reset Semua Filter"), "harus ada tombol reset saat filter kosong")
  })

  it("menambah satu entri menu tanpa menghapus rute yang sudah berjalan", () => {
    const sidebar = fs.readFileSync(path.join(APPS_ROOT, "components", "app-sidebar.tsx"), "utf-8")

    for (const url of ["/", "/bank-soal", "/sesi-ujian", "/rekap-nilai", "/santri", "/ujian", "/monitoring-sesi"]) {
      assert.ok(sidebar.includes(`url: "${url}"`), `entri menu ${url} harus tetap ada`)
    }
  })
})
