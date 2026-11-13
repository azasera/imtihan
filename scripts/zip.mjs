#!/usr/bin/env node

import { spawnSync } from "node:child_process"
import { cpSync, existsSync, rmSync, statSync } from "node:fs"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const openNextDir = path.join(root, "apps", ".open-next")
const distDir = path.join(root, "dist")
const zipFile = path.join(root, "dist.zip")

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function hasCommand(command, args = ["--version"]) {
  try {
    const res = spawnSync(command, args, { cwd: root, stdio: "ignore" })
    return res.status === 0
  } catch {
    return false
  }
}

export function createZip() {
  console.log("==> Memeriksa artefak build...")

  // 1. Validasi keberadaan folder build
  const hasOpenNext = existsSync(openNextDir)
  const hasDist = existsSync(distDir)

  if (!hasOpenNext && !hasDist) {
    console.error("\n❌ Error: Direktori artefak build tidak ditemukan!")
    console.error("   Harap jalankan build terlebih dahulu:")
    console.error("   > npm run build:worker   (untuk Cloudflare OpenNext)")
    console.error("   atau")
    console.error("   > npm run build          (untuk Next.js standar)\n")
    process.exit(1)
  }

  // 2. Jika apps/.open-next ada, sinkronkan ke dist/
  if (hasOpenNext) {
    console.log("==> Menyinkronkan apps/.open-next ke dist/...")
    cpSync(openNextDir, distDir, { recursive: true })
  }

  // 3. Hapus dist.zip lama jika ada
  if (existsSync(zipFile)) {
    rmSync(zipFile, { force: true })
  }

  console.log("==> Mengompresi isi folder dist/ menjadi dist.zip...")
  const startTime = Date.now()

  let success = false

  // Coba gunakan tar (native di Windows 10/11, Linux, macOS)
  if (hasCommand("tar")) {
    const tarResult = spawnSync("tar", ["-a", "-c", "-f", "dist.zip", "-C", "dist", "."], {
      cwd: root,
      stdio: "inherit",
    })
    if (tarResult.status === 0 && existsSync(zipFile)) {
      success = true
    }
  }

  // Fallback untuk Windows jika tar gagal: PowerShell Compress-Archive
  if (!success && process.platform === "win32") {
    console.log("==> Menggunakan fallback PowerShell Compress-Archive...")
    const psCmd = `Compress-Archive -Path "${distDir}\\*" -DestinationPath "${zipFile}" -Force`
    const psResult = spawnSync("powershell", ["-NoProfile", "-Command", psCmd], {
      cwd: root,
      stdio: "inherit",
    })
    if (psResult.status === 0 && existsSync(zipFile)) {
      success = true
    }
  }

  if (!success || !existsSync(zipFile)) {
    console.error("\n❌ Gagal membuat dist.zip. Pastikan utilitas zip/tar tersedia di sistem Anda.\n")
    process.exit(1)
  }

  const duration = ((Date.now() - startTime) / 1000).toFixed(2)
  const stats = statSync(zipFile)
  const formattedSize = formatBytes(stats.size)

  console.log("\n✅ Sukses membuat arsip build!")
  console.log(`   Berkas   : dist.zip`)
  console.log(`   Ukuran   : ${formattedSize}`)
  console.log(`   Lokasi   : ${zipFile}`)
  console.log(`   Waktu    : ${duration} detik`)
  console.log("   Arsip ini siap diunggah ke Cloudflare Pages / Workers atau hosting target.\n")
}

// Jalankan otomatis jika dipanggil langsung dari CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  createZip()
}
