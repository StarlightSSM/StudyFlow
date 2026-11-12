# StudyFlow

**웹 애플리케이션의 기능적 복잡도가 LLM 생성 E2E 테스트의 결함 탐지에 미치는 영향 연구**

[한국어](#한국어) | [English](#english)

---

# 한국어

## 1. 프로젝트 소개

**StudyFlow**는 학생들이 자신의 과목과 과제를 관리할 수 있는 다중 사용자 웹 애플리케이션입니다.

이 프로젝트는 일반적인 웹 애플리케이션이면서, 동시에 **LLM이 생성한 웹 E2E 테스트가 어떤 조건에서 실제 결함을 놓치는지 통제 실험으로 검증하기 위한 연구 환경**입니다.

같은 핵심 기능을 가진 네 가지 앱 변형(A–D)에서 **상태 의존성**과 **페이지 간 상호작용**만 다르게 하고, 통제된 결함(F1–F7)을 주입합니다. 그런 다음 LLM 생성 테스트의 결함 탐지율과 실패 메커니즘(미탐지, 오라클 오류, 실행 실패)을 비교합니다.

> **현재 상태:** 실험 하네스 Stage 1을 구현했습니다. 과제 목록과 완료 처리(G2)를 변형 A·B로 구현했고, 결함 F1은 기준 테스트로 검증했습니다. 다른 목표, 변형 C·D, 나머지 결함, 로그인은 순차적으로 진행할 예정입니다.

## 2. 연구 질문

| | 질문 |
|---|---|
| RQ1 | 상태 의존성과 페이지 간 상호작용은 결함 탐지율에 어떤 영향을 미치는가? |
| RQ2 | 두 요인의 주효과와 상호작용 효과는 어떻게 나타나는가? |
| RQ3 | 복잡도에 따라 미탐지·오라클 오류·실행 실패·수정 노력은 어떻게 달라지는가? |

가설, 판정 규칙, 분석 계획은 [`docs/research/PROTOCOL.md`](docs/research/PROTOCOL.md)에 있습니다.

### 2×2 앱 변형

|  | 페이지 간 상호작용 낮음 | 페이지 간 상호작용 높음 |
|---|---|---|
| **상태 의존성 낮음** | A | C |
| **상태 의존성 높음** | B | D |

### 실험 파이프라인

```text
테스트 목표 (네 변형 공통)  +  시작 페이지 ARIA snapshot
        ↓
LLM 테스트 생성 (모델·버전·프롬프트 고정, 3회 반복)
        ↓
정상 앱에서 실행 → 실패 시 '정상 앱 실패 출력만'으로 수정 (최대 3회) → flaky 재실행
        ↓
스위트 고정 (Stage 1: harness/generate.py)
        ↓
결함 앱(F1–F7, 단일 변이)에서 실행 + 결함 도달 기록 (Stage 2: harness/evaluate.py)
        ↓
판정: detected / missed / no_opportunity / oracle_error / execution_failure / environment_error / flaky
        ↓
혼합효과 로지스틱 회귀 (승산비, 95% 신뢰구간)
```

## 3. 주요 기능

StudyFlow v1에서 구현할 기능입니다.

- **사용자 인증:** 회원가입, 로그인, 로그아웃
- **사용자 데이터 격리:** 사용자별 과목 및 과제 데이터 분리
- **과목 관리:** 과목 등록, 조회, 수정, 삭제
- **과제 관리:** 과제 등록, 조회, 수정, 삭제
- **과제 상태 관리:** 완료 및 미완료 상태 변경
- **검색 및 필터링:** 과제명 검색, 과목별·상태별 필터링
- **대시보드:** 과제 현황 및 마감 임박 과제 확인
- **입력값 검증:** 필수 입력값 및 유효하지 않은 입력 처리
- **오류 처리:** API 오류 및 존재하지 않는 리소스 처리
- **실험 스위치:** 앱 변형(A–D)과 결함(F1–F7)을 환경변수로 전환하고, 결함 코드 도달을 기록

## 4. 기술 스택

| 구분 | 기술 |
|---|---|
| 프론트엔드 | React, TypeScript, Vite |
| 라우팅 | React Router |
| 상태 관리 | Zustand |
| HTTP 클라이언트 | Axios |
| 백엔드 | Node.js, Express, TypeScript (ESM) |
| 데이터베이스 | SQLite |
| E2E 테스트 | Playwright |
| 단위 테스트 | Vitest |
| 실험 하네스 | Python, google-genai (Gemini API) |
| 연구 데이터 분석 | Python, pandas, statsmodels (혼합효과 모형) |
| 버전 관리 | Git, GitHub |

## 5. 프로젝트 구조

```text
StudyFlow/
├── frontend/                  React 앱
│   └── src/research/          실험 스위치 (변형·결함·도달 기록)
├── backend/                   Express API
│   └── src/research/          실험 스위치 + 하네스 전용 /api/__research
├── tests/                     Playwright
│   ├── playwright.config.ts   실험용 고정 실행 환경
│   ├── tools/snapshot.mjs     LLM에 보여줄 ARIA snapshot + DOM 공변량
│   ├── reference/             결함별 사람 작성 기준 테스트 (결함 유효성 검증용)
│   └── llm-generated/         실행용 복사본 (git 제외)
├── harness/                   실험 하네스 (생성·검증·평가)
├── research/
│   ├── requirements/          요구사항 명세 (v2.0)
│   ├── design/conditions.md   앱 변형(A–D) 설계
│   ├── faults/catalog.yaml    결함 카탈로그 (F1–F7)
│   ├── scenarios/             테스트 목표 × 변형 시나리오 정의
│   ├── llm-results/runs/      실행별 원자료 (호출, 실행, 스위트 기록, 생성 코드)
│   └── evaluation/            Stage 2 판정 결과, 분석 데이터셋
├── docs/
│   ├── RUNNING.md             전체 실행 매뉴얼
│   └── research/PROTOCOL.md   실험 프로토콜 (판정 규칙·분석 계획 사전 확정)
└── README.md
```

## 6. 시작하기

> **실행 매뉴얼:** 전체 순서는 [`docs/RUNNING.md`](docs/RUNNING.md)에 있습니다. 구성요소별 매뉴얼은 [`frontend/README.md`](frontend/README.md), [`backend/README.md`](backend/README.md), [`harness/README.md`](harness/README.md)에 있습니다.

### 사전 준비
- Node.js 및 npm, Python 3.9 이상(3.12 권장), Git
- Visual Studio Code (권장)

### 6.1. 저장소 복제
```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd StudyFlow
```

### 6.2. 앱 실행
```bash
cd backend && npm install && npm run dev      # http://localhost:3000
cd frontend && npm install && npm run dev     # http://localhost:5173 (/api는 백엔드로 프록시)
```

실험 스위치 예시 (PowerShell):
```powershell
# 백엔드: 변형 B, 결함 F1, 도달 기록 켜기, 하네스용 API 켜기
$env:STUDYFLOW_VARIANT="B"; $env:STUDYFLOW_FAULT="F1"; $env:STUDYFLOW_REACH_LOG="research/evaluation/reach.jsonl"; $env:STUDYFLOW_RESEARCH_API="1"; npm run dev
# 프론트엔드
$env:VITE_STUDYFLOW_VARIANT="B"; $env:VITE_STUDYFLOW_FAULT="F1"; npm run dev
```

### 6.3. 검사
```bash
cd frontend && npm run lint && npm run build
cd backend && npm run typecheck
```

### 6.4. Playwright와 하네스
```bash
cd tests && npm install && npx playwright install chromium
pip install -r harness/requirements.txt
python harness/selftest_labels.py                                   # 판정기 점검 (무료)
python harness/generate.py --scenario research/scenarios/SMOKE-001.json --reps 3
```
자세한 내용은 [`harness/README.md`](harness/README.md)를 보세요. API 키는 루트의 `.env`(`GEMINI_API_KEY`)에 넣으며, 이 파일은 git에 올라가지 않습니다.

## 7. 재현성 원칙

- 모델, 실제로 응답한 모델 버전, 프롬프트 해시, 앱 git commit, 도구 버전을 실행마다 기록합니다.
- 생성된 모든 코드와 응답 원문을 저장합니다. 그래서 평가 단계는 언제든 다시 실행할 수 있습니다.
- 결함 정보, 변형 ID, 연구용 API는 LLM 입력에 포함하지 않습니다.
- 판정 규칙과 분석 방법은 본 실험 전에 [`PROTOCOL.md`](docs/research/PROTOCOL.md)에서 확정합니다.

## 8. 개발 로드맵

- [x] React + TypeScript + Vite 프론트엔드 초기 설정
- [x] Playwright 테스트 패키지 초기 설정
- [x] StudyFlow v1 요구사항 명세 초안 작성
- [x] 실험 프로토콜 v0.1 및 변형·결함 카탈로그 초안
- [x] 실험 스위치(변형·결함·도달 기록) 골격
- [x] 실험 하네스 Stage 1 (생성, 정상 앱 검증, 수정 루프, flaky 판정, 기록)
- [ ] 지도교수 승인 → 프로토콜 v1.0 확정
- [x] 백엔드 SQLite(`node:sqlite`) 데이터베이스와 고정 seed data(`seed-v1`), 하네스용 DB 초기화
- [x] G2(과제 완료 처리): 과제 목록·상태 필터·완료 처리를 변형 A·B로 구현
- [x] 결함 F1(변형 B) 구현 및 기준 테스트 검증
- [ ] 나머지 목표(G1·G3–G5)와 변형 C·D 구현, 로그인(REQ-AUTH)
- [ ] 결함 F2–F7 구현 및 결함별 기준 테스트 작성
- [ ] 하네스 Stage 2 (결함 앱 평가, 도달 기반 판정)
- [ ] 파일럿 (목표 수 결정, 라벨 일치도 κ 확인)
- [ ] 본 실험 및 혼합효과 모형 분석

## 9. 프로젝트 범위

StudyFlow v1은 핵심 웹 애플리케이션 기능과 테스트 가능성에 집중합니다. 다음 기능은 초기 범위에서 제외합니다.

- 소셜 로그인, 이메일 인증 및 비밀번호 재설정
- 실시간 알림 및 채팅, 파일 업로드, 결제 기능
- 외부 캘린더 연동, 네이티브 모바일 애플리케이션
- 복잡한 다단계 관리자 권한, 추천 시스템 및 소셜 기능

연구 범위에서도 GAE 기반 결함 탐지 모델, RL 환경, RAG 오라클, 모델 간 성능 비교는 후속 연구로 미룹니다.

## 10. 라이선스

현재 라이선스는 미정입니다. 사용 및 재배포 조건은 라이선스를 추가한 뒤 명시할 예정입니다.

---

# English

## 1. Project Overview

**StudyFlow** is a multi-user web application that lets students manage their subjects and assignments.

It is also a **controlled research environment for testing when LLM-generated web E2E tests miss real faults**. Four app variants (A–D) share the same core features and differ only in **state dependency** and **cross-page interaction**. Controlled faults (F1–F7) are injected, and the fault detection rate and failure mechanisms (missed, oracle error, execution failure) of LLM-generated tests are compared across variants.

> **Current status:** Requirements, a draft experiment protocol, and harness Stage 1 (generation and validation on the fault-free app) are done. App features and faults come next.

## 2. Research Questions

- **RQ1.** How do state dependency and cross-page interaction affect the fault detection rate?
- **RQ2.** What are the main and interaction effects of the two factors?
- **RQ3.** How do misses, oracle errors, execution failures, and repair effort change with complexity?

Hypotheses, labelling rules, and the analysis plan are in [`docs/research/PROTOCOL.md`](docs/research/PROTOCOL.md).

| | Low cross-page interaction | High cross-page interaction |
|---|---|---|
| **Low state dependency** | A | C |
| **High state dependency** | B | D |

**Pipeline**
1. Generate tests from fixed test goals plus an ARIA snapshot, with a pinned model, version, and prompt, 3 repetitions each.
2. Validate on the fault-free app, repair using only fault-free-app failures, then check for flakiness and freeze the suite.
3. Run the frozen suite on each single-fault mutant and record whether the faulty code was reached.
4. Label the result as detected, missed, no_opportunity, oracle_error, execution_failure, environment_error, or flaky.
5. Fit a mixed-effects logistic regression and report odds ratios with 95% confidence intervals.

## 3. Key Features

Authentication, per-user data isolation, subject and task CRUD, task status, search and filters, dashboard, input validation, and error handling. On top of these, **experiment switches** select the app variant (A–D) and fault (F1–F7) through environment variables and record when fault code is reached.

## 4. Tech Stack

| Category | Technology |
|---|---|
| Frontend | React, TypeScript, Vite, React Router, Zustand, Axios |
| Backend | Node.js, Express, TypeScript (ESM), SQLite |
| Testing | Playwright, Vitest |
| Harness | Python, google-genai (Gemini API) |
| Analysis | Python, pandas, statsmodels |

## 5. Project Structure

See the Korean section §5. Key locations:
- `harness/`: experiment code
- `docs/research/PROTOCOL.md`: pre-registered protocol
- `research/faults/catalog.yaml`: fault catalog
- `research/design/conditions.md`: variant design
- `research/llm-results/runs/`: raw run data

## 6. Getting Started

The full run manual (in Korean) is [`docs/RUNNING.md`](docs/RUNNING.md). Component manuals live in `frontend/`, `backend/`, and `harness/` README files.

```bash
cd backend && npm install && npm run dev      # :3000
cd frontend && npm install && npm run dev     # :5173, /api proxied to the backend
cd tests && npm install && npx playwright install chromium
pip install -r harness/requirements.txt
python harness/selftest_labels.py
python harness/generate.py --scenario research/scenarios/SMOKE-001.json --reps 3
```

Put the API key in the root `.env` as `GEMINI_API_KEY`. The file is git-ignored.

## 7. Reproducibility

Every run records:
- the requested model and the model version that actually answered
- prompt hashes
- the app git commit
- tool versions
- all raw responses and generated code

Fault information, variant IDs, and research endpoints are never shown to the LLM. Labelling rules are fixed in the protocol before the main experiment.

## 8. Scope

The v1 exclusions are listed in the Korean section §9. Out of research scope, left for future work: GAE-based detection, RL environments, a RAG oracle, and cross-model comparison.

## 9. License

To be decided.
