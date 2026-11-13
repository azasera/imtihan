import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const APPS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function read(relative: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relative), "utf-8")
}

describe("Penghapusan aman paket bank soal yang tidak terpakai", () => {
  it("deleteQuestionBank di backend memvalidasi keterkaitan dengan examSessions", () => {
    const mutationsSource = read("convex/bank/public/mutations.ts")

    assert.ok(
      mutationsSource.includes('export const deleteQuestionBank = mutation({'),
      "deleteQuestionBank harus diekspor sebagai Convex mutation"
    )

    // Memeriksa relasi examSessions dengan index by_bank
    assert.match(
      mutationsSource,
      /query\("examSessions"\)\s*\.withIndex\("by_bank",\s*\(idx\)\s*=>\s*idx\.eq\("bankId",\s*args\.bankId\)\)/,
      "deleteQuestionBank harus memeriksa tabel examSessions menggunakan index by_bank"
    )

    // Menolak jika dipakai sesi aktif atau memiliki riwayat sesi
    assert.ok(
      mutationsSource.includes("Paket bank soal tidak dapat dihapus karena sedang dipakai pada sesi"),
      "deleteQuestionBank harus menolak paket yang dipakai sesi aktif"
    )
    assert.ok(
      mutationsSource.includes("Paket bank soal tidak dapat dihapus karena sudah dipakai pada sesi"),
      "deleteQuestionBank harus menolak paket yang memiliki riwayat sesi ujian"
    )

    // Memastikan penghapusan butir dan bank hanya dilakukan jika bersih
    assert.match(
      mutationsSource,
      /for\s*\(const\s+q\s+of\s+questions\)\s*\{\s*await\s+ctx\.db\.delete\("questions",\s*q\._id\)\s*\}/,
      "deleteQuestionBank harus menghapus seluruh butir pertanyaan berelasi"
    )
    assert.match(
      mutationsSource,
      /await\s+ctx\.db\.delete\("questionBanks",\s*args\.bankId\)/,
      "deleteQuestionBank harus menghapus dokumen paket bank soal"
    )
  })

  it("listQuestionBanks memperkaya paket dengan sessionCount dan activeSessionTitle", () => {
    const queriesSource = read("convex/bank/public/queries.ts")

    assert.ok(
      queriesSource.includes("sessionCount: sessions.length"),
      "listQuestionBanks harus menyertakan sessionCount"
    )
    assert.ok(
      queriesSource.includes("activeSessionTitle: active?.title ?? null"),
      "listQuestionBanks harus menyertakan activeSessionTitle"
    )
  })

  it("antarmuka bank-soal/page.tsx menampilkan status pemakaian dan menonaktifkan tombol hapus paket terpakai", () => {
    const pageSource = read("app/(main)/bank-soal/page.tsx")

    // Menampilkan status pemakaian
    assert.ok(
      pageSource.includes("Status Pemakaian:"),
      "Halaman bank soal harus menampilkan baris Status Pemakaian"
    )
    assert.ok(
      pageSource.includes("Belum dipakai"),
      "Halaman bank soal harus menampilkan status Belum dipakai"
    )
    assert.ok(
      pageSource.includes("Dipakai ("),
      "Halaman bank soal harus menampilkan status Dipakai (X sesi)"
    )

    // Menonaktifkan tombol hapus jika sessionCount > 0
    assert.match(
      pageSource,
      /disabled=\{Boolean\(bank\.sessionCount\s*&&\s*bank\.sessionCount\s*>\s*0\)\}/,
      "Tombol hapus harus disabled jika bank.sessionCount > 0"
    )

    // Validasi pencegahan di sisi handler sebelum confirm
    assert.match(
      pageSource,
      /if\s*\(sessionCount\s*>\s*0\)\s*\{[\s\S]*toast\.error/,
      "handleDeleteBank harus memblokir penghapusan jika sessionCount > 0"
    )
  })
})
