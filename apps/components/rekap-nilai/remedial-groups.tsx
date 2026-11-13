import Link from "next/link"
import { ArrowUpRightIcon, BookOpenIcon, RepeatIcon } from "lucide-react"

import { type AnalysisGroupMember } from "@/lib/item-analysis"

function GroupList({
  members,
  emptyMessage,
}: {
  members: AnalysisGroupMember[]
  emptyMessage: string
}) {
  if (members.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <ul className="space-y-3">
      {members.map((member) => (
        <li key={member.participantId} className="space-y-1.5 border-b pb-3 last:border-0 last:pb-0">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <p className="text-sm font-medium">{member.studentName}</p>
              <p className="text-[11px] text-muted-foreground font-mono">
                {member.nisn}
                {member.className ? ` · ${member.className}` : ""}
              </p>
            </div>
            <p className="text-xs font-mono">
              Nilai {member.totalScore}
              {member.rawTotalScore > member.totalScore && (
                <span className="text-muted-foreground"> (sebelum batas {member.rawTotalScore})</span>
              )}
            </p>
          </div>

          {member.wrongQuestions.length === 0 ? (
            <p className="text-[11px] text-muted-foreground">Tidak ada butir yang salah.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[11px] text-muted-foreground">Butir perlu diulang:</span>
              {member.wrongQuestions.map((question) => (
                <Link
                  key={question.questionId}
                  href={`/rekap-nilai/koreksi/${member.participantId}#butir-${question.orderNumber}`}
                  aria-label={`Buka butir ${question.orderNumber} pada lembar koreksi ${member.studentName}`}
                  className="inline-flex items-center gap-0.5 rounded-md border px-1.5 py-0.5 text-[11px] font-mono hover:bg-muted"
                >
                  {question.orderNumber}
                  <ArrowUpRightIcon className="size-2.5" />
                </Link>
              ))}
            </div>
          )}
        </li>
      ))}
    </ul>
  )
}

export function RemedialGroups({
  remedial,
  enrichment,
  passingScore,
}: {
  remedial: AnalysisGroupMember[]
  enrichment: AnalysisGroupMember[]
  passingScore: number | null
}) {
  if (passingScore === null) {
    return (
      <div className="rounded-lg border p-4">
        <p className="text-sm font-medium">Kelompok tindak lanjut belum dapat disusun</p>
        <p className="text-xs text-muted-foreground mt-1">
          Isi batas nilai tuntas pada sesi agar santri dapat dipisahkan menjadi kelompok remedial dan pengayaan.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <RepeatIcon className="size-4 text-amber-600" />
          <div>
            <h3 className="text-sm font-semibold font-heading">Perlu remedial</h3>
            <p className="text-[11px] text-muted-foreground">
              Belum mencapai batas tuntas {passingScore}.
            </p>
          </div>
        </div>
        <GroupList members={remedial} emptyMessage="Tidak ada santri di bawah batas tuntas." />
      </div>

      <div className="rounded-lg border p-4 space-y-3">
        <div className="flex items-center gap-2">
          <BookOpenIcon className="size-4 text-primary" />
          <div>
            <h3 className="text-sm font-semibold font-heading">Siap pengayaan</h3>
            <p className="text-[11px] text-muted-foreground">
              Sudah mencapai batas tuntas {passingScore}, diurutkan dari perolehan terbaik.
            </p>
          </div>
        </div>
        <GroupList members={enrichment} emptyMessage="Belum ada santri yang mencapai batas tuntas." />
      </div>
    </div>
  )
}
