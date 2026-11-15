import { NextResponse } from "next/server"
import { filterTeachers, DEFAULT_TEACHERS } from "@/lib/teachers"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const [staffRes, adminRes] = await Promise.all([
      fetch("https://sipaksa.azaseradigital.workers.dev/api/staff", {
        headers: { Accept: "application/json" },
        next: { revalidate: 300 },
      }).catch(() => null),
      fetch("https://sipaksa.azaseradigital.workers.dev/api/admin-users", {
        headers: { Accept: "application/json" },
        next: { revalidate: 300 },
      }).catch(() => null),
    ])

    if (!staffRes || !staffRes.ok) {
      return NextResponse.json({ success: true, data: DEFAULT_TEACHERS })
    }

    const staffJson = await staffRes.json().catch(() => null)
    const staff = staffJson?.data || (Array.isArray(staffJson) ? staffJson : [])

    let adminUsers: unknown[] = []
    if (adminRes && adminRes.ok) {
      const adminJson = await adminRes.json().catch(() => null)
      adminUsers = adminJson?.data || []
    }

    const filtered = filterTeachers(staff, adminUsers as any[])
    return NextResponse.json({
      success: true,
      data: filtered.length > 0 ? filtered : DEFAULT_TEACHERS,
    })
  } catch {
    return NextResponse.json({ success: true, data: DEFAULT_TEACHERS })
  }
}
