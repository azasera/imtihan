import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const res = await fetch("https://sipaksa.azaseradigital.workers.dev/api/classrooms", {
      headers: { Accept: "application/json" },
      next: { revalidate: 300 },
    }).catch(() => null)

    if (!res || !res.ok) {
      return NextResponse.json({ success: true, data: [] })
    }

    const json = await res.json().catch(() => null)
    const data = json?.data || (Array.isArray(json) ? json : [])
    return NextResponse.json({ success: true, data })
  } catch {
    return NextResponse.json({ success: true, data: [] })
  }
}
