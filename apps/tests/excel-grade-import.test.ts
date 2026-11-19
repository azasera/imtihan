import { describe, it } from "node:test"
import assert from "node:assert/strict"

const {
  matchExcelToStudents,
  filterMatchedResults,
  detectColumns,
  tryParseScore,
  normalizeNisn,
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
      nisn: "0143182548", // NISN dengan awalan angka nol sesuai contoh pengguna
      name: "Abdur Razzaq Khawarizmi Khatami",
      institution: "SMPITA" as const,
    },
    {
      santriId: "s3",
      nisn: "", // santri tanpa NISN
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
      { nisn: "0143182548", name: "Abdur Razzaq", rawValue: 95 },
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
      { nisn: "0143182548", name: "Abdur Razzaq", rawValue: NaN },
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

  it("mendeteksi kolom template 3-in-1 sesuai contoh gambar (No, NISN, Nama Santri, PH, STS, SAS)", () => {
    const headerRow = [["No", "NISN", "Nama Santri", "PH", "STS", "SAS"]]
    const detected = detectColumns(headerRow)

    assert.equal(detected.nisnCol, 1)
    assert.equal(detected.nameCol, 2)
    assert.equal(detected.phCol, 3)
    assert.equal(detected.stsCol, 4)
    assert.equal(detected.sasCol, 5)
    assert.equal(detected.isMultiColumn, true)
  })

  it("mencocokkan dan membaca 3 nilai sekaligus (PH, STS, SAS) dalam 1 baris", () => {
    const parsedRows = [
      {
        nisn: "0012345678",
        name: "Abdullah bin Fulan",
        ph: 85,
        sts: 88,
        sas: 92,
      },
      {
        nisn: "0143182548",
        name: "Abdur Razzaq Khawarizmi Khatami",
        ph: 90,
        sts: 95,
        sas: 94,
      },
    ]

    const results = matchExcelToStudents(parsedRows, mockStudents)

    const s1 = results.find((r) => r.santriId === "s1")
    assert.ok(s1)
    assert.equal(s1.status, "matched_nisn")
    assert.equal(s1.ph, 85)
    assert.equal(s1.sts, 88)
    assert.equal(s1.sas, 92)

    const s2 = results.find((r) => r.santriId === "s2")
    assert.ok(s2)
    assert.equal(s2.status, "matched_nisn")
    assert.equal(s2.ph, 90)
    assert.equal(s2.sts, 95)
    assert.equal(s2.sas, 94)
  })

  it("mendukung pengisian nilai secara parsial (misal hanya PH dan STS, SAS kosong)", () => {
    const parsedRows = [
      {
        nisn: "0012345678",
        name: "Abdullah bin Fulan",
        ph: 80,
        sts: 85,
        sas: null,
      },
    ]

    const results = matchExcelToStudents(parsedRows, mockStudents)
    const s1 = results.find((r) => r.santriId === "s1")
    assert.ok(s1)
    assert.equal(s1.status, "matched_nisn")
    assert.equal(s1.ph, 80)
    assert.equal(s1.sts, 85)
    assert.equal(s1.sas, null)

    const filtered = filterMatchedResults(results)
    assert.equal(filtered.length, 1)
  })

  it("menjaga keutuhan NISN dengan awalan angka nol (0143182548)", () => {
    assert.equal(normalizeNisn("0143182548"), "0143182548")
    assert.equal(normalizeNisn(" 0143182548 "), "0143182548")
  })

  it("tryParseScore mem-parsing angka, string dengan koma, dan mengabaikan nilai tidak valid", () => {
    assert.equal(tryParseScore(88), 88)
    assert.equal(tryParseScore("88.5"), 88.5)
    assert.equal(tryParseScore("88,5"), 88.5)
    assert.equal(isNaN(tryParseScore("")), true)
    assert.equal(isNaN(tryParseScore("-")), true)
    assert.equal(isNaN(tryParseScore("—")), true)
    assert.equal(isNaN(tryParseScore("abc")), true)
    assert.equal(isNaN(tryParseScore(-5)), true)
    assert.equal(isNaN(tryParseScore(105)), true)
  })
})
