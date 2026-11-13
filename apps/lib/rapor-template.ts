/**
 * Generator file template Excel untuk import nilai rapor.
 *
 * Template berisi daftar santri satu kelas dengan kolom siap diisi nilai.
 * Guru mengunduh template, mengisi kolom Nilai, lalu upload kembali.
 */

import * as XLSX from "xlsx"

export interface TemplateStudent {
  no: number
  nisn: string
  name: string
}

/**
 * Buat dan unduh file template Excel berisi daftar santri kelas.
 * Kolom: No | NISN | Nama Santri | Nilai
 */
export function downloadGradeTemplate(
  students: TemplateStudent[],
  className: string,
  subjectCode: string,
  subjectName: string,
  targetColumn: "PH" | "STS" | "SAS"
): void {
  const targetLabels: Record<string, string> = {
    PH: "Nilai PH / Tugas",
    STS: "Nilai STS / PTS",
    SAS: "Nilai SAS / PAS",
  }

  const header = [["No", "NISN", "Nama Santri", targetLabels[targetColumn]]]

  const rows = students.map((s) => [s.no, s.nisn || "(tanpa NISN)", s.name, ""])

  const wsData = [...header, ...rows]

  const ws = XLSX.utils.aoa_to_sheet(wsData)

  // Lebar kolom
  ws["!cols"] = [
    { wch: 5 },  // No
    { wch: 15 }, // NISN
    { wch: 35 }, // Nama Santri
    { wch: 15 }, // Nilai
  ]

  // Freeze baris header
  ws["!freeze"] = { xSplit: 0, ySplit: 1 }

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `Nilai ${subjectCode}`)

  const fileName = `Template_Nilai_${subjectCode}_${className}_${targetColumn}.xlsx`
  XLSX.writeFile(wb, fileName)
}
