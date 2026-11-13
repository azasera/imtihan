"use client"

import * as React from "react"
import Image from "next/image"
import Link from "next/link"

import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { authClient } from "@/lib/auth-client"
import { siteConfig } from "@/lib/site-config"
import {
  LayoutDashboardIcon,
  ListIcon,
  ChartBarIcon,
  UsersIcon,
  FileTextIcon,
  BookOpenIcon,
  Settings2Icon,
  CommandIcon,
  MonitorIcon,
  GraduationCapIcon,
} from "lucide-react"

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/",
      icon: <LayoutDashboardIcon />,
    },
    {
      title: "Bank Soal",
      url: "/bank-soal",
      icon: <FileTextIcon />,
    },
    {
      title: "Mata Pelajaran",
      url: "/mata-pelajaran",
      icon: <BookOpenIcon />,
    },
    {
      title: "Sesi Ujian",
      url: "/sesi-ujian",
      icon: <ListIcon />,
    },
    {
      title: "Monitoring Sesi",
      url: "/monitoring-sesi",
      icon: <MonitorIcon />,
    },
    {
      title: "Rekap Nilai",
      url: "/rekap-nilai",
      icon: <ChartBarIcon />,
    },
    {
      title: "E-Rapor",
      url: "/rapor",
      icon: <GraduationCapIcon />,
    },
    {
      title: "Data Santri",
      url: "/santri",
      icon: <UsersIcon />,
    },
    {
      title: "Ruang Ujian Santri",
      url: "/ujian",
      icon: <CommandIcon />,
    },
  ],
  navSecondary: [
    {
      title: "Pengaturan Akun",
      url: "/account",
      icon: <Settings2Icon />,
    },
  ],
}

function normalizeText(value: string | null | undefined) {
  const normalized = value?.trim()

  return normalized || undefined
}

function firstCharacters(value: string, count: number) {
  return Array.from(value).slice(0, count).join("")
}

function getInitials(name?: string, email?: string) {
  if (name) {
    const segments = name.split(/\s+/)
    const initials =
      segments.length > 1
        ? `${firstCharacters(segments[0], 1)}${firstCharacters(segments.at(-1) ?? "", 1)}`
        : firstCharacters(segments[0], 2)

    return firstCharacters(initials.toUpperCase(), 2) || "U"
  }

  const emailLocalPart = email?.split("@", 1)[0] ?? ""

  return firstCharacters(emailLocalPart.toUpperCase(), 2) || "U"
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { data: session, isPending, error } = authClient.useSession()
  const sessionUser = session?.user

  const accountName = normalizeText(sessionUser?.name)
  const email = normalizeText(sessionUser?.email)
  const image = normalizeText(sessionUser?.image)
  const displayName = accountName ?? email ?? "User"
  const displayEmail = email ?? "Email unavailable"
  const initials = getInitials(accountName, email)

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader className="border-b border-sidebar-border/40 pb-2.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              className="data-[slot=sidebar-menu-button]:p-2! hover:bg-sidebar-accent/50 rounded-lg transition-colors gap-2.5"
              render={<Link href="/" />}
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/20 shrink-0">
                <Image
                  src="/logo.png"
                  alt={siteConfig.name}
                  width={20}
                  height={20}
                  className="size-5 rounded object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col gap-0.5 leading-none">
                <span className="text-sm font-bold tracking-tight font-heading text-foreground">{siteConfig.name}</span>
                <span className="text-[10.5px] text-muted-foreground font-normal">Pesantren Islamic Centre At-Tauhid</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        {isPending ? (
          <div aria-hidden="true" className="flex h-12 items-center gap-2 px-2">
            <div className="size-8 animate-pulse rounded-lg bg-sidebar-accent" />
            <div className="flex min-w-0 flex-1 flex-col gap-1.5 group-data-[collapsible=icon]:hidden">
              <div className="h-3 w-24 animate-pulse bg-sidebar-accent" />
              <div className="h-2.5 w-32 animate-pulse bg-sidebar-accent" />
            </div>
          </div>
        ) : !error && sessionUser ? (
          <NavUser
            user={{
              name: displayName,
              email: displayEmail,
              image,
              initials,
            }}
          />
        ) : null}
      </SidebarFooter>
    </Sidebar>
  )
}
