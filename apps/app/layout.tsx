import type { Metadata } from "next"
import { Geist_Mono, Inter, JetBrains_Mono } from "next/font/google"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getToken } from "@/lib/auth-server"
import { siteConfig } from "@/lib/site-config"
import { cn } from "@/lib/utils"
import { ConvexClientProvider } from "./ConvexClientProvider"

const jetbrainsMonoHeading = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-heading",
})

const inter = Inter({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: siteConfig.name,
  description: siteConfig.description,
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const initialToken = await getToken()

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(
        "font-sans antialiased",
        fontMono.variable,
        inter.variable,
        jetbrainsMonoHeading.variable
      )}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "window.__name=window.__name||function(e,t){return Object.defineProperty(e,'name',{value:t,configurable:!0})};",
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <TooltipProvider>
            <ConvexClientProvider initialToken={initialToken}>
              {children}
            </ConvexClientProvider>
          </TooltipProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
