"use client"

import * as React from "react"
import { RaporLetterhead } from "./RaporLetterhead"
import {
  isDiniyahSubject,
  isUmumSubject,
  cleanStudentName,
  getInstitutionHeader,
  getDefaultCpForSubject,
  generateCompetencyNarrative,
  type Institution,
} from "@/lib/rapor-utils"

export interface ReportCardGradeItem {
  subjectCode: string
  subjectName: string
  dailyScore: number
  midtermScore: number
  finalExamScore: number
  finalScore: number
  predicate: string
  competencyNarrative: string
}

export interface ReportCardPrintViewProps {
  type: "umum" | "diniyah"
  period?: "STS" | "SAS"
  student: {
    santriId: string
    nama: string
    nisn: string
    nis?: string
    kelas: string
    jenjang: Institution | string
  }
  academicYear: string
  semester: number
  reportDate?: string
  homeroomTeacherName?: string
  homeroomTeacherNiy?: string
  principalName?: string
  principalNiy?: string
  grades: ReportCardGradeItem[]
  homeroom?: {
    sickDays: number
    permissionDays: number
    absentDays: number
    extracurriculars?: Array<{ name: string; score: string; description?: string }>
    p5Dimensions?: Array<{ dimension: string; predicate: string; description: string }>
    haditsTarget?: string
    haditsAchievement?: string
    tahfidzNotes?: string
    homeroomNotes?: string
    promotionDecision?: string
    parentResponse?: string
  }
  showKop?: boolean
}

/**
 * Komponen Lembar Cetak Rapor Resmi Pesantren Islamic Centre At-Tauhid
 * Mengadopsi persis tata letak visual 4 berkas rujukan PDF resmi:
 * 1. Rapor KURMER PTS (1 Halaman A4)
 * 2. Rapor KURMER PAS (2 Halaman A4)
 * 3. Rapor DINIYAH PTS (1 Halaman A4)
 * 4. Rapor DINIYAH PAS (1 Halaman A4)
 *
 * Seluruh styling menggunakan palet warna hex standar (#000000, #E0E0E0, #ffffff)
 * untuk mencegah galat unsupported color function lab/oklch pada canvas/peramban.
 */
export function ReportCardPrintView({
  type,
  period = "SAS",
  student,
  academicYear,
  semester,
  reportDate = "Pangkalpinang, 19 Desember 2025",
  homeroomTeacherName = "Muhammad Yasser, S.Pd.",
  homeroomTeacherNiy = "199512310120191027",
  principalName = "Meditoma, S.Pd.",
  principalNiy = "199405220720181024",
  grades,
  homeroom,
  showKop = true,
}: ReportCardPrintViewProps) {
  const instHeader = getInstitutionHeader(student.jenjang)

  // Filter mata pelajaran berdasarkan jenis rapor
  const displayedGrades = grades.filter((g) => {
    return type === "diniyah" ? isDiniyahSubject(g.subjectCode) : isUmumSubject(g.subjectCode)
  })

  const fase = student.kelas.toLowerCase().includes("mta")
    ? "MTA"
    : student.kelas.toLowerCase().includes("7") ||
        student.kelas.toLowerCase().includes("8") ||
        student.kelas.toLowerCase().includes("9")
      ? "D"
      : "E/F"

  const defaultExtracurriculars: Array<{ name: string; score: string; description?: string }> = [
    { name: "Tahsin", score: "A", description: "Baik dalam menerapkan hukum nun mati, tanwin dan makhrajul huruf" },
    { name: "Rohis", score: "-", description: "-" },
    { name: "Pramuka", score: "-", description: "-" },
    { name: "Matematika", score: "-", description: "-" },
    { name: "Ilmu Pengetahuan Alam", score: "-", description: "-" },
    { name: "Ilmu Pengetahuan Sosial", score: "-", description: "-" },
  ]

  const activeExtracurriculars =
    homeroom?.extracurriculars && homeroom.extracurriculars.length > 0
      ? homeroom.extracurriculars
      : defaultExtracurriculars

  const getDisplayNarrative = (grade: ReportCardGradeItem) => {
    if (grade.competencyNarrative && grade.competencyNarrative.trim() !== "" && grade.competencyNarrative.trim() !== "-") {
      return grade.competencyNarrative.trim()
    }
    if (grade.finalScore > 0) {
      const cp = getDefaultCpForSubject(grade.subjectCode)
      return generateCompetencyNarrative(grade.finalScore, cp)
    }
    return "-"
  }

  // 1. Rapor KURMER PTS (1 Halaman)
  if (type === "umum" && period === "STS") {
    return (
      <div
        className="report-sheet-container mx-auto"
        style={{
          width: "100%",
          maxWidth: "800px",
          backgroundColor: "#ffffff",
          color: "#000000",
          fontFamily: '"Times New Roman", Times, serif',
        }}
      >
        <div
          className="report-sheet-page shadow-sm border border-neutral-200 print:shadow-none print:border-none"
          style={{
            backgroundColor: "#ffffff",
            color: "#000000",
            boxSizing: "border-box",
            width: "100%",
            padding: "1in 0.75in", // Moderate margin: Top 1", Bottom 1", Left 0.75", Right 0.75"
          }}
        >
          {showKop && <RaporLetterhead institution={student.jenjang} />}

          {/* Judul Dokumen */}
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <h2
              style={{
                fontSize: "15px",
                fontWeight: "bold",
                margin: "0 0 2px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              PENCAPAIAN KOMPETENSI MURID
            </h2>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: "bold",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              SUMATIF TENGAH SEMESTER
            </h3>
            <p style={{ fontSize: "10px", margin: "2px 0 0 0", color: "#4b5563" }}>
              Laporan Hasil Sumatif Tengah Semester — Kurikulum Merdeka
            </p>
          </div>

          {/* Identitas Santri 2 Kolom Rapi */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: "24px",
              fontSize: "11px",
              lineHeight: "1.45",
              marginBottom: "14px",
              color: "#000000",
            }}
          >
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "11px" }}>
              <tbody>
                <tr>
                  <td style={{ width: "85px", padding: "1.5px 0", verticalAlign: "top" }}>Nama Murid</td>
                  <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                  <td style={{ padding: "1.5px 0", verticalAlign: "top", fontWeight: "bold" }}>{cleanStudentName(student.nama)}</td>
                </tr>
                <tr>
                  <td style={{ width: "85px", padding: "1.5px 0", verticalAlign: "top" }}>NISN</td>
                  <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                  <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{student.nisn || "-"}</td>
                </tr>
                <tr>
                  <td style={{ width: "85px", padding: "1.5px 0", verticalAlign: "top" }}>Nama Sekolah</td>
                  <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                  <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{instHeader.institutionName}</td>
                </tr>
              </tbody>
            </table>

            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "11px" }}>
              <tbody>
                <tr>
                  <td style={{ width: "80px", padding: "1.5px 0", verticalAlign: "top" }}>Kelas</td>
                  <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                  <td style={{ padding: "1.5px 0", verticalAlign: "top", fontWeight: "bold" }}>{student.kelas}</td>
                </tr>
                <tr>
                  <td style={{ width: "80px", padding: "1.5px 0", verticalAlign: "top" }}>Fase</td>
                  <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                  <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{fase}</td>
                </tr>
                <tr>
                  <td style={{ width: "80px", padding: "1.5px 0", verticalAlign: "top" }}>Semester</td>
                  <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                  <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{semester}</td>
                </tr>
                <tr>
                  <td style={{ width: "80px", padding: "1.5px 0", verticalAlign: "top" }}>Tahun Ajaran</td>
                  <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                  <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{academicYear}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tabel Nilai (10 Mapel Umum) */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #000000",
              fontSize: "10.5px",
              marginBottom: "20px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#E0E0E0", textAlign: "center", fontWeight: "bold" }}>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "32px", textAlign: "center" }}>No</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "center", width: "190px" }}>Mata Pelajaran</th>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "70px", textAlign: "center" }}>Nilai Akhir</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "center" }}>Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody>
              {displayedGrades.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ border: "1px solid #000000", padding: "12px", textAlign: "center", fontStyle: "italic", color: "#6b7280" }}>
                    Belum ada nilai mata pelajaran tercatat.
                  </td>
                </tr>
              ) : (
                displayedGrades.map((g, idx) => (
                  <tr key={g.subjectCode}>
                    <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ border: "1px solid #000000", padding: "4px 6px", fontWeight: "bold" }}>{g.subjectName}</td>
                    <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "center", fontWeight: "bold" }}>{g.finalScore}</td>
                    <td style={{ border: "1px solid #000000", padding: "4px 6px", lineHeight: "1.35", color: "#000000" }}>
                      {getDisplayNarrative(g)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Blok 3 Tanda Tangan */}
          <div style={{ marginTop: "28px", fontSize: "11px", lineHeight: "1.4" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", textAlign: "center" }}>
              <div style={{ width: "180px" }}>
                <p style={{ margin: 0 }}>Mengetahui<br />Orangtua/Wali,</p>
                <div style={{ height: "46px" }} />
                <p style={{ margin: 0 }}>......................</p>
              </div>

              <div style={{ width: "240px", textAlign: "center" }}>
                <p style={{ margin: 0 }}>{reportDate}<br />Guru Kelas {student.kelas},</p>
                <div style={{ height: "46px" }} />
                <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>{homeroomTeacherName}</p>
                <p style={{ margin: "2px 0 0 0" }}>NIY.{homeroomTeacherNiy.replace(/^NIY\.?\s*/i, "")}</p>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <p style={{ margin: 0 }}>Mengetahui<br />Kepala Sekolah,</p>
              <div style={{ height: "46px" }} />
              <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>{principalName}</p>
              <p style={{ margin: "2px 0 0 0" }}>NIY.{principalNiy.replace(/^NIY\.?\s*/i, "")}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 2. Rapor KURMER PAS (2 Halaman Sesuai Referensi Gambar 1 & 2)
  if (type === "umum" && period === "SAS") {
    return (
      <div
        className="report-sheet-container mx-auto"
        style={{
          width: "100%",
          maxWidth: "800px",
          backgroundColor: "#ffffff",
          color: "#000000",
          fontFamily: '"Times New Roman", Times, serif',
        }}
      >
        {/* HALAMAN 1: KOP SURAT, IDENTITAS SISWA, DAN TABEL NILAI */}
        <div
          className="report-sheet-page shadow-sm border border-neutral-200 mb-8 print:shadow-none print:border-none print:mb-0"
          style={{
            backgroundColor: "#ffffff",
            color: "#000000",
            boxSizing: "border-box",
            width: "100%",
            padding: "1in 0.75in", // Moderate margin: Top 1", Bottom 1", Left 0.75", Right 0.75"
            pageBreakAfter: "always",
          }}
        >
          {showKop && <RaporLetterhead institution={student.jenjang} />}

          {/* Judul Dokumen */}
          <div style={{ textAlign: "center", marginBottom: "14px" }}>
            <h2
              style={{
                fontSize: "15px",
                fontWeight: "bold",
                margin: "0 0 2px 0",
                textTransform: "uppercase",
                letterSpacing: "0.5px",
              }}
            >
              PENCAPAIAN KOMPETENSI MURID
            </h2>
            <h3
              style={{
                fontSize: "13px",
                fontWeight: "bold",
                margin: 0,
                textTransform: "uppercase",
              }}
            >
              SUMATIF AKHIR SEMESTER
            </h3>
            <p style={{ fontSize: "10px", margin: "2px 0 0 0", color: "#4b5563" }}>
              Laporan Hasil Sumatif Akhir Semester — Kurikulum Merdeka
            </p>
          </div>

          {/* Identitas Santri 2 Kolom Rapi */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1.2fr 0.8fr",
              gap: "24px",
              fontSize: "11px",
              lineHeight: "1.45",
              marginBottom: "12px",
              color: "#000000",
            }}
          >
            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "11px" }}>
              <tbody>
                <tr>
                  <td style={{ width: "85px", padding: "1.5px 0", verticalAlign: "top" }}>Nama Murid</td>
                  <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                  <td style={{ padding: "1.5px 0", verticalAlign: "top", fontWeight: "bold" }}>{cleanStudentName(student.nama)}</td>
                </tr>
                <tr>
                  <td style={{ width: "85px", padding: "1.5px 0", verticalAlign: "top" }}>NISN</td>
                  <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                  <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{student.nisn || "-"}</td>
                </tr>
                <tr>
                  <td style={{ width: "85px", padding: "1.5px 0", verticalAlign: "top" }}>Nama Sekolah</td>
                  <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                  <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{instHeader.institutionName}</td>
                </tr>
              </tbody>
            </table>

            <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "11px" }}>
              <tbody>
                <tr>
                  <td style={{ width: "80px", padding: "1.5px 0", verticalAlign: "top" }}>Kelas</td>
                  <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                  <td style={{ padding: "1.5px 0", verticalAlign: "top", fontWeight: "bold" }}>{student.kelas}</td>
                </tr>
                <tr>
                  <td style={{ width: "80px", padding: "1.5px 0", verticalAlign: "top" }}>Fase</td>
                  <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                  <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{fase}</td>
                </tr>
                <tr>
                  <td style={{ width: "80px", padding: "1.5px 0", verticalAlign: "top" }}>Semester</td>
                  <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                  <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{semester}</td>
                </tr>
                <tr>
                  <td style={{ width: "80px", padding: "1.5px 0", verticalAlign: "top" }}>Tahun Ajaran</td>
                  <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                  <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{academicYear}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Tabel Nilai (10 Mapel) */}
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #000000",
              fontSize: "10px",
              marginBottom: "14px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#E0E0E0", textAlign: "center", fontWeight: "bold" }}>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "30px", textAlign: "center" }}>No</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "center", width: "185px" }}>Mata Pelajaran</th>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "65px", textAlign: "center" }}>Nilai Akhir</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "center" }}>Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody>
              {displayedGrades.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ border: "1px solid #000000", padding: "12px", textAlign: "center", fontStyle: "italic", color: "#6b7280" }}>
                    Belum ada nilai mata pelajaran tercatat.
                  </td>
                </tr>
              ) : (
                displayedGrades.map((g, idx) => (
                  <tr key={g.subjectCode}>
                    <td style={{ border: "1px solid #000000", padding: "3.5px 4px", textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ border: "1px solid #000000", padding: "3.5px 6px", fontWeight: "bold" }}>{g.subjectName}</td>
                    <td style={{ border: "1px solid #000000", padding: "3.5px 4px", textAlign: "center", fontWeight: "bold" }}>{g.finalScore}</td>
                    <td style={{ border: "1px solid #000000", padding: "3.5px 6px", lineHeight: "1.3", color: "#000000" }}>
                      {getDisplayNarrative(g)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* HALAMAN 2: KOKURIKULER, EKSTRAKURIKULER, KETIDAKHADIRAN, CATATAN, TANGGAPAN, TANDA TANGAN (Sesuai Referensi Gambar 2) */}
        <div
          className="report-sheet-page shadow-sm border border-neutral-200 print:shadow-none print:border-none"
          style={{
            backgroundColor: "#ffffff",
            color: "#000000",
            boxSizing: "border-box",
            width: "100%",
            padding: "1in 0.75in", // Moderate margin: Top 1", Bottom 1", Left 0.75", Right 0.75"
          }}
        >
          {/* Kotak Kokurikuler */}
          <div
            style={{
              border: "1px solid #000000",
              fontSize: "10.5px",
              marginBottom: "14px",
            }}
          >
            <div
              style={{
                backgroundColor: "#E0E0E0",
                fontWeight: "bold",
                textAlign: "center",
                padding: "4px 8px",
                borderBottom: "1px solid #000000",
              }}
            >
              Kokurikuler
            </div>
            <div style={{ padding: "6px 8px", lineHeight: "1.45", color: "#000000" }}>
              {/* Penguatan Karakter Profil Pelajar Pancasila */}
              Ananda sudah baik dalam keimanan dan ketakwaan terhadap Tuhan Yang Maha Esa, tercermin dari sikap religiusnya seperti melaksanakan sholat berjamaah di masjid, melakukan muroja&apos;ah dan menghafal Al-Qur&apos;an, serta menjaga adab terhadap teman dan guru.
            </div>
          </div>

          {/* Tabel Ekstrakurikuler (Sesuai Referensi Gambar 2: No, Ekstrakurikuler, Keterangan) */}
          <div style={{ marginBottom: "14px" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "1px solid #000000",
                fontSize: "10.5px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#E0E0E0", textAlign: "center", fontWeight: "bold" }}>
                  <th style={{ border: "1px solid #000000", padding: "4px", width: "32px" }}>No</th>
                  <th style={{ border: "1px solid #000000", padding: "4px 8px", width: "200px" }}>Ekstrakurikuler</th>
                  <th style={{ border: "1px solid #000000", padding: "4px 8px" }}>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {activeExtracurriculars.map((e, idx) => (
                  <tr key={e.name}>
                    <td style={{ border: "1px solid #000000", padding: "3.5px 4px", textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ border: "1px solid #000000", padding: "3.5px 8px" }}>{e.name}</td>
                    <td
                      style={{
                        border: "1px solid #000000",
                        padding: "3.5px 8px",
                        textAlign: e.description && e.description !== "-" ? "left" : "center",
                      }}
                    >
                      {e.description || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ketidakhadiran & Catatan Wali Kelas Berdampingan */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "180px 1fr",
              gap: "14px",
              marginBottom: "14px",
            }}
          >
            {/* Tabel Ketidakhadiran */}
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                border: "1px solid #000000",
                fontSize: "10.5px",
              }}
            >
              <thead>
                <tr>
                  <th
                    colSpan={3}
                    style={{
                      backgroundColor: "#E0E0E0",
                      border: "1px solid #000000",
                      padding: "4px 6px",
                      textAlign: "center",
                      fontWeight: "bold",
                    }}
                  >
                    Ketidakhadiran
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ border: "1px solid #000000", padding: "3.5px 6px" }}>Sakit</td>
                  <td style={{ border: "1px solid #000000", padding: "3.5px", textAlign: "center", width: "16px" }}>:</td>
                  <td style={{ border: "1px solid #000000", padding: "3.5px 6px", textAlign: "center" }}>
                    {homeroom?.sickDays !== undefined ? `${homeroom.sickDays} hari` : "11 hari"}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000000", padding: "3.5px 6px" }}>Izin</td>
                  <td style={{ border: "1px solid #000000", padding: "3.5px", textAlign: "center", width: "16px" }}>:</td>
                  <td style={{ border: "1px solid #000000", padding: "3.5px 6px", textAlign: "center" }}>
                    {homeroom?.permissionDays ? `${homeroom.permissionDays} hari` : "hari"}
                  </td>
                </tr>
                <tr>
                  <td style={{ border: "1px solid #000000", padding: "3.5px 6px" }}>Tanpa Keterangan</td>
                  <td style={{ border: "1px solid #000000", padding: "3.5px", textAlign: "center", width: "16px" }}>:</td>
                  <td style={{ border: "1px solid #000000", padding: "3.5px 6px", textAlign: "center" }}>
                    {homeroom?.absentDays ? `${homeroom.absentDays} hari` : "hari"}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Kotak Catatan Wali Kelas */}
            <div style={{ border: "1px solid #000000", fontSize: "10.5px" }}>
              <div
                style={{
                  backgroundColor: "#E0E0E0",
                  fontWeight: "bold",
                  textAlign: "center",
                  padding: "4px 8px",
                  borderBottom: "1px solid #000000",
                }}
              >
                Catatan Wali Kelas
              </div>
              <div style={{ padding: "6px 8px", lineHeight: "1.45", color: "#000000" }}>
                {homeroom?.homeroomNotes ||
                  "Alhamdulillah, semangat belajar dan tingkatkan terus prestasimu. Ta’at kepada guru dan orangtua serta saling menyayangi sesama teman di sekolah. Istiqomah menghafal dan muraja’ah Al-qur’an setiap hari, semoga engkau menjadi anak sholih. Baarokallahu fiikum."}
              </div>
            </div>
          </div>

          {/* Kotak Tanggapan Orang Tua/Wali Murid */}
          <div
            style={{
              border: "1px solid #000000",
              fontSize: "10.5px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                backgroundColor: "#E0E0E0",
                fontWeight: "bold",
                textAlign: "center",
                padding: "4px 8px",
                borderBottom: "1px solid #000000",
              }}
            >
              Tanggapan Orang Tua/Wali Murid
            </div>
            <div style={{ padding: "8px", minHeight: "55px", color: "#000000" }}>
              {homeroom?.parentResponse || ""}
            </div>
          </div>

          {/* Kotak Keputusan Kenaikan Kelas (Hanya Semester 2 / Akhir Tahun) */}
          {(semester === 2 || homeroom?.promotionDecision) && (
            <div
              style={{
                border: "1px solid #000000",
                padding: "6px 10px",
                fontSize: "10.5px",
                marginBottom: "14px",
                backgroundColor: "#fafafa",
              }}
            >
              <p style={{ margin: "0 0 2px 0", fontWeight: "bold", textTransform: "uppercase" }}>
                Keputusan :
              </p>
              <p style={{ margin: "0 0 4px 0", color: "#374151" }}>
                Berdasarkan hasil yang dicapai pada semester 1 dan 2, santri dinyatakan :
              </p>
              <p style={{ margin: 0, fontWeight: "bold", fontSize: "11px", textTransform: "uppercase" }}>
                {homeroom?.promotionDecision || "NAIK KE TINGKAT KELAS BERIKUTNYA"}
              </p>
            </div>
          )}

          {/* Blok 3 Tanda Tangan */}
          <div style={{ marginTop: "20px", fontSize: "11px", lineHeight: "1.4" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", textAlign: "center" }}>
              <div style={{ width: "180px" }}>
                <p style={{ margin: 0 }}>Mengetahui<br />Orangtua/Wali,</p>
                <div style={{ height: "46px" }} />
                <p style={{ margin: 0 }}>......................</p>
              </div>

              <div style={{ width: "240px", textAlign: "center" }}>
                <p style={{ margin: 0 }}>{reportDate}<br />Guru Kelas {student.kelas},</p>
                <div style={{ height: "46px" }} />
                <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>{homeroomTeacherName}</p>
                <p style={{ margin: "2px 0 0 0" }}>NIY.{homeroomTeacherNiy.replace(/^NIY\.?\s*/i, "")}</p>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <p style={{ margin: 0 }}>Mengetahui<br />Kepala Sekolah,</p>
              <div style={{ height: "46px" }} />
              <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>{principalName}</p>
              <p style={{ margin: "2px 0 0 0" }}>NIY.{principalNiy.replace(/^NIY\.?\s*/i, "")}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 3. Rapor DINIYAH PTS & PAS (1 Halaman)
  return (
    <div
      className="report-sheet-container mx-auto"
      style={{
        width: "100%",
        maxWidth: "800px",
        backgroundColor: "#ffffff",
        color: "#000000",
        fontFamily: '"Times New Roman", Times, serif',
      }}
    >
      <div
        className="report-sheet-page shadow-sm border border-neutral-200 print:shadow-none print:border-none"
        style={{
          backgroundColor: "#ffffff",
          color: "#000000",
          boxSizing: "border-box",
          width: "100%",
          padding: "1in 0.75in", // Moderate margin: Top 1", Bottom 1", Left 0.75", Right 0.75"
        }}
      >
        {showKop && <RaporLetterhead institution={student.jenjang} />}

        {/* Judul Dokumen */}
        <div style={{ textAlign: "center", marginBottom: "16px" }}>
          <h2
            style={{
              fontSize: "15px",
              fontWeight: "bold",
              margin: "0 0 2px 0",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            {period === "STS"
              ? "LAPORAN HASIL SUMATIF TENGAH SEMESTER"
              : "LAPORAN HASIL SUMATIF AKHIR SEMESTER"}
          </h2>
          <h3
            style={{
              fontSize: "13px",
              fontWeight: "bold",
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            MATA PELAJARAN DINIYAH
          </h3>
          <p style={{ fontSize: "10px", margin: "2px 0 0 0", color: "#4b5563" }}>
            Laporan Hasil Sumatif Diniyah & Tahfidz — Kurikulum Kepesantrenan At-Tauhid
          </p>
        </div>

        {/* Identitas Santri 2 Kolom Ringkas Rapi */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.2fr 0.8fr",
            gap: "24px",
            fontSize: "11px",
            lineHeight: "1.45",
            marginBottom: "14px",
            color: "#000000",
          }}
        >
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "11px" }}>
            <tbody>
              <tr>
                <td style={{ width: "85px", padding: "1.5px 0", verticalAlign: "top" }}>Nama Murid</td>
                <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top", fontWeight: "bold" }}>{cleanStudentName(student.nama)}</td>
              </tr>
              <tr>
                <td style={{ width: "85px", padding: "1.5px 0", verticalAlign: "top" }}>NISN</td>
                <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{student.nisn || "-"}</td>
              </tr>
              <tr>
                <td style={{ width: "85px", padding: "1.5px 0", verticalAlign: "top" }}>Nama Sekolah</td>
                <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{instHeader.institutionName}</td>
              </tr>
            </tbody>
          </table>

          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: "11px" }}>
            <tbody>
              <tr>
                <td style={{ width: "80px", padding: "1.5px 0", verticalAlign: "top" }}>Kelas</td>
                <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top", fontWeight: "bold" }}>{student.kelas}</td>
              </tr>
              <tr>
                <td style={{ width: "80px", padding: "1.5px 0", verticalAlign: "top" }}>Semester</td>
                <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{semester}</td>
              </tr>
              <tr>
                <td style={{ width: "80px", padding: "1.5px 0", verticalAlign: "top" }}>Tahun Ajaran</td>
                <td style={{ width: "12px", padding: "1.5px 0", verticalAlign: "top", textAlign: "center" }}>:</td>
                <td style={{ padding: "1.5px 0", verticalAlign: "top" }}>{academicYear}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Bagian A. Ketercapaian Hasil Belajar (6 Mapel Diniyah) */}
        <div style={{ marginBottom: "16px" }}>
          <h4
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              margin: "0 0 6px 0",
              color: "#000000",
            }}
          >
            A. Ketercapaian Hasil Belajar
          </h4>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #000000",
              fontSize: "10.5px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#E0E0E0", textAlign: "center", fontWeight: "bold" }}>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "32px", textAlign: "center" }}>No</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "center", width: "170px" }}>Mata Pelajaran</th>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "70px", textAlign: "center" }}>Nilai Akhir</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "center" }}>Capaian Kompetensi</th>
              </tr>
            </thead>
            <tbody>
              {displayedGrades.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ border: "1px solid #000000", padding: "12px", textAlign: "center", fontStyle: "italic", color: "#6b7280" }}>
                    Belum ada nilai mata pelajaran tercatat.
                  </td>
                </tr>
              ) : (
                displayedGrades.map((g, idx) => (
                  <tr key={g.subjectCode}>
                    <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ border: "1px solid #000000", padding: "4px 6px", fontWeight: "bold" }}>{g.subjectName}</td>
                    <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "center", fontWeight: "bold" }}>{g.finalScore}</td>
                    <td style={{ border: "1px solid #000000", padding: "4px 6px", lineHeight: "1.35", color: "#000000" }}>
                      {getDisplayNarrative(g)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Bagian B. Catatan Hafalan Hadits */}
        <div style={{ marginBottom: "20px" }}>
          <h4
            style={{
              fontSize: "12px",
              fontWeight: "bold",
              margin: "0 0 6px 0",
              color: "#000000",
            }}
          >
            B. Catatan Hafalan Hadits
          </h4>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              border: "1px solid #000000",
              fontSize: "10.5px",
            }}
          >
            <thead>
              <tr style={{ backgroundColor: "#E0E0E0", textAlign: "center", fontWeight: "bold" }}>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "32px", textAlign: "center" }}>No</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "center", width: "170px" }}>Mata Pelajaran</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "center" }}>Capaian Hafalan Murid</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "center" }}>
                  {period === "STS"
                    ? `Target Hafalan Tengah Semester ${semester}`
                    : `Target Hafalan Semester ${semester}`}
                </th>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "95px", textAlign: "center" }}>KETERANGAN</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "center" }}>1</td>
                <td style={{ border: "1px solid #000000", padding: "4px 6px", fontWeight: "bold" }}>Hadits Arba&apos;in</td>
                <td style={{ border: "1px solid #000000", padding: "4px 6px" }}>
                  {homeroom?.haditsAchievement || "3 Hadits Arba'in"}
                </td>
                <td style={{ border: "1px solid #000000", padding: "4px 6px" }}>
                  {homeroom?.haditsTarget || "3 Hadits Arba'in"}
                </td>
                <td style={{ border: "1px solid #000000", padding: "4px", textAlign: "center", fontWeight: "bold" }}>
                  Tuntas
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Blok 3 Tanda Tangan */}
        <div style={{ marginTop: "28px", fontSize: "11px", lineHeight: "1.4" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", textAlign: "center" }}>
            <div style={{ width: "180px" }}>
              <p style={{ margin: 0 }}>Mengetahui<br />Orangtua/Wali,</p>
              <div style={{ height: "46px" }} />
              <p style={{ margin: 0 }}>......................</p>
            </div>

            <div style={{ width: "240px", textAlign: "center" }}>
              <p style={{ margin: 0 }}>{reportDate}<br />Guru Kelas {student.kelas},</p>
              <div style={{ height: "46px" }} />
              <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>{homeroomTeacherName}</p>
              <p style={{ margin: "2px 0 0 0" }}>NIY.{homeroomTeacherNiy.replace(/^NIY\.?\s*/i, "")}</p>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <p style={{ margin: 0 }}>Mengetahui<br />Kepala Sekolah,</p>
            <div style={{ height: "46px" }} />
            <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>{principalName}</p>
            <p style={{ margin: "2px 0 0 0" }}>NIY.{principalNiy.replace(/^NIY\.?\s*/i, "")}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
