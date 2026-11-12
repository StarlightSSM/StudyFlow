/**
 * Task & subject API (REQ-TASK-002, REQ-STATUS-001/002, REQ-FILTER-002, REQ-DASH-001 counts).
 * The API is identical across variants; variants differ only in how the UI propagates state.
 */
import { Router } from "express";
import { db } from "../db.js";

// TODO(auth): replace with the session user once REQ-AUTH-003 (login) is implemented.
const CURRENT_USER_ID = 1;

const STATUSES = ["todo", "done"] as const;
type Status = (typeof STATUSES)[number];
const isStatus = (v: unknown): v is Status => typeof v === "string" && (STATUSES as readonly string[]).includes(v);

const SELECT_TASKS = `
  SELECT t.id, t.title, t.description, t.due_date AS dueDate, t.status,
         t.created_at AS createdAt, t.updated_at AS updatedAt,
         s.id AS subjectId, s.name AS subjectName
  FROM tasks t JOIN subjects s ON s.id = t.subject_id
  WHERE t.user_id = ?`;
const ORDER = " ORDER BY t.created_at DESC, t.id DESC";

export function tasksRouter(): Router {
  const router = Router();

  router.get("/subjects", (_req, res) => {
    res.json(db.prepare("SELECT id, name FROM subjects WHERE user_id = ? ORDER BY id").all(CURRENT_USER_ID));
  });

  router.get("/tasks", (req, res) => {
    const { status } = req.query;
    if (status !== undefined && !isStatus(status)) {
      res.status(400).json({ error: "status must be 'todo' or 'done'" });
      return;
    }
    const rows = status
      ? db.prepare(SELECT_TASKS + " AND t.status = ?" + ORDER).all(CURRENT_USER_ID, status)
      : db.prepare(SELECT_TASKS + ORDER).all(CURRENT_USER_ID);
    res.json(rows);
  });

  router.get("/tasks/summary", (_req, res) => {
    const r = db
      .prepare(
        `SELECT COUNT(*) AS total,
                COALESCE(SUM(status = 'done'), 0) AS done,
                COALESCE(SUM(status = 'todo'), 0) AS todo
         FROM tasks WHERE user_id = ?`,
      )
      .get(CURRENT_USER_ID);
    res.json(r);
  });

  router.patch("/tasks/:id/status", (req, res) => {
    const id = Number(req.params.id);
    const status: unknown = req.body?.status;
    if (!Number.isInteger(id) || id <= 0) {
      res.status(400).json({ error: "invalid task id" });
      return;
    }
    if (!isStatus(status)) {
      res.status(400).json({ error: "status must be 'todo' or 'done'" });
      return;
    }
    const result = db
      .prepare("UPDATE tasks SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?")
      .run(status, new Date().toISOString(), id, CURRENT_USER_ID);
    if (Number(result.changes) === 0) {
      res.status(404).json({ error: "task not found" });
      return;
    }
    res.json(db.prepare(SELECT_TASKS + " AND t.id = ?").get(CURRENT_USER_ID, id));
  });

  return router;
}
