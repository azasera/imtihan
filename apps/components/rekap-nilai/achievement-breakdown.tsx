import { formatMetricPercent, type AchievementRow } from "@/lib/item-analysis"

export function AchievementBreakdown({
  title,
  rows,
  description,
}: {
  title: string
  rows: AchievementRow[]
  description: string
}) {
  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div>
        <h3 className="text-sm font-semibold font-heading">{title}</h3>
        <p className="text-[11px] text-muted-foreground mt-0.5">{description}</p>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">
          Belum ada butir bertanda pada sesi ini. Tandai tingkat berpikir dan rujukan capaian saat menulis butir.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="py-1.5 pr-3 font-medium">Pengelompok</th>
                <th className="py-1.5 pr-3 text-center font-medium">Jumlah butir</th>
                <th className="py-1.5 text-center font-medium">Daya serap rata-rata</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.key} className="border-b last:border-0">
                  <td className="py-1.5 pr-3">{row.label}</td>
                  <td className="py-1.5 pr-3 text-center font-mono">{row.itemCount}</td>
                  <td className="py-1.5 text-center font-mono">{formatMetricPercent(row.averageAbsorption)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
