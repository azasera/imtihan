import assert from "node:assert/strict"
import test, { describe } from "node:test"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const {
  decodeJwtPayload,
  deriveSsoPassword,
  verifySipaksaTokenClaims,
} = (await import(
  new URL("../lib/sipaksa-sso.ts", import.meta.url).href
)) as typeof import("../lib/sipaksa-sso")

// Helper pembuat token mock JWT untuk pengujian unit
function createMockJwt(header: object, payload: object, signature = "mockSignature"): string {
  const encHeader = Buffer.from(JSON.stringify(header)).toString("base64url")
  const encPayload = Buffer.from(JSON.stringify(payload)).toString("base64url")
  return `${encHeader}.${encPayload}.${signature}`
}

describe("Verifikasi Tiket SSO SiPAKSa", () => {
  const validPayload = {
    iss: "https://securetoken.google.com/sipaksa-icentre-874ee",
    aud: "sipaksa-icentre-874ee",
    sub: "user-sipaksa-123",
    user_id: "user-sipaksa-123",
    email: "ustadz.ahmad@example.com",
    name: "Ustadz Ahmad",
    exp: Math.floor(Date.now() / 1000) + 3600,
  }

  test("mendekode payload token JWT dengan benar", () => {
    const token = createMockJwt({ alg: "RS256" }, validPayload)
    const decoded = decodeJwtPayload(token)
    assert.ok(decoded)
    assert.equal(decoded.sub, "user-sipaksa-123")
    assert.equal(decoded.email, "ustadz.ahmad@example.com")
  })

  test("lolos verifikasi klaim untuk token sah dari SiPAKSa", () => {
    const token = createMockJwt({ alg: "RS256" }, validPayload)
    const result = verifySipaksaTokenClaims(
      token,
      "user-sipaksa-123",
      "ustadz.ahmad@example.com"
    )
    assert.equal(result.valid, true)
    assert.equal(result.payload?.email, "ustadz.ahmad@example.com")
  })

  test("menolak token yang telah kedaluwarsa", () => {
    const expiredPayload = {
      ...validPayload,
      exp: Math.floor(Date.now() / 1000) - 100, // sudah lewat
    }
    const token = createMockJwt({ alg: "RS256" }, expiredPayload)
    const result = verifySipaksaTokenClaims(token)
    assert.equal(result.valid, false)
    assert.match(result.error ?? "", /kedaluwarsa/i)
  })

  test("menolak token dengan project audience asing", () => {
    const foreignPayload = {
      ...validPayload,
      aud: "project-orang-asing-999",
    }
    const token = createMockJwt({ alg: "RS256" }, foreignPayload)
    const result = verifySipaksaTokenClaims(token)
    assert.equal(result.valid, false)
    assert.match(result.error ?? "", /audience.*tidak diizinkan/i)
  })

  test("menolak token dengan issuer palsu", () => {
    const untrustedIssuer = {
      ...validPayload,
      iss: "https://evil-server.attacker.com",
    }
    const token = createMockJwt({ alg: "RS256" }, untrustedIssuer)
    const result = verifySipaksaTokenClaims(token)
    assert.equal(result.valid, false)
    assert.match(result.error ?? "", /bukan layanan autentikasi resmi/i)
  })

  test("menolak token jika UID tidak sesuai dengan parameter", () => {
    const token = createMockJwt({ alg: "RS256" }, validPayload)
    const result = verifySipaksaTokenClaims(
      token,
      "different-uid-456",
      "ustadz.ahmad@example.com"
    )
    assert.equal(result.valid, false)
    assert.match(result.error ?? "", /tidak cocok/i)
  })

  test("menolak token jika email tidak sesuai dengan parameter", () => {
    const token = createMockJwt({ alg: "RS256" }, validPayload)
    const result = verifySipaksaTokenClaims(
      token,
      "user-sipaksa-123",
      "hacker@evil.com"
    )
    assert.equal(result.valid, false)
    assert.match(result.error ?? "", /email.*tidak cocok/i)
  })

  test("menolak token yang tidak berbentuk 3 bagian JWT", () => {
    const result = verifySipaksaTokenClaims("invalid-token-string")
    assert.equal(result.valid, false)
    assert.match(result.error ?? "", /harus 3 bagian/i)
  })
})

describe("Derivasi Kredensial Deterministik SSO", () => {
  const secret = "rahasia-uji-sipaksa-sso-2026"

  test("menghasilkan hash 64 karakter heksadesimal deterministik", () => {
    const pass1 = deriveSsoPassword("uid-123", "guru@example.com", secret)
    const pass2 = deriveSsoPassword("uid-123", "guru@example.com", secret)
    assert.equal(pass1.length, 64)
    assert.equal(pass1, pass2)
  })

  test("menghasilkan nilai identik terlepas dari huruf kapital pada email", () => {
    const pass1 = deriveSsoPassword("uid-123", "Guru@Example.COM", secret)
    const pass2 = deriveSsoPassword("uid-123", "guru@example.com", secret)
    assert.equal(pass1, pass2)
  })

  test("menghasilkan nilai berbeda untuk user atau secret berbeda", () => {
    const pass1 = deriveSsoPassword("uid-123", "guru@example.com", secret)
    const pass2 = deriveSsoPassword("uid-456", "guru@example.com", secret)
    const pass3 = deriveSsoPassword("uid-123", "guru@example.com", "secret-lain")
    assert.notEqual(pass1, pass2)
    assert.notEqual(pass1, pass3)
  })

  test("melempar kesalahan bila argumen wajib kosong", () => {
    assert.throws(() => deriveSsoPassword("", "email", secret))
    assert.throws(() => deriveSsoPassword("uid", "", secret))
    assert.throws(() => deriveSsoPassword("uid", "email", ""))
  })
})

describe("Integritas UI & Penutupan Registrasi Mandiri", () => {
  test("halaman signup telah menutup form pendaftaran bebas dan memuat edukasi SiPAKSa", () => {
    const signupPath = path.resolve(__dirname, "..", "app", "signup", "page.tsx")
    const content = fs.readFileSync(signupPath, "utf-8")

    assert.ok(
      content.includes("Pendaftaran Mandiri Ditutup"),
      "Halaman signup harus menyatakan pendaftaran ditutup"
    )
    assert.ok(
      !content.includes('mode="signup"'),
      "Halaman signup tidak boleh lagi merender AuthForm dalam mode signup terbuka"
    )
    assert.ok(
      content.includes("SiPAKSa iCentre"),
      "Halaman signup harus mengarahkan ke portal resmi SiPAKSa"
    )
  })

  test("halaman sso receiver tersedia dan mengecek parameter tiket serta menangani sinkronisasi akun", () => {
    const ssoPath = path.resolve(__dirname, "..", "app", "sso", "page.tsx")
    assert.ok(fs.existsSync(ssoPath), "Berkas apps/app/sso/page.tsx harus ada")

    const content = fs.readFileSync(ssoPath, "utf-8")
    assert.ok(content.includes("handoffToken"))
    assert.ok(content.includes("handoffUid"))
    assert.ok(content.includes("handoffEmail"))
    assert.ok(content.includes("/api/auth/sipaksa"))
    assert.ok(content.includes("linking"))
    assert.ok(content.includes("handleLinkExistingAccount"))
    assert.ok(content.includes("changePassword"))
  })

  test("SiteHeader tidak lagi mengarahkan tamu ke form Start Creating", () => {
    const headerPath = path.resolve(__dirname, "..", "components", "site-header.tsx")
    const content = fs.readFileSync(headerPath, "utf-8")

    assert.ok(
      !content.includes("Start Creating"),
      "SiteHeader tidak boleh lagi memiliki tombol Start Creating bebas"
    )
    assert.ok(
      !content.includes('href="/signup"'),
      "SiteHeader navigasi tamu tidak boleh menautkan /signup langsung"
    )
  })

  test("bebas kebocoran emoji dan kode spesifikasi teknis", () => {
    const filesToCheck = [
      path.resolve(__dirname, "..", "app", "signup", "page.tsx"),
      path.resolve(__dirname, "..", "app", "login", "page.tsx"),
      path.resolve(__dirname, "..", "app", "sso", "page.tsx"),
      path.resolve(__dirname, "..", "lib", "sipaksa-sso.ts"),
    ]

    const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u
    const specCodeRegex = /\b(SCR-\w+|TASK-\w+|Fase\s+\d+|[A-Z]+-FR-\d+|[A-Z]+-AC-\d+)\b/

    for (const file of filesToCheck) {
      const text = fs.readFileSync(file, "utf-8")
      assert.ok(!emojiRegex.test(text), `Berkas ${path.basename(file)} tidak boleh memuat emoji`)
      assert.ok(!specCodeRegex.test(text), `Berkas ${path.basename(file)} tidak boleh bocor kode spesifikasi`)
    }
  })
})
