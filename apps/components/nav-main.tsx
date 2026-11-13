"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { PlusCircleIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  title: string
  url: string
  icon?: React.ReactNode
}

interface NavSection {
  label: string
  urls: string[]
}

const SECTIONS: NavSection[] = [
  {
    label: "Ringkasan",
    urls: ["/"],
  },
  {
    label: "Penyusunan Asesmen",
    urls: ["/bank-soal", "/mata-pelajaran"],
  },
  {
    label: "Pelaksanaan & Pantauan",
    urls: ["/sesi-ujian", "/monitoring-sesi", "/rekap-nilai"],
  },
  {
    label: "Rapor",
    urls: ["/rapor"],
  },
  {
    label: "Data & Gerbang",
    urls: ["/santri", "/ujian"],
  },
]

export function NavMain({
  items,
}: {
  items: NavItem[]
}) {
  const pathname = usePathname()

  const isItemActive = (url: string) => {
    if (url === "/") {
      return pathname === "/"
    }
    if (url === "/bank-soal") {
      // Ketika di /bank-soal/baru, sorotan aktif dialihkan ke tombol studio Buat Bank Soal
      if (pathname === "/bank-soal/baru") {
        return false
      }
      return pathname === "/bank-soal" || pathname.startsWith("/bank-soal/")
    }
    return pathname === url || pathname.startsWith(url + "/")
  }

  const isCreationStudioActive = pathname === "/bank-soal/baru"

  // Kelompokkan butir navigasi berdasarkan seksi logis
  const groupedSections = React.useMemo(() => {
    const placedUrls = new Set<string>()
    const sectionsWithItems = SECTIONS.map((sec) => {
      const sectionItems = items.filter((item) => {
        if (sec.urls.includes(item.url)) {
          placedUrls.add(item.url)
          return true
        }
        return false
      })
      return {
        label: sec.label,
        items: sectionItems,
      }
    }).filter((sec) => sec.items.length > 0)

    // Tangkap butir apa pun yang belum masuk ke seksi baku
    const remainingItems = items.filter((item) => !placedUrls.has(item.url))
    if (remainingItems.length > 0) {
      sectionsWithItems.push({
        label: "Lainnya",
        items: remainingItems,
      })
    }

    return sectionsWithItems
  }, [items])

  return (
    <div className="flex flex-col gap-3 px-2 py-1">
      {/* Tombol Aksi Utama: Buat Bank Soal */}
      <SidebarGroup className="p-0">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="Studio Pembuatan Bank Soal"
              render={<Link href="/bank-soal/baru" />}
              className={cn(
                "h-10 w-full rounded-lg font-semibold text-white shadow-sm transition-all duration-200 gap-2.5 px-3",
                isCreationStudioActive
                  ? "bg-gradient-to-r from-emerald-700 to-teal-800 ring-2 ring-emerald-400 ring-offset-2 ring-offset-background shadow-md shadow-emerald-950/20"
                  : "bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 hover:shadow-md hover:shadow-emerald-950/20 active:scale-[0.99]"
              )}
            >
              <PlusCircleIcon className="size-4.5 shrink-0" />
              <span className="font-semibold text-xs tracking-wide">Buat Bank Soal</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarGroup>

      {/* Menu Terkelompok */}
      {groupedSections.map((sec) => (
        <SidebarGroup key={sec.label} className="p-0">
          <SidebarGroupLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 px-2 h-6">
            {sec.label}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="gap-0.5">
              {sec.items.map((item) => {
                const active = isItemActive(item.url)
                const isMonitoring = item.url === "/monitoring-sesi"
                const isExamWorksheet = item.url === "/ujian"

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      tooltip={item.title}
                      render={<Link href={item.url} />}
                      className={cn(
                        "relative h-9 px-2.5 gap-2.5 rounded-lg text-xs font-medium transition-all duration-150 group",
                        active
                          ? "bg-primary/10 text-primary font-semibold before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:rounded-r before:bg-primary shadow-2xs"
                          : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
                      )}
                    >
                      <span
                        className={cn(
                          "size-4 shrink-0 transition-colors [&>svg]:size-4",
                          active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate">{item.title}</span>

                      {/* Lencana khusus status langsung */}
                      {isMonitoring && (
                        <span className="ml-auto flex items-center gap-1.5 text-[9.5px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full shrink-0">
                          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          Live
                        </span>
                      )}

                      {isExamWorksheet && (
                        <span className="ml-auto text-[9.5px] font-medium text-muted-foreground/80 bg-muted px-1.5 py-0.5 rounded border border-border/60 shrink-0">
                          Portal
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      ))}
    </div>
  )
}
