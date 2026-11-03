import Image from "next/image"
import Link from "next/link"

import { ThemeToggle } from "@/components/theme-toggle"
import { buttonVariants } from "@/components/ui/button"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { siteConfig } from "@/lib/site-config"

export function SiteHeader({ authenticated }: { authenticated: boolean }) {
  if (!authenticated) {
    return (
      <header className="flex h-12 shrink-0 items-center border-b">
        <div className="flex w-full items-center justify-between gap-4 px-4 lg:px-6">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Image
              src="/logo.png"
              alt={siteConfig.name}
              width={24}
              height={24}
              className="size-6 rounded object-contain"
              priority
            />
            <span>{siteConfig.name}</span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Authentication">
            <ThemeToggle />
            <Link href="/login" className={buttonVariants({ variant: "ghost" })}>
              Login
            </Link>
            <Link href="/signup" className={buttonVariants()}>
              Start Creating
            </Link>
          </nav>
        </div>
      </header>
    )
  }

  return (
    <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
      <div className="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1" />
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
