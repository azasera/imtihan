import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  difficultyLabel,
  formatDiscrimination,
  formatMetricPercent,
  itemTypeLabel,
  reviewReasonsText,
  type SessionAnalysisItem,
} from "@/lib/item-analysis"

function StatusBadge({ item }: { item: SessionAnalysisItem }) {
  if (item.status === "review") {
    return (
      <Badge variant="outline" className="border-amber-500/50 text-amber-700 dark:text-amber-300 text-[10px]">
        Perlu ditinjau
      </Badge>
    )
  }

  return (
    <Badge variant="outline" className="border-emerald-500/40 text-emerald-700 dark:text-emerald-300 text-[10px]">
      Baik
    </Badge>
  )
}

function OptionDistribution({ item }: { item: SessionAnalysisItem }) {
  if (!item.distribution) {
    return <span className="text-muted-foreground">-</span>
  }

  return (
    <ul className="flex flex-wrap gap-1">
      {item.distribution.map((option) => (
        <li
          key={option.id}
          className="inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px]"
          title={option.text}
        >
          <span className="font-semibold">{option.label}</span>
          <span className="font-mono">{option.count}</span>
          {option.isCorrect && (
            <span className="rounded-sm bg-muted px-1 text-[9px] uppercase tracking-wide text-muted-foreground">
              kunci
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

export function ItemQualityTable({ items }: { items: SessionAnalysisItem[] }) {
  return (
    <>
      <div className="hidden min-[900px]:block print:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="text-xs">
              <TableHead className="w-10 text-center">No</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead className="text-center">Bobot</TableHead>
              <TableHead className="text-center">Daya serap</TableHead>
              <TableHead>Kesukaran</TableHead>
              <TableHead className="text-center">Daya beda</TableHead>
              <TableHead>Sebaran pilihan</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Catatan</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="text-xs">
            {items.map((item) => (
              <TableRow key={item.questionId}>
                <TableCell className="text-center font-mono">{item.orderNumber}</TableCell>
                <TableCell>{itemTypeLabel(item.type)}</TableCell>
                <TableCell className="text-center font-mono">{item.points}</TableCell>
                <TableCell className="text-center font-mono">
                  {formatMetricPercent(item.absorption)}
                </TableCell>
                <TableCell>{difficultyLabel(item.difficulty)}</TableCell>
                <TableCell className="text-center font-mono">
                  {formatDiscrimination(item.discrimination)}
                </TableCell>
                <TableCell>
                  <OptionDistribution item={item} />
                </TableCell>
                <TableCell>
                  <StatusBadge item={item} />
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {reviewReasonsText(item.reasons)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 p-4 min-[900px]:hidden print:hidden">
        {items.map((item) => (
          <div key={item.questionId} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">Soal {item.orderNumber}</p>
                <p className="text-[11px] text-muted-foreground">
                  {itemTypeLabel(item.type)} · bobot {item.points}
                </p>
              </div>
              <StatusBadge item={item} />
            </div>

            <dl className="grid grid-cols-2 gap-2 text-[11px]">
              <div>
                <dt className="text-muted-foreground">Daya serap</dt>
                <dd className="font-mono font-medium">{formatMetricPercent(item.absorption)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Kesukaran</dt>
                <dd className="font-medium">{difficultyLabel(item.difficulty)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Daya beda</dt>
                <dd className="font-mono font-medium">{formatDiscrimination(item.discrimination)}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Sebaran</dt>
                <dd className="font-medium">{item.distribution ? "Terlihat di bawah" : "Tidak ada"}</dd>
              </div>
            </dl>

            <OptionDistribution item={item} />

            <p className="text-[11px] text-muted-foreground">{reviewReasonsText(item.reasons)}</p>
          </div>
        ))}
      </div>
    </>
  )
}
