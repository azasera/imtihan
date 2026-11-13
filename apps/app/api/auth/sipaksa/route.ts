import { NextResponse } from "next/server"
import { deriveSsoPassword, verifySipaksaTokenClaims } from "@/lib/sipaksa-sso"

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => null)) as {
      token?: string
      uid?: string
      email?: string
      name?: string
    } | null

    if (!body || !body.token || !body.uid || !body.email) {
      return NextResponse.json(
        {
          success: false,
          error: "Parameter tiket SiPAKSa tidak lengkap (token, uid, dan email wajib disertakan).",
        },
        { status: 400 }
      )
    }

    const verification = verifySipaksaTokenClaims(
      body.token,
      body.uid,
      body.email
    )

    if (!verification.valid || !verification.payload) {
      return NextResponse.json(
        {
          success: false,
          error:
            verification.error ||
            "Tiket autentikasi SiPAKSa tidak sah atau gagal diverifikasi.",
        },
        { status: 401 }
      )
    }

    const serverSecret =
      process.env.BETTER_AUTH_SECRET ||
      process.env.NEXT_PUBLIC_CONVEX_SITE_URL ||
      "sipaksa-e-imtihan-unified-auth-2026"

    const cleanEmail = String(verification.payload.email || body.email).trim().toLowerCase()
    const cleanName =
      String(verification.payload.name || body.name || "Ustadz/Pengajar SiPAKSa").trim()

    const credential = deriveSsoPassword(body.uid, cleanEmail, serverSecret)

    return NextResponse.json({
      success: true,
      email: cleanEmail,
      name: cleanName,
      credential,
    })
  } catch (error) {
    console.error("[sipaksa-sso] Gagal memproses penukaran sesi:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Terjadi gangguan saat memverifikasi sesi SiPAKSa. Silakan coba kembali.",
      },
      { status: 500 }
    )
  }
}
