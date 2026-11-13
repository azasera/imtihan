import assert from "node:assert/strict"
import fs from "node:fs"
import path from "node:path"
import { describe, it } from "node:test"
import { fileURLToPath } from "node:url"

const APPS_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")

function read(relative: string): string {
  return fs.readFileSync(path.join(APPS_ROOT, relative), "utf-8")
}

// Base UI hanya merender label pada Select.Value dari prop `items` di root.
// Tanpa pemetaan itu, trigger menampilkan nilai mentah seperti ID dokumen.
const SELECT_SURFACES = [
  "app/(main)/sesi-ujian/page.tsx",
  "app/(main)/monitoring-sesi/page.tsx",
  "app/(main)/rekap-nilai/page.tsx",
  "app/(main)/bank-soal/page.tsx",
  "app/(main)/bank-soal/[id]/page.tsx",
  "components/sesi-ujian/session-continuation-dialog.tsx",
]

describe("Label Select pada permukaan aplikasi", () => {
  for (const surface of SELECT_SURFACES) {
    it(`${surface} memetakan items untuk setiap Select`, () => {
      const source = read(surface)
      const selectRoots = source.match(/<Select[\s>]/g) ?? []
      const itemMaps = source.match(/\bitems=/g) ?? []

      assert.ok(selectRoots.length > 0, "berkas harus memakai Select")
      assert.equal(
        itemMaps.length,
        selectRoots.length,
        "setiap Select root harus menerima prop items agar label tampil di trigger"
      )
    })
  }
})
