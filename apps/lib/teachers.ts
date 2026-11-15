/**
 * Data dan helper filter daftar guru untuk Pengaturan Wali Kelas & Tanggal Dokumen
 * Sumber data: SiPAKSa (Sistem Informasi Pengasuhan dan Akademik Santri)
 *
 * Kriteria filter:
 * 1. Jenjang: SMP, SMA, MTA (SMPITA, SMAITA, MTA)
 * 2. Musyrif: Tidak dimasukkan
 * 3. Guru tahfizh murni: Tidak dimasukkan
 * 4. Guru kelas yang merangkap tahfizh: Dimasukkan
 * 5. Staff TU / Super Admin / Penguji coba: Tidak dimasukkan
 */

export interface Teacher {
  id: string
  name: string
  institution: string
  role?: string
  position?: string
  niy?: string
}

// Database default guru SMP/SMA/MTA terverifikasi
export const DEFAULT_TEACHERS: Teacher[] = [
  {
    id: "guru_002",
    name: "Adi Saputra, S.H.",
    institution: "SMPITA",
    role: "wali_kelas",
    position: "Wali Kelas",
  },
  {
    id: "-OviMmtMX5S8jhpPpHw0",
    name: "Afifah Nafila",
    institution: "SMAITA",
    role: "guru",
    position: "Guru",
  },
  {
    id: "-OzuTYFTK9h7QDQ_Fvok",
    name: "Ahmad Reihan, S.Pd.",
    institution: "SMAITA",
    role: "wali_kelas",
    position: "Wali Kelas",
  },
  {
    id: "guru_019",
    name: "Andhika Nayottama, S.Pd.",
    institution: "SMAITA",
    role: "wali_kelas",
    position: "Wali Kelas",
  },
  {
    id: "-OqsQN8jM_kZDxR4bxtt",
    name: "Aulia Aprillia, S.Pd.",
    institution: "SMAITA",
    role: "guru",
    position: "Guru Mupel SMA",
  },
  {
    id: "-OqsU3mu1gUq-ZXDwQb_",
    name: "Ayu Ratnapury, M.Pd.",
    institution: "SMPITA",
    role: "wali_kelas",
    position: "Wali Kelas",
  },
  {
    id: "guru_021",
    name: "Delly Arhadath, S.Pd.",
    institution: "SMAITA",
    role: "kepala_sekolah",
    position: "Kepala Sekolah",
    niy: "200001120120231160",
  },
  {
    id: "guru_018",
    name: "Dika Putra Jaya, S.Pd.",
    institution: "SMAITA",
    role: "wali_kelas",
    position: "Wali Kelas",
  },
  {
    id: "-OqiRvJ0pxDxfygWq7N8",
    name: "Harziki, A.Md.T.",
    institution: "MTA",
    role: "wali_kelas",
    position: "Wali Kelas",
  },
  {
    id: "-OqwnCCDgOmAwpOLEH0q",
    name: "Hendy Sumpeno, S.T",
    institution: "SMPITA",
    role: "wali_kelas",
    position: "Wali Kelas",
  },
  {
    id: "ustadzah_004",
    name: "Hevi Ratna Sari, S.Si.",
    institution: "SMPITA",
    role: "wali_kelas",
    position: "Wali Kelas",
  },
  {
    id: "05cdd823-9ef3-44f9-98d4-39a180862e50",
    name: "Ilman Syamsari, Lc.",
    institution: "SMPITA",
    role: "guru",
    position: "Guru",
  },
  {
    id: "-OqsU3mt7XTTjIYw49kZ",
    name: "Ipikasari, M.Pd.",
    institution: "SMPITA",
    role: "wali_kelas",
    position: "Wali Kelas",
  },
  {
    id: "guru_017",
    name: "Julius Adi Putra, S.Pd.",
    institution: "SMAITA",
    role: "wali_kelas",
    position: "Wali Kelas",
  },
  {
    id: "guru_003",
    name: "Muhammad Yasser, S.Pd.",
    institution: "SMPITA",
    role: "wali_kelas",
    position: "Guru Kelas / Kepala Sekolah",
    niy: "199512310120191027",
  },
  {
    id: "guru_001",
    name: "Meditoma, S.Pd.",
    institution: "SMPITA",
    role: "kepala_sekolah",
    position: "Kepala Sekolah",
    niy: "199405220720181024",
  },
  {
    id: "guru_015",
    name: "Muhammad Naufal Hudiya",
    institution: "MTA",
    role: "wali_kelas",
    position: "Wali Kelas",
  },
  {
    id: "34d949f7-22f1-4a64-ae88-3cbc5c8c26d5",
    name: "Muhlis Annas, S.Pd.",
    institution: "SMPITA",
    role: "wali_kelas",
    position: "Wali Kelas",
  },
  {
    id: "-OqsPzrmrWJwVsGp9v4E",
    name: "Nada Shofiyah, S.Pd.",
    institution: "SMAITA",
    role: "wali_kelas",
    position: "Wali Kelas",
  },
  {
    id: "54c743da-6266-4a05-baa5-6026d1c15a63",
    name: "Nayatullah, Lc.",
    institution: "MTA",
    role: "guru",
    position: "Guru Mupel SMA",
  },
  {
    id: "-OqsPzrmrWJwVsGp9v4L",
    name: "Nurrahma Firmania, S.Pd.I",
    institution: "SMPITA",
    role: "wali_kelas",
    position: "Wali Kelas",
  },
  {
    id: "2297a522-528b-438f-9076-1fc8bcca299b",
    name: "Nurul Khairina",
    institution: "SMPITA",
    role: "guru",
    position: "Guru Mupel SMP",
  },
  {
    id: "-Oxho7MiL6AMLrEUXUVC",
    name: "Randhy Raviza, S.Pd.",
    institution: "SMPITA",
    role: "wali_kelas",
    position: "Wali Kelas",
    niy: "199507180720181019",
  },
  {
    id: "guru_005",
    name: "Riko",
    institution: "SMPITA",
    role: "wali_kelas",
    position: "Wali Kelas",
    niy: "200109290320231159",
  },
  {
    id: "5eba5ef4-ceb2-42e7-a5f0-eb21c52ebe2b",
    name: "Sufian",
    institution: "SMPITA",
    role: "guru",
    position: "Guru Ahli-2",
  },
  {
    id: "guru_007",
    name: "Yogi Satriadi, S.Pd.I.",
    institution: "SMPITA",
    role: "guru",
    position: "Guru Mupel SMP",
  },
  {
    id: "-P1m7afBPd8I9T1r_h3v",
    name: "Zulkipli, S.Pd.",
    institution: "SMPITA",
    role: "guru",
    position: "Guru",
  },
]

export function filterTeachers(staffList: any[], adminUsers: any[] = []): Teacher[] {
  if (!Array.isArray(staffList)) return DEFAULT_TEACHERS

  const adminNiyMap = new Map<string, string>()
  if (Array.isArray(adminUsers)) {
    adminUsers.forEach((u: any) => {
      const niyVal = (u.niy || u.nip || "").trim()
      if (niyVal && niyVal !== "-") {
        if (u.email) adminNiyMap.set(u.email.toLowerCase().trim(), niyVal)
        if (u.name) adminNiyMap.set(u.name.toLowerCase().trim(), niyVal)
      }
    })
  }

  const filtered = staffList.filter((s) => {
    if (s.status && s.status !== "aktif") return false
    const name = (s.name || "").trim()
    if (!name) return false
    const lowerName = name.toLowerCase()
    if (lowerName.includes("tes ") || lowerName.includes("serambi")) return false

    const inst = (s.institution || "").toUpperCase()
    const isTargetInst = inst.includes("SMP") || inst.includes("SMA") || inst.includes("MTA")
    if (!isTargetInst) return false

    // Musyrif tidak perlu dimasukkan
    const role = (s.role || "").toLowerCase()
    const pos = (s.position || "").toLowerCase()
    const isMusyrif = role === "musyrif" || pos.includes("musyrif")
    if (isMusyrif) return false

    // TU / Staff admin tidak perlu dimasukkan
    const isTuOrAdmin =
      role === "tu" ||
      role === "super_admin" ||
      pos.includes("tu") ||
      pos.includes("admin") ||
      pos.includes("cleaning") ||
      pos.includes("bendahara")
    if (isTuOrAdmin) return false

    // Guru tahfizh murni tidak perlu, tapi guru kelas yang merangkap tahfizh dimasukkan
    const isTahfizh = role === "guru_tahfidz" || pos.includes("tahfizh") || pos.includes("tahfidz")
    const isGuruKelas =
      role === "wali_kelas" ||
      pos.includes("wali kelas") ||
      Boolean(s.assignedClass)

    if (isTahfizh && !isGuruKelas) {
      return false
    }

    return true
  })

  if (filtered.length === 0) return DEFAULT_TEACHERS

  return filtered.map((s) => {
    let name = s.name.trim()
    if (name === "M. Yasser A.P., S.Pd.") {
      name = "Muhammad Yasser, S.Pd."
    }

    const emailKey = (s.email || "").toLowerCase().trim()
    const nameKey = name.toLowerCase().trim()
    let niy =
      s.niy ||
      s.nip ||
      (emailKey ? adminNiyMap.get(emailKey) : undefined) ||
      adminNiyMap.get(nameKey)

    if (!niy || niy === "-") {
      if (name.includes("Yasser")) niy = "199512310120191027"
      else if (name.includes("Meditoma")) niy = "199405220720181024"
      else if (name.includes("Randhy")) niy = "199507180720181019"
      else if (name.includes("Delly Arhadath")) niy = "200001120120231160"
      else if (name.toLowerCase().includes("riko")) niy = "200109290320231159"
    }

    return {
      id: s.id || name,
      name,
      institution: s.institution || "SMPITA",
      role: s.role,
      position: s.position,
      niy,
    }
  }).sort((a, b) => a.name.localeCompare(b.name))
}

export async function fetchTeachersFromSipaksa(): Promise<Teacher[]> {
  try {
    // Di browser klien, panggil proxy route internal untuk menghindari CORS error
    const isBrowser = typeof window !== "undefined"
    if (isBrowser) {
      const res = await fetch("/api/sipaksa/staff").catch(() => null)
      if (res && res.ok) {
        const json = await res.json().catch(() => null)
        if (json?.data && Array.isArray(json.data) && json.data.length > 0) {
          return json.data
        }
      }
    } else {
      const [staffRes, adminRes] = await Promise.all([
        fetch("https://sipaksa.azaseradigital.workers.dev/api/staff").catch(() => null),
        fetch("https://sipaksa.azaseradigital.workers.dev/api/admin-users").catch(() => null),
      ])

      if (staffRes && staffRes.ok) {
        const json = await staffRes.json().catch(() => null)
        const staff = json?.data || (Array.isArray(json) ? json : [])
        let adminUsers: any[] = []
        if (adminRes && adminRes.ok) {
          const adminJson = await adminRes.json().catch(() => null)
          adminUsers = adminJson?.data || []
        }
        const filtered = filterTeachers(staff, adminUsers)
        if (filtered.length > 0) return filtered
      }
    }
  } catch (err) {
    // Fallback ke daftar guru default jika jaringan bermasalah
  }
  return DEFAULT_TEACHERS
}

export interface ClassroomItem {
  id: string
  name: string
  level?: string
  institutionId?: string
  academicYearId?: string
  capacity?: number
  teacherId?: string | null
  teacherName?: string | null
}

export const DEFAULT_CLASSROOM_MAP: Record<string, { teacherName: string; niy?: string }> = {
  "7A": { teacherName: "Riko", niy: "200109290320231159" },
  "7B": { teacherName: "Randhy Raviza, S.Pd.", niy: "199507180720181019" },
  "7C": { teacherName: "Ayu Ratnapury, M.Pd." },
  "8A": { teacherName: "Hendy Sumpeno, S.T" },
  "8B": { teacherName: "Adi Saputra, S.H." },
  "8C": { teacherName: "Ipikasari, M.Pd." },
  "8D": { teacherName: "Nurrahma Firmania, S.Pd.I" },
  "9A": { teacherName: "Muhammad Yasser, S.Pd.", niy: "199512310120191027" },
  "9B": { teacherName: "Muhlis Annas, S.Pd." },
  "9C": { teacherName: "Hevi Ratna Sari, S.Si." },
  "10A": { teacherName: "Ahmad Reihan, S.Pd." },
}

export function normalizeClassName(className: string): string {
  if (!className) return ""
  let norm = className.trim().toUpperCase()
  norm = norm
    .replace(/^XII\s*/, "12")
    .replace(/^XI\s*/, "11")
    .replace(/^X\s*/, "10")
    .replace(/^IX\s*/, "9")
    .replace(/^VIII\s*/, "8")
    .replace(/^VII\s*/, "7")
  return norm.replace(/\s+/g, "")
}

export async function fetchClassroomsFromSipaksa(): Promise<ClassroomItem[]> {
  try {
    const isBrowser = typeof window !== "undefined"
    if (isBrowser) {
      const res = await fetch("/api/sipaksa/classrooms").catch(() => null)
      if (res && res.ok) {
        const json = await res.json().catch(() => null)
        const data = json?.data || (Array.isArray(json) ? json : [])
        if (data.length > 0) return data
      }
    } else {
      const res = await fetch("https://sipaksa.azaseradigital.workers.dev/api/classrooms").catch(() => null)
      if (res && res.ok) {
        const json = await res.json().catch(() => null)
        const data = json?.data || (Array.isArray(json) ? json : [])
        if (data.length > 0) return data
      }
    }
  } catch (err) {
    // Fallback jika offline / jaringan gangguan
  }
  return []
}

export function getTeacherForClass(
  className: string,
  classrooms: ClassroomItem[] = [],
  teachersList: Teacher[] = DEFAULT_TEACHERS
): { name: string; niy: string } | null {
  if (!className) return null
  const normTarget = normalizeClassName(className)

  // 1. Cek dari classrooms live SiPAKSa terlebih dahulu
  if (classrooms && classrooms.length > 0) {
    const matchCr = classrooms.find(
      (c) =>
        normalizeClassName(c.name) === normTarget &&
        c.teacherName &&
        c.teacherName !== "Belum Ditentukan"
    )

    if (matchCr && matchCr.teacherName) {
      // Cari nama lengkap dan NIY dari teachersList
      const teacher = teachersList.find((t) => {
        if (matchCr.teacherId && t.id === matchCr.teacherId) return true
        const tClean = t.name.toLowerCase().replace(/[^a-z]/g, "")
        const crClean = matchCr.teacherName!.toLowerCase().replace(/[^a-z]/g, "")
        return tClean.includes(crClean) || crClean.includes(tClean)
      })

      if (teacher) {
        return { name: teacher.name, niy: teacher.niy && teacher.niy !== "-" ? teacher.niy : "" }
      }
      return { name: matchCr.teacherName, niy: "" }
    }
  }

  // 2. Cek dari pemetaan default jika belum ada di data classrooms live
  const defaultEntry = DEFAULT_CLASSROOM_MAP[normTarget]
  if (defaultEntry) {
    const teacher = teachersList.find((t) => t.name === defaultEntry.teacherName)
    const niyVal = defaultEntry.niy || teacher?.niy || ""
    return {
      name: defaultEntry.teacherName,
      niy: niyVal !== "-" ? niyVal : "",
    }
  }

  return null
}
