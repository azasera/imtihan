import { redirect } from "next/navigation"

import { isAuthenticated } from "@/lib/auth-server"
import { AccountProfileView } from "./AccountProfileView"

export default async function AccountPage() {
  if (!(await isAuthenticated())) {
    redirect("/login")
  }

  return <AccountProfileView />
}
