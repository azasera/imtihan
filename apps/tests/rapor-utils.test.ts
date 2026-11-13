import { describe, it } from "node:test"
import assert from "node:assert/strict"

const {
  getInstitutionHeader,
  getInstitutionLogos,
  calculateNAR,
  getGradePredicate,
  generateCompetencyNarrative,
  isDiniyahSubject,
  isUmumSubject,
  OFFICIAL_SUBJECTS,
  getDefaultCpForSubject,
} = (await import(
  new URL("../lib/rapor-utils.ts", import.meta.url).href
)) as typeof import("../lib/rapor-utils")

describe("Utilitas E-Rapor At-Tauhid", () => {
  it("memetakan logo resmi SiPAKSa (kiri: Ponpes ICT, kanan: Lembaga masing-masing)", () => {
    const smpitaLogos = getInstitutionLogos("SMPITA")
    assert.equal(smpitaLogos.leftLogo, "/logo/ikon-ict.png")
    assert.equal(smpitaLogos.rightLogo, "/logo/logo-smpita.png")

    const smaitaLogos = getInstitutionLogos("SMAITA")
    assert.equal(smaitaLogos.leftLogo, "/logo/ikon-ict.png")
    assert.equal(smaitaLogos.rightLogo, "/logo/logo-smaita.png")

    const mtaLogos = getInstitutionLogos("MTA")
    assert.equal(mtaLogos.leftLogo, "/logo/ikon-ict.png")
    assert.equal(mtaLogos.rightLogo, "/logo/logo-mta.png")

    const fallbackLogos = getInstitutionLogos("UNKNOWN")
    assert.equal(fallbackLogos.leftLogo, "/logo/ikon-ict.png")
    assert.equal(fallbackLogos.rightLogo, "/logo/logo-smpita.png")
  })

  it("mengambil KOP resmi SiPAKSa sesuai lembaga santri", () => {
    const smpita = getInstitutionHeader("SMPITA")
    assert.equal(smpita.foundation, "YAYASAN AT-TAUHID AL ISLAMY BANGKA BELITUNG")
    assert.equal(smpita.institutionName, "SMP ISLAM TAHFIDZ AL-QUR'AN AT-TAUHID")
    assert.equal(smpita.npsn, "69988220")
    assert.equal(smpita.city, "KOTA PANGKALPINANG")

    const smaita = getInstitutionHeader("SMAITA")
    assert.equal(smaita.institutionName, "SMA ISLAM TAHFIDZ AL-QUR'AN AT-TAUHID")

    const mta = getInstitutionHeader("MTA")
    assert.equal(mta.institutionName, "MANZHUMAH TAKHOSHUSH AL-QUR'AN AT-TAUHID")

    // fallback aman untuk input tak dikenal
    const fallback = getInstitutionHeader("UNKNOWN")
    assert.equal(fallback.foundation, "YAYASAN AT-TAUHID AL ISLAMY BANGKA BELITUNG")
    assert.equal(fallback.institutionName, "PONDOK PESANTREN AT-TAUHID")
  })

  it("menghitung Nilai Akhir Rapor (NAR) dengan formula standar", () => {
    // NAR = (2 * PH + STS + SAS) / 4
    // PH = 80, STS = 70, SAS = 90 -> (160 + 70 + 90) / 4 = 320 / 4 = 80
    assert.equal(calculateNAR(80, 70, 90), 80)

    // Pembulatan 2 desimal
    // PH = 75, STS = 77, SAS = 82 -> (150 + 77 + 82) / 4 = 309 / 4 = 77.25
    assert.equal(calculateNAR(75, 77, 82), 77.25)

    // Kasus nol
    assert.equal(calculateNAR(0, 0, 0), 0)
  })

  it("menentukan predikat nilai rapor secara akurat sesuai ambang batas", () => {
    assert.equal(getGradePredicate(100), "A")
    assert.equal(getGradePredicate(89.5), "A")
    assert.equal(getGradePredicate(89.4), "B")
    assert.equal(getGradePredicate(79.5), "B")
    assert.equal(getGradePredicate(79.4), "C")
    assert.equal(getGradePredicate(69.5), "C")
    assert.equal(getGradePredicate(69.4), "D")
    assert.equal(getGradePredicate(0), "D")
  })

  it("merumuskan deskripsi narasi Capaian Pembelajaran otomatis", () => {
    const cp = "memahami ketentuan sholat berjamaah dan tata cara bersuci"

    assert.equal(
      generateCompetencyNarrative(90, cp),
      "Sangat baik dalam memahami ketentuan sholat berjamaah dan tata cara bersuci"
    )
    assert.equal(
      generateCompetencyNarrative(85.5, cp),
      "Sangat baik dalam memahami ketentuan sholat berjamaah dan tata cara bersuci"
    )
    assert.equal(
      generateCompetencyNarrative(85.4, cp),
      "Baik dalam memahami ketentuan sholat berjamaah dan tata cara bersuci"
    )
    assert.equal(
      generateCompetencyNarrative(74.5, cp),
      "Baik dalam memahami ketentuan sholat berjamaah dan tata cara bersuci"
    )
    assert.equal(
      generateCompetencyNarrative(74.4, cp),
      "Cukup dalam memahami ketentuan sholat berjamaah dan tata cara bersuci"
    )
    assert.equal(
      generateCompetencyNarrative(64.5, cp),
      "Cukup dalam memahami ketentuan sholat berjamaah dan tata cara bersuci"
    )
    assert.equal(
      generateCompetencyNarrative(64.4, cp),
      "Perlu ditingkatkan dalam memahami ketentuan sholat berjamaah dan tata cara bersuci"
    )

    // input kosong
    assert.equal(generateCompetencyNarrative(80, "   "), "-")
  })

  it("mengenali mata pelajaran kategori diniyah dan umum secara presisi", () => {
    assert.equal(isDiniyahSubject("FIQIH"), true)
    assert.equal(isDiniyahSubject("AQIDAH"), true)
    assert.equal(isDiniyahSubject("ADAB"), true)
    assert.equal(isDiniyahSubject("BARAB"), true)
    assert.equal(isDiniyahSubject("B_ARAB"), true)
    assert.equal(isDiniyahSubject("NAHWU"), true)
    assert.equal(isDiniyahSubject("SHIROH"), true)

    assert.equal(isDiniyahSubject("MTK"), false)
    assert.equal(isDiniyahSubject("IPA"), false)
    assert.equal(isDiniyahSubject("BINDO"), false)
    assert.equal(isDiniyahSubject("PJOK"), false)

    assert.equal(isUmumSubject("PAI"), true)
    assert.equal(isUmumSubject("PP"), true)
    assert.equal(isUmumSubject("BINDO"), true)
    assert.equal(isUmumSubject("MTK"), true)
    assert.equal(isUmumSubject("IPA"), true)
    assert.equal(isUmumSubject("IPS"), true)
    assert.equal(isUmumSubject("BING"), true)
    assert.equal(isUmumSubject("PJOK"), true)
    assert.equal(isUmumSubject("INFOR"), true)
    assert.equal(isUmumSubject("PRA"), true)

    assert.equal(isUmumSubject("FIQIH"), false)
    assert.equal(isUmumSubject("AQIDAH"), false)
  })

  it("memuat 16 mata pelajaran resmi sesuai file excel rapor (10 umum, 6 diniyah)", () => {
    assert.equal(OFFICIAL_SUBJECTS.length, 16)
    const umum = OFFICIAL_SUBJECTS.filter((s) => s.category === "umum")
    const diniyah = OFFICIAL_SUBJECTS.filter((s) => s.category === "diniyah")

    assert.equal(umum.length, 10)
    assert.equal(diniyah.length, 6)

    // Seluruh mapel diniyah memiliki KKM 70
    for (const d of diniyah) {
      assert.equal(d.passingScore, 70)
    }

    // Default CP tersedia
    const pjokCp = getDefaultCpForSubject("PJOK")
    assert.match(pjokCp, /bola basket dan bola volley/)

    const paiCp = getDefaultCpForSubject("PAI")
    assert.match(paiCp, /Al-Qur'an/)
  })
})
