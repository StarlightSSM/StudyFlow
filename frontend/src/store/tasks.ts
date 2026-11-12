/**
 * Task state. This is where the experiment variants differ (research/design/conditions.md):
 *
 *   S↓ (A, C)  changing a task's status affects only that task's row.
 *              The current list is NOT re-filtered and there are no derived values.
 *   S↑ (B, D)  changing a task's status also refreshes derived state:
 *              the summary (done/total, progress) and the currently filtered list.
 *
 * Fault F1 (state update omission, S↑ only): the summary is not refreshed after a status change.
 */
import { create } from 'zustand'
import {
  fetchSummary,
  fetchTasks,
  updateTaskStatus,
  type StatusFilter,
  type Summary,
  type Task,
  type TaskStatus,
} from '../api'
import { isFaultActive, markFaultReached, variant } from '../research/experiment'

export const hasDerivedState = variant === 'B' || variant === 'D'

interface TasksState {
  tasks: Task[]
  summary: Summary | null
  filter: StatusFilter
  loading: boolean
  savingId: number | null
  error: string | null
  load: (filter: StatusFilter) => Promise<void>
  setStatus: (id: number, status: TaskStatus) => Promise<void>
}

export const useTasks = create<TasksState>((set, get) => ({
  tasks: [],
  summary: null,
  filter: 'all',
  loading: false,
  savingId: null,
  error: null,

  load: async (filter) => {
    set({ loading: true, error: null, filter })
    try {
      const [tasks, summary] = await Promise.all([
        fetchTasks(filter),
        hasDerivedState ? fetchSummary() : Promise.resolve(null),
      ])
      set({ tasks, summary, loading: false })
    } catch {
      set({ loading: false, error: '과제 목록을 불러오지 못했습니다.' })
    }
  },

  setStatus: async (id, status) => {
    // Optimistic update: the row reflects the click immediately, reverted if the request fails.
    // (Fault F5 - "reverts to the previous state after the API response" - will hook in here.)
    const before = get().tasks
    set({ savingId: id, error: null, tasks: before.map((t) => (t.id === id ? { ...t, status } : t)) })
    try {
      const updated = await updateTaskStatus(id, status)
      if (!hasDerivedState) {
        // S↓: local effect only - replace this row, keep the list as it is.
        set({ tasks: get().tasks.map((t) => (t.id === id ? updated : t)) })
      } else {
        // S↑: derived state follows the change.
        const tasks = await fetchTasks(get().filter)
        if (isFaultActive('F1')) {
          markFaultReached('F1', 'tasksStore.setStatus.refreshSummary')
          set({ tasks }) // F1: summary is left stale
        } else {
          set({ tasks, summary: await fetchSummary() })
        }
      }
    } catch {
      set({ tasks: before, error: '과제 상태를 변경하지 못했습니다.' })
    } finally {
      set({ savingId: null })
    }
  },
}))
