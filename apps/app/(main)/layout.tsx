import type { CSSProperties, ReactNode } from "react"
import { cookies } from "next/headers"

import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { isAuthenticated } from "@/lib/auth-server"
import { parseSidebarState, SIDEBAR_STATE_KEY } from "@/lib/sidebar-state"

export default async function MainLayout({
  children,
}: {
  children: ReactNode
}) {
  const authenticated = await isAuthenticated()

  if (!authenticated) {
    return (
      <>
        <SiteHeader authenticated={authenticated} />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            {children}
          </div>
        </div>
      </>
    )
  }

  const cookieStore = await cookies()
  const defaultOpen =
    parseSidebarState(cookieStore.get(SIDEBAR_STATE_KEY)?.value) ?? true

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        {/* <main className="flex flex-col h-dvh flex-1 min-w-0 min-h-0"> */}
          <SiteHeader authenticated={authenticated} />
          <div className="flex flex-1 flex-col min-w-0 min-h-0">
            <div className="@container/main flex flex-1 flex-col gap-2 min-h-0">
              {children}
            </div>
          </div>
        {/* </main> */}
      </SidebarInset>
    </SidebarProvider>
  )
}
