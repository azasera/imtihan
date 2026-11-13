import crypto from "crypto"

export interface SipaksaTokenPayload {
  iss?: string
  aud?: string
  exp?: number
  sub?: string
  user_id?: string
  email?: string
  name?: string
  [key: string]: unknown
}

export interface VerifyResult {
  valid: boolean
  error?: string
  payload?: SipaksaTokenPayload
}

const ALLOWED_PROJECT_IDS = new Set(["sipaksa-icentre-874ee", "icentre-attauhid"])

/**
 * Mendekode payload JWT tanpa verifikasi kriptografis lokal.
 */
export function decodeJwtPayload(token: string): SipaksaTokenPayload | null {
  if (!token || typeof token !== "string") return null
  const parts = token.split(".")
  if (parts.length < 2) return null

  try {
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/")
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4)
    const json = Buffer.from(padded, "base64").toString("utf8")
    return JSON.parse(json) as SipaksaTokenPayload
  } catch {
    return null
  }
}

/**
 * Memvalidasi klaim standar Firebase ID Token dari SiPAKSa.
 */
export function verifySipaksaTokenClaims(
  token: string,
  expectedUid?: string,
  expectedEmail?: string,
  nowTimestampSeconds = Math.floor(Date.now() / 1000)
): VerifyResult {
  if (!token || typeof token !== "string") {
    return { valid: false, error: "Token tidak tersedia atau bukan string yang valid." }
  }

  const parts = token.split(".")
  if (parts.length !== 3) {
    return { valid: false, error: "Format token tidak valid (harus 3 bagian JWT)." }
  }

  const payload = decodeJwtPayload(token)
  if (!payload) {
    return { valid: false, error: "Gagal membaca isi payload token." }
  }

  // 1. Validasi Audience
  const aud = String(payload.aud || "")
  if (!ALLOWED_PROJECT_IDS.has(aud)) {
    return {
      valid: false,
      error: `Project audience (${aud || "kosong"}) tidak diizinkan.`,
    }
  }

  // 2. Validasi Issuer
  const iss = String(payload.iss || "")
  const isFirebaseIssuer =
    iss.includes("securetoken.google.com") ||
    iss.includes("identitytoolkit.googleapis.com")
  if (!isFirebaseIssuer) {
    return {
      valid: false,
      error: "Penerbit token (issuer) bukan layanan autentikasi resmi.",
    }
  }

  // 3. Validasi Masa Berlaku (dengan clock skew 60 detik)
  const exp = typeof payload.exp === "number" ? payload.exp : 0
  if (exp + 60 < nowTimestampSeconds) {
    return {
      valid: false,
      error: "Tiket autentikasi SiPAKSa telah kedaluwarsa. Silakan buka kembali dari SiPAKSa.",
    }
  }

  // 4. Validasi UID (sub / user_id)
  const uid = String(payload.sub || payload.user_id || "")
  if (!uid) {
    return { valid: false, error: "Token tidak memuat identitas pengguna (UID)." }
  }

  if (expectedUid && uid !== expectedUid) {
    return {
      valid: false,
      error: "Identitas pengguna (UID) tidak cocok dengan parameter sesi.",
    }
  }

  // 5. Validasi Email
  const email = String(payload.email || "").trim().toLowerCase()
  if (!email) {
    return { valid: false, error: "Token tidak memuat alamat email pengguna." }
  }

  if (expectedEmail && email !== expectedEmail.trim().toLowerCase()) {
    return {
      valid: false,
      error: "Alamat email token tidak cocok dengan parameter sesi.",
    }
  }

  return { valid: true, payload }
}

/**
 * Menghasilkan kata sandi deterministik berbasis HMAC rahasia server
 * sehingga ustadz/guru dari SiPAKSa memiliki sesi Better Auth yang stabil
 * tanpa pernah perlu mengetahui atau mengetik password secara manual.
 */
export function deriveSsoPassword(uid: string, email: string, secret: string): string {
  if (!uid || !email || !secret) {
    throw new Error("UID, email, dan server secret wajib disediakan untuk derivasi akun.")
  }
  const normalizedEmail = email.trim().toLowerCase()
  return crypto
    .createHmac("sha256", secret)
    .update(`${uid}:${normalizedEmail}`)
    .digest("hex")
}
