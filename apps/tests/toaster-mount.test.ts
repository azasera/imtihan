import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const APPS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function read(relative: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relative), "utf-8")
}

// sonner hanya merender notifikasi bila komponen Toaster dipasang sekali.
// Tanpa pemasangan itu, setiap panggilan toast.* selesai tanpa jejak di layar.
describe("Pemasangan Toaster sonner", () => {
  it("root layout mengimpor Toaster dari komponen ui", () => {
    const source = read("app/layout.tsx")

    assert.match(
      source,
      /import\s*\{\s*Toaster\s*\}\s*from\s*"@\/components\/ui\/sonner"/
    )
  })

  it("root layout merender Toaster di dalam ThemeProvider", () => {
    const source = read("app/layout.tsx")
    const themeOpen = source.indexOf("<ThemeProvider>")
    const toaster = source.indexOf("<Toaster")
    const themeClose = source.indexOf("</ThemeProvider>")

    assert.ok(themeOpen >= 0, "root layout harus memakai ThemeProvider")
    assert.ok(toaster > themeOpen, "Toaster harus berada di dalam ThemeProvider")
    assert.ok(toaster < themeClose, "Toaster harus berada di dalam ThemeProvider")
  })

  it("komponen Toaster tetap mengekspor Toaster", () => {
    const source = read("components/ui/sonner.tsx")

    assert.match(source, /export\s*\{\s*Toaster\s*\}/)
  })
})
