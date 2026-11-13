"use client"

import * as React from "react"
import Image from "next/image"
import { getInstitutionHeader, getInstitutionLogos, type Institution } from "@/lib/rapor-utils"

interface RaporLetterheadProps {
  institution: Institution | string
  className?: string
}

/**
 * Komponen KOP Rapor resmi SiPAKSa sesuai lembaga santri di bawah naungan
 * Pondok Pesantren Islamic Centre At-Tauhid / Yayasan At-Tauhid Al Islamy Bangka Belitung.
 *
 * Sebelah Kiri : Logo Ponpes ICT (Islamic Centre At-Tauhid)
 * Sebelah Kanan: Logo resmi Lembaga Santri masing-masing (SMPITA / SMAITA / MTA)
 * Garis Bawah  : Double border resmi
 */
export function RaporLetterhead({ institution, className = "" }: RaporLetterheadProps) {
  const header = getInstitutionHeader(institution)
  const logos = getInstitutionLogos(institution)

  return (
    <div
      className={`w-full text-center pb-2.5 mb-4 border-b-4 border-double border-foreground ${className}`}
      style={{
        borderBottom: "4px double #000000",
        color: "#000000",
        boxSizing: "border-box",
      }}
    >
      <div className="flex items-center justify-between gap-3 md:gap-5">
        {/* Logo Kiri: Pondok Pesantren Islamic Centre At-Tauhid */}
        <div className="shrink-0 size-16 md:size-20 relative flex items-center justify-center">
          <Image
            src={logos.leftLogo}
            alt={logos.leftLogoAlt}
            width={80}
            height={80}
            className="size-16 md:size-20 object-contain shrink-0"
            priority
          />
        </div>

        {/* Teks Identitas Resmi Lembaga di Bawah Naungan Pesantren */}
        <div className="flex-1 text-center space-y-0.5 min-w-0">
          <p className="text-[9px] md:text-[10px] font-semibold tracking-wider uppercase text-muted-foreground font-sans">
            {header.foundation} &bull; {header.city}
          </p>
          <h2 className="text-sm md:text-lg font-extrabold tracking-wide uppercase font-heading text-foreground leading-tight">
            {header.pesantrenTitle ?? "PONDOK PESANTREN"}
          </h2>
          <h3 className="text-[10px] md:text-xs font-bold tracking-wider uppercase text-foreground/90">
            {header.pesantrenSubtitle ?? "ISLAMIC CENTRE  AT-TAUHID BANGKA BELITUNG"}
          </h3>
          <h1 className="text-xs md:text-sm font-extrabold tracking-tight uppercase text-foreground mt-0.5">
            {header.institutionName}
          </h1>
          {header.npsn && (
            <p className="text-[9.5px] md:text-[11px] font-semibold text-foreground/80">
              NPSN: {header.npsn}
            </p>
          )}
          <p className="text-[8.5px] md:text-[10px] text-muted-foreground italic leading-tight font-serif">
            Alamat: {header.address} - {header.province}
          </p>
        </div>

        {/* Logo Kanan: Lembaga Masing-Masing (SMPITA / SMAITA / MTA) */}
        <div className="shrink-0 size-16 md:size-20 relative flex items-center justify-center">
          <Image
            src={logos.rightLogo}
            alt={logos.rightLogoAlt}
            width={80}
            height={80}
            className="size-16 md:size-20 object-contain shrink-0"
            priority
          />
        </div>
      </div>
    </div>
  )
}
