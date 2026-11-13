import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const APPS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function read(relative: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relative), "utf-8")
}

describe("Konfigurasi Autentikasi Convex & Better Auth (CORS dan Origin)", () => {
  it("auth.ts mengizinkan domain localhost dan IP lokal dalam trustedOrigins untuk mencegah 403 Forbidden", () => {
    const source = read("convex/auth.ts")

    assert.ok(
      source.includes("trustedOrigins: ["),
      "auth.ts harus mendefinisikan trustedOrigins"
    )
    assert.ok(
      source.includes('"http://localhost:3000"') ||
        source.includes('"http://localhost:*"'),
      "trustedOrigins harus mengizinkan http://localhost:3000"
    )
    assert.ok(
      source.includes('"http://127.0.0.1:3000"') ||
        source.includes('"http://127.0.0.1:*"'),
      "trustedOrigins harus mengizinkan http://127.0.0.1:3000"
    )
    assert.ok(
      source.includes('"https://e-imtihan.online"'),
      "trustedOrigins harus mengizinkan domain produksi e-imtihan.online"
    )
  })

  it("auth.ts mengaktifkan login email/password secara default saat tidak dimatikan eksplisit", () => {
    const source = read("convex/auth.ts")

    assert.match(
      source,
      /authEnv\.EMAIL_PASSWORD_AUTH_ENABLED\s*!==\s*["']false["']/,
      "emailAndPasswordEnabled harus default aktif (bukan strictly === 'true') agar tidak terkunci saat variabel env belum diset di backend"
    )
  })

  it("login page mengizinkan login email/password secara default saat tidak dimatikan eksplisit", () => {
    const source = read("app/login/page.tsx")

    assert.match(
      source,
      /process\.env\.NEXT_PUBLIC_EMAIL_PASSWORD_AUTH_ENABLED\s*!==\s*["']false["']/,
      "login page harus mengaktifkan credentialsEnabled secara default saat NEXT_PUBLIC_EMAIL_PASSWORD_AUTH_ENABLED belum diset false"
    )
  })
})
