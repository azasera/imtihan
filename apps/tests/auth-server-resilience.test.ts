import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const APPS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function read(relative: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relative), "utf-8")
}

describe("Resiliensi auth-server terhadap kegagalan jaringan & DNS Convex", () => {
  it("auth-server membungkus getToken dengan try-catch dan fallback aman", () => {
    const source = read("lib/auth-server.ts")

    assert.ok(
      source.includes("export const getToken = async"),
      "auth-server harus mengekspor wrapper getToken"
    )
    assert.match(
      source,
      /try\s*\{[\s\S]*auth\.getToken\(\)[\s\S]*\}\s*catch/,
      "getToken harus menangani kegagalan fetch/network dengan try-catch"
    )
    assert.match(
      source,
      /return\s+undefined/,
      "getToken harus mengembalikan undefined saat koneksi ke Convex gagal"
    )
  })

  it("auth-server membungkus isAuthenticated dengan try-catch dan fail-secure fallback", () => {
    const source = read("lib/auth-server.ts")

    assert.ok(
      source.includes("export const isAuthenticated = async"),
      "auth-server harus mengekspor wrapper isAuthenticated"
    )
    assert.match(
      source,
      /try\s*\{[\s\S]*auth\.isAuthenticated\(\)[\s\S]*\}\s*catch/,
      "isAuthenticated harus menangani kegagalan fetch/network dengan try-catch"
    )
    assert.match(
      source,
      /return\s+false/,
      "isAuthenticated harus mengembalikan false (fail-secure) saat koneksi ke Convex gagal"
    )
  })

  it("auth-server tetap meneruskan handler dan fungsi helper lainnya", () => {
    const source = read("lib/auth-server.ts")

    assert.match(source, /export\s+const\s+handler\s*=\s*auth\.handler/)
    assert.match(source, /export\s+const\s*\{[\s\S]*preloadAuthQuery[\s\S]*\}\s*=\s*auth/)
  })
})
