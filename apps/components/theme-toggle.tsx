"use client"

import * as React from "react"
import { MoonIcon, SunIcon } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const mounted = React.useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
  const { resolvedTheme, setTheme } = useTheme()

  const isDark = resolvedTheme === "dark"
  const label = mounted
    ? `Switch to ${isDark ? "light" : "dark"} theme`
    : "Theme control loading"

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      title={label}
      disabled={!mounted}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {mounted ? (
        isDark ? (
          <SunIcon aria-hidden="true" />
        ) : (
          <MoonIcon aria-hidden="true" />
        )
      ) : (
        <span aria-hidden="true" className="size-4" />
      )}
    </Button>
  )
}
