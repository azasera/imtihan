"use client"

import * as React from "react"
import { RaporLetterhead } from "./RaporLetterhead"
import {
  isDiniyahSubject,
  isUmumSubject,
  cleanStudentName,
  getInstitutionHeader,
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
  reportDate = "Pangkalpinang, 09 Oktober 2026",
  homeroomTeacherName = "Randhy Raviza, S.Pd.",
  homeroomTeacherNiy = "199507180720181019",
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
    { name: "Agrobisnis", score: "A", description: "Sangat Aktif" },
    { name: "TIK", score: "A", description: "Sangat Aktif" },
    { name: "Jurnalis", score: "B", description: "Aktif" },
    { name: "Bulu Tangkis", score: "A", description: "Sangat Aktif" },
    { name: "Tenis Meja", score: "B", description: "Aktif" },
    { name: "Futsal", score: "A", description: "Sangat Aktif" },
    { name: "Panahan", score: "A", description: "Sangat Aktif" },
    { name: "Bola Voli", score: "B", description: "Aktif" },
  ]

  const activeExtracurriculars =
    homeroom?.extracurriculars && homeroom.extracurriculars.length > 0
      ? homeroom.extracurriculars
      : defaultExtracurriculars

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
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        <div
          className="report-sheet-page p-6 sm:p-8"
          style={{
            backgroundColor: "#ffffff",
            color: "#000000",
            boxSizing: "border-box",
            width: "100%",
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

          {/* Identitas Santri 2 Kolom */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              fontSize: "11px",
              lineHeight: "1.4",
              marginBottom: "14px",
            }}
          >
            <div>
              <div style={{ display: "flex", marginBottom: "3px" }}>
                <span style={{ width: "95px", color: "#374151" }}>Nama Murid</span>
                <span style={{ fontWeight: "bold" }}>: {cleanStudentName(student.nama)}</span>
              </div>
              <div style={{ display: "flex", marginBottom: "3px" }}>
                <span style={{ width: "95px", color: "#374151" }}>NISN</span>
                <span>: {student.nisn || "-"}</span>
              </div>
              <div style={{ display: "flex", marginBottom: "3px" }}>
                <span style={{ width: "95px", color: "#374151" }}>Nama Sekolah</span>
                <span>: {instHeader.institutionName}</span>
              </div>
              <div style={{ display: "flex" }}>
                <span style={{ width: "95px", color: "#374151" }}>Alamat</span>
                <span>: {instHeader.address}</span>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", marginBottom: "3px" }}>
                <span style={{ width: "95px", color: "#374151" }}>Kelas</span>
                <span style={{ fontWeight: "bold" }}>: {student.kelas}</span>
              </div>
              <div style={{ display: "flex", marginBottom: "3px" }}>
                <span style={{ width: "95px", color: "#374151" }}>Fase</span>
                <span>: {fase}</span>
              </div>
              <div style={{ display: "flex", marginBottom: "3px" }}>
                <span style={{ width: "95px", color: "#374151" }}>Semester</span>
                <span>: {semester}</span>
              </div>
              <div style={{ display: "flex" }}>
                <span style={{ width: "95px", color: "#374151" }}>Tahun Ajaran</span>
                <span>: {academicYear}</span>
              </div>
            </div>
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
                <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "32px" }}>No</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "left", width: "190px" }}>Mata Pelajaran</th>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "70px" }}>Nilai Akhir</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "left" }}>Capaian Kompetensi</th>
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
                    <td style={{ border: "1px solid #000000", padding: "4px 6px", lineHeight: "1.35", color: "#111827" }}>
                      {g.competencyNarrative || "-"}
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
                <p style={{ margin: 0 }}>Mengetahui,<br />Orang Tua/Wali,</p>
                <div style={{ height: "46px" }} />
                <p style={{ margin: 0, borderBottom: "1px solid #000000", paddingBottom: "2px" }}>....................................</p>
              </div>

              <div style={{ width: "220px", textAlign: "center" }}>
                <p style={{ margin: 0 }}>{reportDate}<br />Guru Kelas,</p>
                <div style={{ height: "46px" }} />
                <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>{homeroomTeacherName}</p>
                <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#374151" }}>NIY. {homeroomTeacherNiy}</p>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <p style={{ margin: 0 }}>Mengetahui,<br />Kepala Sekolah,</p>
              <div style={{ height: "46px" }} />
              <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>{principalName}</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#374151" }}>NIY. {principalNiy}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 2. Rapor KURMER PAS (2 Halaman)
  if (type === "umum" && period === "SAS") {
    return (
      <div
        className="report-sheet-container mx-auto"
        style={{
          width: "100%",
          maxWidth: "800px",
          backgroundColor: "#ffffff",
          color: "#000000",
          fontFamily: "Arial, Helvetica, sans-serif",
        }}
      >
        {/* LEMBAR RAPOR KURMER PAS */}
        <div
          className="report-sheet-page p-6 sm:p-8"
          style={{
            backgroundColor: "#ffffff",
            color: "#000000",
            boxSizing: "border-box",
            width: "100%",
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

          {/* Identitas Santri 2 Kolom */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "12px",
              fontSize: "11px",
              lineHeight: "1.4",
              marginBottom: "12px",
            }}
          >
            <div>
              <div style={{ display: "flex", marginBottom: "3px" }}>
                <span style={{ width: "95px", color: "#374151" }}>Nama Murid</span>
                <span style={{ fontWeight: "bold" }}>: {cleanStudentName(student.nama)}</span>
              </div>
              <div style={{ display: "flex", marginBottom: "3px" }}>
                <span style={{ width: "95px", color: "#374151" }}>NISN</span>
                <span>: {student.nisn || "-"}</span>
              </div>
              <div style={{ display: "flex", marginBottom: "3px" }}>
                <span style={{ width: "95px", color: "#374151" }}>Nama Sekolah</span>
                <span>: {instHeader.institutionName}</span>
              </div>
              <div style={{ display: "flex" }}>
                <span style={{ width: "95px", color: "#374151" }}>Alamat</span>
                <span>: {instHeader.address}</span>
              </div>
            </div>

            <div>
              <div style={{ display: "flex", marginBottom: "3px" }}>
                <span style={{ width: "95px", color: "#374151" }}>Kelas</span>
                <span style={{ fontWeight: "bold" }}>: {student.kelas}</span>
              </div>
              <div style={{ display: "flex", marginBottom: "3px" }}>
                <span style={{ width: "95px", color: "#374151" }}>Fase</span>
                <span>: {fase}</span>
              </div>
              <div style={{ display: "flex", marginBottom: "3px" }}>
                <span style={{ width: "95px", color: "#374151" }}>Semester</span>
                <span>: {semester}</span>
              </div>
              <div style={{ display: "flex" }}>
                <span style={{ width: "95px", color: "#374151" }}>Tahun Ajaran</span>
                <span>: {academicYear}</span>
              </div>
            </div>
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
                <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "30px" }}>No</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "left", width: "185px" }}>Mata Pelajaran</th>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "65px" }}>Nilai Akhir</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "left" }}>Capaian Kompetensi</th>
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
                    <td style={{ border: "1px solid #000000", padding: "3.5px 6px", lineHeight: "1.3", color: "#111827" }}>
                      {g.competencyNarrative || "-"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Kotak Kokurikuler */}
          <div
            style={{
              border: "1px solid #000000",
              fontSize: "10.5px",
              marginTop: "8px",
            }}
          >
            <div
              style={{
                backgroundColor: "#E0E0E0",
                fontWeight: "bold",
                padding: "4px 8px",
                borderBottom: "1px solid #000000",
              }}
            >
              Kokurikuler (Penguatan Karakter Profil Pelajar Pancasila)
            </div>
            <div style={{ padding: "6px 8px", lineHeight: "1.45", color: "#111827" }}>
              Ananda sudah baik dalam keimanan dan ketakwaan terhadap Tuhan Yang Maha Esa, tercermin dari sikap religiusnya seperti melaksanakan sholat berjamaah di masjid, melakukan muroja’ah dan menghafal Al-Qur’an, serta menjaga adab terhadap sesama santri dan para asatidzah.
            </div>
          </div>

          {/* Tabel Ekstrakurikuler */}
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
                  <th style={{ border: "1px solid #000000", padding: "4px", width: "30px" }}>No</th>
                  <th style={{ border: "1px solid #000000", padding: "4px 8px", textAlign: "left", width: "220px" }}>Kegiatan Ekstrakurikuler</th>
                  <th style={{ border: "1px solid #000000", padding: "4px", width: "70px" }}>Predikat</th>
                  <th style={{ border: "1px solid #000000", padding: "4px 8px", textAlign: "left" }}>Keterangan</th>
                </tr>
              </thead>
              <tbody>
                {activeExtracurriculars.map((e, idx) => (
                  <tr key={e.name}>
                    <td style={{ border: "1px solid #000000", padding: "3px", textAlign: "center" }}>{idx + 1}</td>
                    <td style={{ border: "1px solid #000000", padding: "3px 8px", fontWeight: "bold" }}>{e.name}</td>
                    <td style={{ border: "1px solid #000000", padding: "3px", textAlign: "center", fontWeight: "bold" }}>{e.score}</td>
                    <td style={{ border: "1px solid #000000", padding: "3px 8px" }}>{e.description || (e.score === "A" ? "Sangat Aktif" : "Aktif")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Ketidakhadiran & Catatan Wali Kelas Berdampingan */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "220px 1fr",
              gap: "12px",
              marginBottom: "12px",
            }}
          >
            {/* Tabel Ketidakhadiran */}
            <div style={{ border: "1px solid #000000", fontSize: "10.5px" }}>
              <div
                style={{
                  backgroundColor: "#E0E0E0",
                  fontWeight: "bold",
                  padding: "4px 8px",
                  borderBottom: "1px solid #000000",
                  textAlign: "center",
                }}
              >
                Ketidakhadiran
              </div>
              <div style={{ padding: "6px 10px", lineHeight: "1.7" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Sakit</span>
                  <span style={{ fontWeight: "bold" }}>: {homeroom?.sickDays ?? 0} hari</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Izin</span>
                  <span style={{ fontWeight: "bold" }}>: {homeroom?.permissionDays ?? 0} hari</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>Tanpa Keterangan</span>
                  <span style={{ fontWeight: "bold" }}>: {homeroom?.absentDays ?? 0} hari</span>
                </div>
              </div>
            </div>

            {/* Kotak Catatan Wali Kelas */}
            <div style={{ border: "1px solid #000000", fontSize: "10.5px" }}>
              <div
                style={{
                  backgroundColor: "#E0E0E0",
                  fontWeight: "bold",
                  padding: "4px 8px",
                  borderBottom: "1px solid #000000",
                }}
              >
                Catatan Wali Kelas
              </div>
              <div style={{ padding: "6px 8px", lineHeight: "1.45", color: "#111827", fontStyle: "italic" }}>
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
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                backgroundColor: "#E0E0E0",
                fontWeight: "bold",
                padding: "4px 8px",
                borderBottom: "1px solid #000000",
              }}
            >
              Tanggapan Orang Tua / Wali Murid:
            </div>
            <div style={{ padding: "10px 8px 8px 8px", minHeight: "36px", color: "#6b7280" }}>
              {homeroom?.parentResponse || "...................................................................................................................................................................................................."}
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
          <div style={{ marginTop: "24px", fontSize: "11px", lineHeight: "1.4" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", textAlign: "center" }}>
              <div style={{ width: "180px" }}>
                <p style={{ margin: 0 }}>Mengetahui,<br />Orang Tua/Wali,</p>
                <div style={{ height: "46px" }} />
                <p style={{ margin: 0, borderBottom: "1px solid #000000", paddingBottom: "2px" }}>....................................</p>
              </div>

              <div style={{ width: "220px", textAlign: "center" }}>
                <p style={{ margin: 0 }}>{reportDate}<br />Guru Kelas,</p>
                <div style={{ height: "46px" }} />
                <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>{homeroomTeacherName}</p>
                <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#374151" }}>NIY. {homeroomTeacherNiy}</p>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <p style={{ margin: 0 }}>Mengetahui,<br />Kepala Sekolah,</p>
              <div style={{ height: "46px" }} />
              <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>{principalName}</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#374151" }}>NIY. {principalNiy}</p>
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
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        className="report-sheet-page p-6 sm:p-8"
        style={{
          backgroundColor: "#ffffff",
          color: "#000000",
          minHeight: "1050px",
          boxSizing: "border-box",
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

        {/* Identitas Santri 2 Kolom Ringkas */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            fontSize: "11px",
            lineHeight: "1.4",
            marginBottom: "14px",
          }}
        >
          <div>
            <div style={{ display: "flex", marginBottom: "3px" }}>
              <span style={{ width: "95px", color: "#374151" }}>Nama Murid</span>
              <span style={{ fontWeight: "bold" }}>: {cleanStudentName(student.nama)}</span>
            </div>
            <div style={{ display: "flex", marginBottom: "3px" }}>
              <span style={{ width: "95px", color: "#374151" }}>NISN</span>
              <span>: {student.nisn || "-"}</span>
            </div>
            <div style={{ display: "flex" }}>
              <span style={{ width: "95px", color: "#374151" }}>Nama Sekolah</span>
              <span>: {instHeader.institutionName}</span>
            </div>
          </div>

          <div>
            <div style={{ display: "flex", marginBottom: "3px" }}>
              <span style={{ width: "95px", color: "#374151" }}>Kelas</span>
              <span style={{ fontWeight: "bold" }}>: {student.kelas}</span>
            </div>
            <div style={{ display: "flex", marginBottom: "3px" }}>
              <span style={{ width: "95px", color: "#374151" }}>Semester</span>
              <span>: {semester}</span>
            </div>
            <div style={{ display: "flex" }}>
              <span style={{ width: "95px", color: "#374151" }}>Tahun Ajaran</span>
              <span>: {academicYear}</span>
            </div>
          </div>
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
                <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "32px" }}>No</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "left", width: "170px" }}>Mata Pelajaran</th>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "70px" }}>Nilai Akhir</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "left" }}>Capaian Kompetensi</th>
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
                    <td style={{ border: "1px solid #000000", padding: "4px 6px", lineHeight: "1.35", color: "#111827" }}>
                      {g.competencyNarrative || "-"}
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
                <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "32px" }}>No</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "left", width: "170px" }}>Mata Pelajaran</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "left" }}>Capaian Hafalan Murid</th>
                <th style={{ border: "1px solid #000000", padding: "5px 6px", textAlign: "left" }}>
                  {period === "STS"
                    ? `Target Hafalan Tengah Semester ${semester}`
                    : `Target Hafalan Semester ${semester}`}
                </th>
                <th style={{ border: "1px solid #000000", padding: "5px 4px", width: "95px" }}>KETERANGAN</th>
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
              <p style={{ margin: 0 }}>Mengetahui,<br />Orang Tua/Wali,</p>
              <div style={{ height: "46px" }} />
              <p style={{ margin: 0, borderBottom: "1px solid #000000", paddingBottom: "2px" }}>....................................</p>
            </div>

            <div style={{ width: "220px", textAlign: "center" }}>
              <p style={{ margin: 0 }}>{reportDate}<br />Guru Kelas,</p>
              <div style={{ height: "46px" }} />
              <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>{homeroomTeacherName}</p>
              <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#374151" }}>NIY. {homeroomTeacherNiy}</p>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <p style={{ margin: 0 }}>Mengetahui,<br />Kepala Sekolah,</p>
            <div style={{ height: "46px" }} />
            <p style={{ margin: 0, fontWeight: "bold", textDecoration: "underline" }}>{principalName}</p>
            <p style={{ margin: "2px 0 0 0", fontSize: "10px", color: "#374151" }}>NIY. {principalNiy}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
