import type { Summary } from '../api'

/** Derived state shown only in S↑ variants (B, D). */
export default function SummaryPanel({ summary }: { summary: Summary }) {
  const pct = summary.total === 0 ? 0 : Math.round((summary.done / summary.total) * 100)
  return (
    <section className="summary" aria-label="과제 현황">
      <p className="summary-main">{`완료 ${summary.done} / 전체 ${summary.total}`}</p>
      <p className="summary-sub">{`미완료 ${summary.todo}`}</p>
      <div className="progress">
        <progress aria-label="진행률" value={summary.done} max={summary.total} />
        <span>{`${pct}%`}</span>
      </div>
    </section>
  )
}
