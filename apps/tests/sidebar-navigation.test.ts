import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const APPS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function read(relative: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relative), "utf-8")
}

describe("Pembersihan dan kelengkapan navigasi sidebar", () => {
  it("sidebar memuat rute navigasi utama yang lengkap dan valid", () => {
    const source = read("components/app-sidebar.tsx")

    const expectedRoutes = [
      { title: "Dashboard", url: "/" },
      { title: "Bank Soal", url: "/bank-soal" },
      { title: "Mata Pelajaran", url: "/mata-pelajaran" },
      { title: "Sesi Ujian", url: "/sesi-ujian" },
      { title: "Monitoring Sesi", url: "/monitoring-sesi" },
      { title: "Rekap Nilai", url: "/rekap-nilai" },
      { title: "Data Santri", url: "/santri" },
      { title: "Ruang Ujian Santri", url: "/ujian" },
    ]

    for (const item of expectedRoutes) {
      assert.ok(
        source.includes(`title: "${item.title}"`),
        `Sidebar harus memuat menu ${item.title}`
      )
      assert.ok(
        source.includes(`url: "${item.url}"`),
        `Sidebar harus memuat rute ${item.url}`
      )
    }
  })

  it("sidebar tidak lagi memuat tautan mati atau placeholder hash", () => {
    const sidebarSource = read("components/app-sidebar.tsx")
    const navSecondarySource = read("components/nav-secondary.tsx")
    const navUserSource = read("components/nav-user.tsx")

    assert.ok(
      !sidebarSource.includes('url: "#"'),
      "app-sidebar.tsx tidak boleh memuat url: #"
    )
    assert.ok(
      !sidebarSource.includes('href="#"'),
      "app-sidebar.tsx tidak boleh memuat href=#"
    )
    assert.ok(
      !navSecondarySource.includes('href="#"'),
      "nav-secondary.tsx tidak boleh memuat href=#"
    )
    assert.ok(
      !navUserSource.includes('href="#"'),
      "nav-user.tsx tidak boleh memuat href=#"
    )
  })

  it("sidebar tidak lagi merender grup NavDocuments yang menduplikasi menu", () => {
    const source = read("components/app-sidebar.tsx")

    assert.ok(
      !source.includes("<NavDocuments"),
      "Sidebar tidak boleh merender komponen NavDocuments duplikat"
    )
    assert.ok(
      !source.includes("import { NavDocuments }"),
      "Sidebar tidak boleh mengimpor NavDocuments"
    )
  })

  it("logo brand mengarahkan ke beranda Dashboard", () => {
    const source = read("components/app-sidebar.tsx")

    assert.ok(
      source.includes('render={<Link href="/" />}'),
      "Logo brand harus menautkan ke /"
    )
    assert.ok(
      source.includes("Pesantren Islamic Centre At-Tauhid"),
      "Sidebar harus menampilkan teks Pesantren Islamic Centre At-Tauhid"
    )
    assert.ok(
      !source.includes("Pesantren & Madrasah"),
      "Sidebar tidak boleh lagi menampilkan teks Pesantren & Madrasah"
    )
  })

  it("navigasi sekunder dan dropdown pengguna terhubung ke halaman pengaturan akun", () => {
    const sidebarSource = read("components/app-sidebar.tsx")
    const navUserSource = read("components/nav-user.tsx")

    assert.ok(
      sidebarSource.includes('url: "/account"'),
      "Navigasi sekunder harus memiliki tautan ke /account"
    )
    assert.ok(
      navUserSource.includes('render={<Link href="/account" />}'),
      "Dropdown NavUser harus menautkan ke /account"
    )
    assert.ok(
      !navUserSource.includes("Billing"),
      "Dropdown NavUser tidak boleh memuat item Billing yang tidak relevan"
    )
    assert.ok(
      !navUserSource.includes("Notifications"),
      "Dropdown NavUser tidak boleh memuat item Notifications dummy"
    )
  })
})
