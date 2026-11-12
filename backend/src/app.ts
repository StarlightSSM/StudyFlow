import express from "express";
import { resetDatabase } from "./db.js";
import { experiment, researchRouter } from "./research/experiment.js";
import { tasksRouter } from "./routes/tasks.js";

const app = express();

app.use(express.json());
app.use("/api", tasksRouter());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    message: "StudyFlow backend is running",
  });
});

// Experiment control endpoints for the harness only (never linked from the UI).
if (process.env.STUDYFLOW_RESEARCH_API === "1") {
  app.use("/api/__research", researchRouter({ onReset: resetDatabase }));
  console.log(`[research] variant=${experiment.variant} fault=${experiment.fault ?? "none"}`);
}

export default app;