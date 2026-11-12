/**
 * Experiment switches for the 2x2 study (docs/research/PROTOCOL.md).
 *
 *   STUDYFLOW_VARIANT       A | B | C | D        app variant (state dependency x cross-page interaction)
 *   STUDYFLOW_FAULT         none | F1 ... F7     single injected fault (one mutant at a time)
 *   STUDYFLOW_REACH_LOG     path to a JSONL file fault-reach markers are appended to
 *   STUDYFLOW_RESEARCH_API  "1" mounts /api/__research (info + reach endpoints) for the harness
 *
 * Fault code must be written as:
 *
 *   if (isFaultActive("F2")) {
 *     markFaultReached("F2", "tasks.filterByStatus");
 *     // ...faulty behaviour...
 *   } else {
 *     // ...correct behaviour...
 *   }
 *
 * The reach marker lets the evaluator separate `missed` (the faulty code ran but the test
 * did not notice) from `no_opportunity` (the test never exercised the faulty code).
 * Fault IDs, variants and these endpoints must never appear in anything shown to the LLM.
 */
import fs from "node:fs";
import path from "node:path";
import { Router } from "express";

export const VARIANTS = ["A", "B", "C", "D"] as const;
export type Variant = (typeof VARIANTS)[number];

export const FAULT_IDS = ["F1", "F2", "F3", "F4", "F5", "F6", "F7"] as const;
export type FaultId = (typeof FAULT_IDS)[number];

function parseVariant(raw: string | undefined): Variant {
  const v = (raw ?? "A").trim().toUpperCase();
  if (!(VARIANTS as readonly string[]).includes(v)) {
    throw new Error(`STUDYFLOW_VARIANT must be one of ${VARIANTS.join(", ")} (got "${raw}")`);
  }
  return v as Variant;
}

function parseFault(raw: string | undefined): FaultId | null {
  const f = (raw ?? "none").trim().toUpperCase();
  if (f === "" || f === "NONE") return null;
  if (!(FAULT_IDS as readonly string[]).includes(f)) {
    throw new Error(`STUDYFLOW_FAULT must be none or one of ${FAULT_IDS.join(", ")} (got "${raw}")`);
  }
  return f as FaultId;
}

export const experiment = Object.freeze({
  variant: parseVariant(process.env.STUDYFLOW_VARIANT),
  fault: parseFault(process.env.STUDYFLOW_FAULT),
  reachLog: process.env.STUDYFLOW_REACH_LOG ?? null,
});

export function isFaultActive(id: FaultId): boolean {
  return experiment.fault === id;
}

export function markFaultReached(id: FaultId, where: string, layer: "backend" | "frontend" = "backend"): void {
  if (experiment.fault !== id || !experiment.reachLog) return;
  const line = JSON.stringify({ ts: new Date().toISOString(), fault: id, where, layer, variant: experiment.variant });
  fs.mkdirSync(path.dirname(experiment.reachLog), { recursive: true });
  fs.appendFileSync(experiment.reachLog, line + "\n", "utf8");
}

export interface ResearchHooks {
  /** Restore the deterministic seed data (called before every harness execution). */
  onReset?: () => void;
}

/** Harness-only endpoints. Mounted only when STUDYFLOW_RESEARCH_API=1. */
export function researchRouter(hooks: ResearchHooks = {}): Router {
  const router = Router();
  router.post("/reset", (_req, res) => {
    if (!hooks.onReset) {
      res.status(501).json({ error: "reset not available" });
      return;
    }
    hooks.onReset();
    res.status(204).end();
  });
  router.get("/info", (_req, res) => {
    res.json({ variant: experiment.variant, fault: experiment.fault, reachLogEnabled: Boolean(experiment.reachLog) });
  });
  // Frontend faults report reach through here (see frontend/src/research/experiment.ts).
  router.post("/reach", (req, res) => {
    const { fault, where } = req.body ?? {};
    if (typeof fault === "string" && (FAULT_IDS as readonly string[]).includes(fault) && typeof where === "string") {
      markFaultReached(fault as FaultId, where, "frontend");
    }
    res.status(204).end();
  });
  return router;
}
