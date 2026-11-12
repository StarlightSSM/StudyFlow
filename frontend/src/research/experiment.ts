/**
 * Frontend side of the experiment switches (see backend/src/research/experiment.ts).
 *
 *   VITE_STUDYFLOW_VARIANT  A | B | C | D
 *   VITE_STUDYFLOW_FAULT    none | F1 ... F7
 *
 * Set them when starting the dev server, e.g. (PowerShell):
 *   $env:VITE_STUDYFLOW_VARIANT="B"; $env:VITE_STUDYFLOW_FAULT="F1"; npm run dev
 *
 * Usage inside a component:
 *   if (isFaultActive('F1')) { markFaultReached('F1', 'TaskBadge.refresh'); ...faulty... } else { ...correct... }
 */
export const VARIANTS = ['A', 'B', 'C', 'D'] as const
export type Variant = (typeof VARIANTS)[number]

export const FAULT_IDS = ['F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7'] as const
export type FaultId = (typeof FAULT_IDS)[number]

const rawVariant = String(import.meta.env.VITE_STUDYFLOW_VARIANT ?? 'A').toUpperCase()
const rawFault = String(import.meta.env.VITE_STUDYFLOW_FAULT ?? 'none').toUpperCase()

export const variant: Variant = (VARIANTS as readonly string[]).includes(rawVariant)
  ? (rawVariant as Variant)
  : 'A'
export const activeFault: FaultId | null = (FAULT_IDS as readonly string[]).includes(rawFault)
  ? (rawFault as FaultId)
  : null

export function isFaultActive(id: FaultId): boolean {
  return activeFault === id
}

/** Fire-and-forget reach marker; the backend appends it to STUDYFLOW_REACH_LOG. */
export function markFaultReached(id: FaultId, where: string): void {
  if (activeFault !== id) return
  void fetch('/api/__research/reach', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fault: id, where }),
    keepalive: true,
  }).catch(() => {})
}
