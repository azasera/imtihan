"use client"

import * as React from "react"
import Image from "next/image"

import { NavDocuments } from "@/components/nav-documents"
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
  FolderIcon,
  UsersIcon,
  CameraIcon,
  FileTextIcon,
  Settings2Icon,
  CircleHelpIcon,
  SearchIcon,
  DatabaseIcon,
  FileChartColumnIcon,
  FileIcon,
  CommandIcon,
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
      title: "Sesi Ujian",
      url: "/sesi-ujian",
      icon: <ListIcon />,
    },
    {
      title: "Rekap Nilai",
      url: "/rekap-nilai",
      icon: <ChartBarIcon />,
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
  navClouds: [
    {
      title: "Capture",
      icon: <CameraIcon />,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: <FileTextIcon />,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: <FileTextIcon />,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
    },
    {
      title: "Get Help",
      url: "#",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Search",
      url: "#",
      icon: <SearchIcon />,
    },
  ],
  documents: [
    {
      name: "Bank Soal",
      url: "/bank-soal",
      icon: <DatabaseIcon />,
    },
    {
      name: "Rekap Nilai",
      url: "/rekap-nilai",
      icon: <FileChartColumnIcon />,
    },
    {
      name: "Jadwal Ujian",
      url: "/sesi-ujian",
      icon: <FileIcon />,
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
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className="data-[slot=sidebar-menu-button]:p-1.5!"
              render={<a href="#" />}
            >
              <Image
                src="/logo.png"
                alt={siteConfig.name}
                width={24}
                height={24}
                className="size-6! rounded object-contain"
                priority
              />
              <span className="text-base font-semibold">{siteConfig.name}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
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
