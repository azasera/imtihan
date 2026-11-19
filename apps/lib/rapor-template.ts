/**
 * Generator file template Excel untuk import nilai rapor.
 *
 * Template berisi daftar santri satu kelas dengan format 6 kolom:
 * No | NISN | Nama Santri | PH | STS | SAS
 * 1 file siap diisi 3 nilai sekaligus oleh guru.
 */

import * as XLSX from "xlsx"

export interface TemplateStudent {
  no: number
  nisn: string
  name: string
}

/**
 * Buat dan unduh file template Excel berisi daftar santri kelas.
 * Kolom: No | NISN | Nama Santri | PH | STS | SAS
 */
export function downloadGradeTemplate(
  students: TemplateStudent[],
  className: string,
  subjectCode: string,
  _subjectName?: string,
  _targetColumn?: "PH" | "STS" | "SAS"
): void {
  const header = [["No", "NISN", "Nama Santri", "PH", "STS", "SAS"]]

  const rows = students.map((s) => [
    s.no,
    s.nisn ? String(s.nisn).trim() : "",
    s.name,
    "",
    "",
    "",
  ])

  const wsData = [...header, ...rows]

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Pastikan kolom NISN (kolom B) selalu diperlakukan sebagai teks (string)
  // agar awalan angka 0 (seperti 0143182548) tidak hilang saat dibuka di Excel.
  for (let r = 1; r <= students.length; r++) {
    const cellRef = XLSX.utils.encode_cell({ r, c: 1 })
    if (ws[cellRef]) {
      ws[cellRef].t = "s"
      ws[cellRef].z = "@"
    }
  }

  // Lebar kolom yang proporsional dan rapi
  ws["!cols"] = [
    { wch: 6 },  // No
    { wch: 18 }, // NISN
    { wch: 38 }, // Nama Santri
    { wch: 10 }, // PH
    { wch: 10 }, // STS
    { wch: 10 }, // SAS
  ]

  // Freeze baris header agar tetap terlihat saat scroll
  ws["!freeze"] = { xSplit: 0, ySplit: 1 }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `Nilai ${subjectCode}`)

  const fileName = `Template_Nilai_${subjectCode}_${className}.xlsx`
  XLSX.writeFile(wb, fileName)
}
