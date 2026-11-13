import { describe, it } from "node:test"
import assert from "node:assert/strict"

const {
  matchExcelToStudents,
  filterMatchedResults,
} = (await import(
  new URL("../lib/excel-grade-import.ts", import.meta.url).href
)) as typeof import("../lib/excel-grade-import")

describe("Utilitas Import Nilai Excel Rapor", () => {
  const mockStudents = [
    {
      santriId: "s1",
      nisn: "0012345678",
      name: "Abdullah bin Fulan",
      institution: "SMPITA" as const,
    },
    {
      santriId: "s2",
      nisn: "0012345679",
      name: "Muhammad Al-Fatih",
      institution: "SMPITA" as const,
    },
    {
      santriId: "s3",
      nisn: "", // santri tanpa NISN (seperti beberapa kasus di kelas VII B)
      name: "Oldy Nurdiansyah",
      institution: "SMPITA" as const,
    },
    {
      santriId: "s4",
      nisn: "0012345680",
      name: "Zaid bin Haritsah",
      institution: "SMPITA" as const,
    },
  ]

  it("mencocokkan santri berdasarkan NISN secara akurat", () => {
    const parsedRows = [
      { nisn: "0012345678", name: "Abdullah B Fulan", rawValue: 88 },
      { nisn: "0012345679", name: "M. Al-Fatih", rawValue: 95 },
    ]

    const results = matchExcelToStudents(parsedRows, mockStudents)

    const s1 = results.find((r) => r.santriId === "s1")
    assert.ok(s1)
    assert.equal(s1.status, "matched_nisn")
    assert.equal(s1.value, 88)
    assert.equal(s1.excelName, "Abdullah B Fulan")

    const s2 = results.find((r) => r.santriId === "s2")
    assert.ok(s2)
    assert.equal(s2.status, "matched_nisn")
    assert.equal(s2.value, 95)
  })

  it("melakukan fallback ke nama jika NISN kosong atau tidak cocok", () => {
    const parsedRows = [
      { nisn: "", name: "oldy   nurdiansyah", rawValue: 84 },
    ]

    const results = matchExcelToStudents(parsedRows, mockStudents)

    const s3 = results.find((r) => r.santriId === "s3")
    assert.ok(s3)
    assert.equal(s3.status, "matched_name")
    assert.equal(s3.value, 84)
  })

  it("menandai santri dengan status 'no_value' jika ada di Excel tetapi nilainya kosong atau NaN", () => {
    const parsedRows = [
      { nisn: "0012345678", name: "Abdullah bin Fulan", rawValue: NaN },
    ]

    const results = matchExcelToStudents(parsedRows, mockStudents)

    const s1 = results.find((r) => r.santriId === "s1")
    assert.ok(s1)
    assert.equal(s1.status, "no_value")
    assert.equal(s1.value, null)
  })

  it("menandai santri dengan status 'unmatched' jika tidak ada di baris Excel", () => {
    const parsedRows = [
      { nisn: "9999999999", name: "Santri Tidak Dikenal", rawValue: 90 },
    ]

    const results = matchExcelToStudents(parsedRows, mockStudents)

    const s4 = results.find((r) => r.santriId === "s4")
    assert.ok(s4)
    assert.equal(s4.status, "unmatched")
    assert.equal(s4.value, null)
  })

  it("filterMatchedResults hanya menyaring santri yang berhasil cocok dan bernilai valid", () => {
    const parsedRows = [
      { nisn: "0012345678", name: "Abdullah bin Fulan", rawValue: 92 },
      { nisn: "0012345679", name: "Muhammad Al-Fatih", rawValue: NaN },
      { nisn: "", name: "Oldy Nurdiansyah", rawValue: 85 },
    ]

    const results = matchExcelToStudents(parsedRows, mockStudents)
    const filtered = filterMatchedResults(results)

    assert.equal(filtered.length, 2)
    assert.ok(filtered.some((f) => f.santriId === "s1" && f.value === 92))
    assert.ok(filtered.some((f) => f.santriId === "s3" && f.value === 85))
    assert.ok(!filtered.some((f) => f.santriId === "s2"))
    assert.ok(!filtered.some((f) => f.santriId === "s4"))
  })
})
