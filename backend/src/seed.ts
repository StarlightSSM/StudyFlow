/**
 * Deterministic seed data (PROTOCOL.md §2: identical seed data in every variant).
 * Fixed ids and timestamps so every reset produces byte-identical data.
 * Do not change without bumping the protocol version - generated tests depend on it.
 */
import { scryptSync } from "node:crypto";

export const SEED_VERSION = "seed-v1";

const hash = (pw: string) => "scrypt$studyflow-seed$" + scryptSync(pw, "studyflow-seed", 32).toString("hex");

export const SEED_USERS = [
  { id: 1, email: "student@studyflow.test", name: "김학생", passwordHash: hash("studyflow123") },
];

export const SEED_SUBJECTS = [
  { id: 1, userId: 1, name: "데이터마이닝", createdAt: "2026-09-01T09:00:00.000Z" },
  { id: 2, userId: 1, name: "머신러닝", createdAt: "2026-09-01T09:01:00.000Z" },
  { id: 3, userId: 1, name: "네트워크과학", createdAt: "2026-09-01T09:02:00.000Z" },
];

type SeedTask = {
  id: number; userId: number; subjectId: number; title: string; description: string;
  dueDate: string; status: "todo" | "done"; createdAt: string;
};

// 12 tasks, 4 done / 8 todo. createdAt strictly increasing (default list order = newest first).
export const SEED_TASKS: SeedTask[] = [
  { id: 1, userId: 1, subjectId: 1, title: "연관규칙 실습 보고서", description: "Apriori 실습 결과 정리", dueDate: "2026-11-20", status: "done", createdAt: "2026-10-01T10:00:00.000Z" },
  { id: 2, userId: 1, subjectId: 2, title: "선형회귀 과제", description: "경사하강법 구현", dueDate: "2026-11-22", status: "done", createdAt: "2026-10-03T10:00:00.000Z" },
  { id: 3, userId: 1, subjectId: 3, title: "중심성 지표 정리", description: "degree, betweenness, closeness 비교", dueDate: "2026-11-24", status: "todo", createdAt: "2026-10-05T10:00:00.000Z" },
  { id: 4, userId: 1, subjectId: 1, title: "군집분석 퀴즈 준비", description: "k-means, DBSCAN", dueDate: "2026-11-25", status: "todo", createdAt: "2026-10-07T10:00:00.000Z" },
  { id: 5, userId: 1, subjectId: 2, title: "결정트리 실습", description: "지니 계수와 엔트로피 비교", dueDate: "2026-11-27", status: "done", createdAt: "2026-10-09T10:00:00.000Z" },
  { id: 6, userId: 1, subjectId: 3, title: "커뮤니티 탐지 논문 읽기", description: "Louvain 알고리즘", dueDate: "2026-11-29", status: "todo", createdAt: "2026-10-11T10:00:00.000Z" },
  { id: 7, userId: 1, subjectId: 1, title: "텍스트마이닝 전처리", description: "형태소 분석과 불용어 처리", dueDate: "2026-12-01", status: "todo", createdAt: "2026-10-13T10:00:00.000Z" },
  { id: 8, userId: 1, subjectId: 2, title: "SVM 커널 비교", description: "선형, RBF 커널 실험", dueDate: "2026-12-03", status: "todo", createdAt: "2026-10-15T10:00:00.000Z" },
  { id: 9, userId: 1, subjectId: 3, title: "링크 예측 실습", description: "공통 이웃 기반 점수", dueDate: "2026-12-05", status: "done", createdAt: "2026-10-17T10:00:00.000Z" },
  { id: 10, userId: 1, subjectId: 1, title: "기말 프로젝트 제안서", description: "주제와 데이터셋 선정", dueDate: "2026-12-08", status: "todo", createdAt: "2026-10-19T10:00:00.000Z" },
  { id: 11, userId: 1, subjectId: 2, title: "신경망 역전파 정리", description: "계산 그래프로 설명", dueDate: "2026-12-10", status: "todo", createdAt: "2026-10-21T10:00:00.000Z" },
  { id: 12, userId: 1, subjectId: 3, title: "네트워크 시각화 과제", description: "Gephi로 시각화", dueDate: "2026-12-12", status: "todo", createdAt: "2026-10-23T10:00:00.000Z" },
];
