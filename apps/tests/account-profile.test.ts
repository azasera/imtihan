import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const APPS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function read(relative: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relative), "utf-8")
}

describe("Tampilan Nama dan Profil Guru di Pengaturan Akun", () => {
  it("halaman account page mengecek autentikasi server dan merender AccountProfileView", () => {
    const pageSource = read("app/(main)/account/page.tsx")

    assert.ok(
      pageSource.includes("isAuthenticated()"),
      "account/page.tsx harus memeriksa isAuthenticated()"
    )
    assert.ok(
      pageSource.includes("AccountProfileView"),
      "account/page.tsx harus merender AccountProfileView"
    )
  })

  it("AccountProfileView memuat nama guru, avatar, dan data akun pengajar", () => {
    const viewSource = read("app/(main)/account/AccountProfileView.tsx")

    assert.ok(
      viewSource.includes("teacherName"),
      "AccountProfileView harus mendefinisikan teacherName"
    )
    assert.ok(
      viewSource.includes('data-testid="teacher-name"'),
      "AccountProfileView harus memiliki atribut data-testid teacher-name"
    )
    assert.ok(
      viewSource.includes("Pengajar / Asatidz"),
      "AccountProfileView harus menyertakan label peran Pengajar / Asatidz"
    )
    assert.ok(
      viewSource.includes("authClient.useSession()"),
      "AccountProfileView harus membaca sesi dari authClient"
    )
    assert.ok(
      viewSource.includes("Pesantren Islamic Centre At-Tauhid"),
      "AccountProfileView harus menampilkan nama lembaga pesantren resmi"
    )
  })

  it("AccountProfileView bebas dari emoji dan kebocoran kode spesifikasi teknis", () => {
    const viewSource = read("app/(main)/account/AccountProfileView.tsx")

    // Cek emoji
    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    assert.ok(
      !emojiRegex.test(viewSource),
      "AccountProfileView tidak boleh memuat emoji (gunakan Lucide icon)"
    )

    // Cek kebocoran kode teknis
    const techLeakRegex = /\b(SCR-[A-Z0-9\-]+|[A-Z]{2,10}-(FR|AC|NFR)-\d+|TASK-\d+|Fase\s+\d+)\b/g
    const matches = viewSource.match(techLeakRegex)
    assert.equal(
      matches,
      null,
      `AccountProfileView tidak boleh memuat kode teknis: ${matches?.join(", ")}`
    )
  })
})
