import { describe, it } from "node:test"
import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import {
  DEFAULT_TEACHERS,
  filterTeachers,
  normalizeClassName,
  getTeacherForClass,
  type Teacher,
} from "../lib/teachers.ts"

describe("Daftar Guru dan Dropdown Wali Kelas Rapor", () => {
  it("DEFAULT_TEACHERS memuat guru SMP, SMA, dan MTA yang valid", () => {
    assert.ok(DEFAULT_TEACHERS.length > 0, "Daftar guru tidak boleh kosong")

    // Pastikan tidak ada musyrif
    for (const t of DEFAULT_TEACHERS) {
      assert.notEqual(t.role, "musyrif", `Musyrif tidak boleh ada: ${t.name}`)
      assert.ok(
        !t.position?.toLowerCase().includes("musyrif"),
        `Posisi musyrif tidak boleh ada: ${t.name}`
      )
    }

    // Pastikan memuat guru kunci
    const names = DEFAULT_TEACHERS.map((t) => t.name)
    assert.ok(names.includes("Muhammad Yasser, S.Pd."), "Harus memuat Muhammad Yasser, S.Pd.")
    assert.ok(names.includes("Randhy Raviza, S.Pd."), "Harus memuat Randhy Raviza, S.Pd.")
    assert.ok(names.includes("Meditoma, S.Pd."), "Harus memuat Meditoma, S.Pd.")
  })

  it("filterTeachers menyaring musyrif dan guru tahfizh murni namun mempertahankan guru kelas merangkap tahfizh", () => {
    const rawStaff = [
      // Musyrif murni -> HARUS DIKELUARKAN
      {
        id: "1",
        name: "Ahmad Ibnu Abbas",
        institution: "SMPITA, SMAITA, MTA",
        role: "musyrif",
        position: "Musyrif",
        status: "aktif",
      },
      // Guru Tahfizh murni -> HARUS DIKELUARKAN
      {
        id: "2",
        name: "Alim Aswari",
        institution: "MTA",
        role: "guru_tahfidz",
        position: "Guru Tahfizh",
        status: "aktif",
      },
      // Musyrif dengan jabatan tahfizh -> HARUS DIKELUARKAN
      {
        id: "3",
        name: "Bagas Adly Nugraha",
        institution: "PONDOK, SMAITA, SMPITA",
        role: "musyrif",
        position: "Guru Tahfizh",
        status: "aktif",
      },
      // Guru kelas merangkap tahfizh (Wali Kelas + Halaqah) -> HARUS DIMASUKKAN
      {
        id: "4",
        name: "Harziki, A.Md.T.",
        institution: "MTA",
        role: "wali_kelas",
        position: "Wali Kelas",
        assignedHalaqahName: "MT HQ 002",
        status: "aktif",
      },
      // Guru kelas merangkap tahfizh -> HARUS DIMASUKKAN
      {
        id: "5",
        name: "Muhammad Naufal Hudiya",
        institution: "MTA",
        role: "wali_kelas",
        position: "Wali Kelas",
        assignedHalaqahName: "MT HQ 001",
        status: "aktif",
      },
      // Guru mapel SMP -> HARUS DIMASUKKAN
      {
        id: "6",
        name: "Yogi Satriadi, S.Pd.I.",
        institution: "SMPITA",
        role: "guru",
        position: "Guru Mupel SMP",
        status: "aktif",
      },
      // Staff TU -> HARUS DIKELUARKAN
      {
        id: "7",
        name: "Andry Afriyanto, S.E.",
        institution: "SMPITA",
        role: "tu",
        position: "TU",
        status: "aktif",
      },
      // SDITA (bukan SMP/SMA/MTA) -> HARUS DIKELUARKAN
      {
        id: "8",
        name: "Guru SD",
        institution: "SDITA",
        role: "guru",
        position: "Guru",
        status: "aktif",
      },
    ]

    const result = filterTeachers(rawStaff)
    const resultNames = result.map((r) => r.name)

    // Cek hasil
    assert.ok(!resultNames.includes("Ahmad Ibnu Abbas"), "Musyrif tidak boleh masuk")
    assert.ok(!resultNames.includes("Alim Aswari"), "Guru tahfizh murni tidak boleh masuk")
    assert.ok(!resultNames.includes("Bagas Adly Nugraha"), "Musyrif tidak boleh masuk")
    assert.ok(!resultNames.includes("Andry Afriyanto, S.E."), "TU tidak boleh masuk")
    assert.ok(!resultNames.includes("Guru SD"), "SDITA tidak boleh masuk")

    assert.ok(resultNames.includes("Harziki, A.Md.T."), "Guru kelas merangkap tahfizh harus masuk")
    assert.ok(resultNames.includes("Muhammad Naufal Hudiya"), "Guru kelas merangkap tahfizh harus masuk")
    assert.ok(resultNames.includes("Yogi Satriadi, S.Pd.I."), "Guru mapel harus masuk")
  })

  it("ClassSettingsModal mengimplementasikan dropdown pilihan guru dan toggle input manual", () => {
    const basePath = process.cwd().endsWith("apps") ? process.cwd() : path.join(process.cwd(), "apps")
    const modalPath = path.join(basePath, "components/rapor/ClassSettingsModal.tsx")
    const content = fs.readFileSync(modalPath, "utf-8")

    assert.ok(content.includes("DEFAULT_TEACHERS"), "Harus mengimpor DEFAULT_TEACHERS")
    assert.ok(content.includes("handleTeacherSelect"), "Harus memiliki fungsi handleTeacherSelect")
    assert.ok(content.includes("isManualInput"), "Harus memiliki state isManualInput")
    assert.ok(content.includes("Pilih dari Daftar"), "Harus memiliki tombol kembali ke daftar")
    assert.ok(content.includes("Input Manual"), "Harus memiliki opsi input manual")
    assert.ok(content.includes("https://icentresmart.my.id/kelola-kelas"), "Harus memiliki tautan ke kelola-kelas SiPAKSa")
    assert.ok(content.includes("getTeacherForClass"), "Harus menggunakan getTeacherForClass untuk auto-fill")
  })

  it("normalizeClassName dan getTeacherForClass mengenali rombel dan memetakan wali kelas otomatis", () => {
    assert.equal(normalizeClassName("VII A"), "7A")
    assert.equal(normalizeClassName("VIII D"), "8D")
    assert.equal(normalizeClassName("IX B"), "9B")
    assert.equal(normalizeClassName("X A"), "10A")
    assert.equal(normalizeClassName("XI B"), "11B")
    assert.equal(normalizeClassName("XII A"), "12A")

    // Kelas 8D otomatis mendapatkan Nurrahma Firmania, S.Pd.I
    const teacher8D = getTeacherForClass("8D")
    assert.ok(teacher8D, "Guru kelas 8D harus terdeteksi")
    assert.ok(teacher8D.name.includes("Nurrahma"), "Wali kelas 8D harus Nurrahma")

    // Kelas 7A otomatis mendapatkan Riko beserta NIY
    const teacher7A = getTeacherForClass("7A")
    assert.ok(teacher7A, "Guru kelas 7A harus terdeteksi")
    assert.equal(teacher7A.name, "Riko")
    assert.equal(teacher7A.niy, "200109290320231159")

    // Kelas 7B otomatis mendapatkan Randhy Raviza beserta NIY
    const teacher7B = getTeacherForClass("7B")
    assert.ok(teacher7B, "Guru kelas 7B harus terdeteksi")
    assert.ok(teacher7B.name.includes("Randhy"))
    assert.equal(teacher7B.niy, "199507180720181019")

    // Kelas 9A otomatis mendapatkan Muhammad Yasser beserta NIY
    const teacher9A = getTeacherForClass("9A")
    assert.ok(teacher9A, "Guru kelas 9A harus terdeteksi")
    assert.ok(teacher9A.name.includes("Yasser"))
    assert.equal(teacher9A.niy, "199512310120191027")
  })

  it("Bebas dari emoji dan kebocoran kode spesifikasi teknis", () => {
    const basePath = process.cwd().endsWith("apps") ? process.cwd() : path.join(process.cwd(), "apps")
    const filesToCheck = [
      path.join(basePath, "lib/teachers.ts"),
      path.join(basePath, "components/rapor/ClassSettingsModal.tsx"),
    ]

    const emojiRegex = /[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u
    const specLeakRegex = /\b(SCR-\w+|[A-Z]+-FR-\d+|[A-Z]+-AC-\d+|TASK-\d+)\b/

    for (const f of filesToCheck) {
      const content = fs.readFileSync(f, "utf-8")
      assert.ok(!emojiRegex.test(content), `Ditemukan emoji terlarang pada ${f}`)
      assert.ok(!specLeakRegex.test(content), `Ditemukan kebocoran spesifikasi teknis pada ${f}`)
    }
  })
})
