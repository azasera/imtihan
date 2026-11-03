import { redirect } from "next/navigation"

import { isAuthenticated } from "@/lib/auth-server"
import { siteConfig } from "@/lib/site-config"

export default async function AccountPage() {
  if (!(await isAuthenticated())) redirect("/login")

  return (
    <div className="flex flex-1 flex-col gap-2 px-4 py-6 lg:px-6">
      <p className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
        Protected account
      </p>
      <h1 className="font-heading text-2xl font-semibold">
        Your {siteConfig.name} account
      </h1>
      <p className="max-w-xl text-sm text-muted-foreground">
        Your session was validated by the Convex Better Auth server before this
        page rendered.
      </p>
    </div>
  )
}
