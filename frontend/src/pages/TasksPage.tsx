import { useEffect } from 'react'
import { STATUS_LABEL, type StatusFilter } from '../api'
import SummaryPanel from '../components/SummaryPanel'
import { hasDerivedState, useTasks } from '../store/tasks'

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: '전체' },
  { value: 'todo', label: '미완료' },
  { value: 'done', label: '완료' },
]

/** REQ-TASK-002 (list), REQ-STATUS-001/002 (complete / un-complete), REQ-FILTER-002 (status filter). */
export default function TasksPage() {
  const { tasks, summary, filter, loading, savingId, error, load, setStatus } = useTasks()

  useEffect(() => {
    void load('all')
  }, [load])

  return (
    <section aria-labelledby="tasks-heading">
      <h1 id="tasks-heading">과제 목록</h1>

      {hasDerivedState && summary && <SummaryPanel summary={summary} />}

      <fieldset className="filters">
        <legend>상태 필터</legend>
        {FILTERS.map((f) => (
          <label key={f.value}>
            <input
              type="radio"
              name="status-filter"
              value={f.value}
              checked={filter === f.value}
              onChange={() => void load(f.value)}
            />
            {f.label}
          </label>
        ))}
      </fieldset>

      {error && <p role="alert" className="error">{error}</p>}

      <table aria-label="과제 목록" aria-busy={loading}>
        <thead>
          <tr>
            <th scope="col">과제명</th>
            <th scope="col">과목</th>
            <th scope="col">마감일</th>
            <th scope="col">상태</th>
            <th scope="col">완료</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} className={t.status === 'done' ? 'is-done' : undefined}>
              <td>{t.title}</td>
              <td>{t.subjectName}</td>
              <td>{t.dueDate}</td>
              <td>{STATUS_LABEL[t.status]}</td>
              <td>
                <input
                  type="checkbox"
                  aria-label={`${t.title} 완료`}
                  checked={t.status === 'done'}
                  disabled={savingId === t.id}
                  onChange={(e) => void setStatus(t.id, e.target.checked ? 'done' : 'todo')}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!loading && tasks.length === 0 && <p className="empty">표시할 과제가 없습니다.</p>}
    </section>
  )
}
