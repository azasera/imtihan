"use client"

import jsPDF from "jspdf"
import html2canvas from "html2canvas-pro"
import JSZip from "jszip"

/**
 * Membersihkan nama santri / berkas agar aman untuk sistem berkas (Windows & POSIX)
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[<>:"/\\|?*]/g, "_")
    .replace(/\s+/g, "_")
    .trim()
}

/**
 * Memicu pengunduhan Blob di peramban menggunakan elemen anchor
 */
export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/**
 * Merender elemen DOM rapor ke satu instance jsPDF (A4 Portrait)
 * Mendukung pembagian per halaman (.report-sheet-page) secara otomatis
 */
export async function renderElementToPdf(
  element: HTMLElement,
  pdfInstance?: jsPDF
): Promise<jsPDF> {
  const pdf =
    pdfInstance ??
    new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    })

  const pages = Array.from(element.querySelectorAll<HTMLElement>(".report-sheet-page"))
  const targets = pages.length > 0 ? pages : [element]

  for (let i = 0; i < targets.length; i++) {
    if (i > 0) {
      pdf.addPage()
    }
    const target = targets[i]
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1200,
      onclone: (clonedDoc) => {
        // Netralkan CSS variable modern color format agar tidak memicu parser lab/oklch
        const root = clonedDoc.documentElement
        if (root) {
          root.style.setProperty("--background", "#ffffff")
          root.style.setProperty("--foreground", "#000000")
        }
      },
    })

    const imgData = canvas.toDataURL("image/jpeg", 0.95)
    const pageWidth = 210
    const pageHeight = 297
    const imgWidth = pageWidth
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    let heightLeft = imgHeight
    let position = 0

    pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST")
    heightLeft -= pageHeight

    while (heightLeft > 0) {
      position -= pageHeight
      pdf.addPage()
      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST")
      heightLeft -= pageHeight
    }
  }

  return pdf
}

/**
 * 1. Unduh Rapor Tunggal dalam Format PDF
 */
export async function exportSingleReportPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const pdf = await renderElementToPdf(element)
  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`)
}

/**
 * 2. Unduh Rapor Seluruh Santri dalam Berkas ZIP Terpisah (Per Santri 1 PDF)
 */
export async function exportSeparatedReportsZip(
  reports: Array<{ studentName: string; element: HTMLElement }>,
  zipFilename: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const zip = new JSZip()
  const total = reports.length

  for (let i = 0; i < total; i++) {
    const { studentName, element } = reports[i]
    if (onProgress) onProgress(i + 1, total)

    const pdf = await renderElementToPdf(element)
    const arrayBuffer = pdf.output("arraybuffer")
    const safeName = sanitizeFilename(studentName)
    zip.file(`Rapor_${safeName}.pdf`, arrayBuffer)
  }

  const zipBlob = await zip.generateAsync({ type: "blob" })
  triggerBlobDownload(
    zipBlob,
    zipFilename.endsWith(".zip") ? zipFilename : `${zipFilename}.zip`
  )
}

/**
 * 3. Unduh Seluruh Santri dalam 1 Berkas PDF Gabungan (Batch Kelas Sekali Klik)
 */
export async function exportCombinedReportsPdf(
  elements: HTMLElement[],
  filename: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  })

  let isFirstPage = true
  const total = elements.length

  for (let i = 0; i < total; i++) {
    if (onProgress) onProgress(i + 1, total)

    const el = elements[i]
    const pages = Array.from(el.querySelectorAll<HTMLElement>(".report-sheet-page"))
    const targets = pages.length > 0 ? pages : [el]

    for (const pageEl of targets) {
      if (!isFirstPage) {
        pdf.addPage()
      }
      isFirstPage = false

      const canvas = await html2canvas(pageEl, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        windowWidth: 1200,
        onclone: (clonedDoc) => {
          const root = clonedDoc.documentElement
          if (root) {
            root.style.setProperty("--background", "#ffffff")
            root.style.setProperty("--foreground", "#000000")
          }
        },
      })

      const imgData = canvas.toDataURL("image/jpeg", 0.95)
      const pageWidth = 210
      const pageHeight = 297
      const imgWidth = pageWidth
      const imgHeight = (canvas.height * imgWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST")
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position -= pageHeight
        pdf.addPage()
        pdf.addImage(imgData, "JPEG", 0, position, imgWidth, imgHeight, undefined, "FAST")
        heightLeft -= pageHeight
      }
    }
  }

  pdf.save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`)
}
