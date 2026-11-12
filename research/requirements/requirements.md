# StudyFlow v1 Requirements Specification

## 1. Document Information

| 항목 | 내용 |
|---|---|
| Project | StudyFlow |
| Version | v2.0 (2026-11-12: 연구 실험 조건 변경 → Major. 기능 요구사항(4–11장)은 변경 없음, 12·15·19장 연구 관련 부분만 개정) |
| Purpose | 학생의 과목 및 과제를 관리하는 다중 사용자 웹 애플리케이션 |
| Primary Purpose | 기능적 복잡도(상태 의존성 × 페이지 간 상호작용)가 LLM 생성 E2E 테스트의 결함 탐지에 미치는 영향을 검증하기 위한 Controlled Web Application |
| Experiment Protocol | `docs/research/PROTOCOL.md` |
| Frontend | React + TypeScript + Vite |
| Backend | Node.js + Express + TypeScript |
| Database | SQLite |
| E2E Testing | Playwright |
| Unit Testing | Vitest |

---

# 2. System Overview

StudyFlow는 사용자가 자신의 과목과 과제를 관리할 수 있는 웹 애플리케이션이다.

각 사용자는 회원가입 및 로그인을 통해 자신의 계정으로 서비스를 이용하며, 사용자가 생성한 과목과 과제는 다른 사용자의 데이터와 분리되어야 한다.

StudyFlow는 일반적인 학생용 서비스인 동시에, LLM이 웹 애플리케이션의 요구사항을 기반으로 테스트 케이스를 생성하고 실행하는 연구를 위한 Controlled Web Application으로 사용한다.

전체 연구 추적 구조는 다음과 같다.

```text
Requirement
    ↓
Application Implementation
    ↓
Human-authored Test Case
    ↓
LLM-generated Test Case
    ↓
Playwright Execution
    ↓
Defect Detection
    ↓
Coverage / Quality Evaluation
```

---

# 3. User Model

## 3.1 User

사용자는 다음 정보를 가진다.

- User ID
- Email
- Password
- Name
- Created At

각 사용자는 자신의 계정으로 로그인할 수 있다.

사용자는 다른 사용자의 과목 및 과제 데이터에 접근할 수 없어야 한다.

---

# 4. Functional Requirements

## 4.1 Authentication

### REQ-AUTH-001 — 회원가입

**Priority:** High

**Description**

사용자는 이메일, 비밀번호, 이름을 입력하여 새로운 계정을 생성할 수 있어야 한다.

**Preconditions**

- 사용자는 로그인하지 않은 상태여야 한다.

**Actions**

1. 회원가입 페이지로 이동한다.
2. 이메일을 입력한다.
3. 비밀번호를 입력한다.
4. 이름을 입력한다.
5. 회원가입 버튼을 클릭한다.

**Expected Results**

- 입력된 정보가 유효하면 계정이 생성된다.
- 회원가입 성공 메시지가 표시된다.
- 동일한 이메일이 이미 존재하면 회원가입이 실패한다.

---

### REQ-AUTH-002 — 회원가입 입력값 검증

**Priority:** High

**Description**

회원가입 시 필수 입력값과 입력 형식을 검증해야 한다.

**Validation Rules**

- 이메일은 필수이다.
- 이메일은 유효한 이메일 형식이어야 한다.
- 비밀번호는 필수이다.
- 비밀번호는 최소 8자 이상이어야 한다.
- 이름은 필수이다.

**Expected Results**

- 유효하지 않은 입력값에 대해 오류 메시지가 표시된다.
- 유효하지 않은 입력으로는 계정이 생성되지 않는다.

---

### REQ-AUTH-003 — 로그인

**Priority:** High

**Description**

등록된 사용자는 이메일과 비밀번호를 이용하여 로그인할 수 있어야 한다.

**Preconditions**

- 사용자의 계정이 존재해야 한다.

**Actions**

1. 로그인 페이지로 이동한다.
2. 이메일을 입력한다.
3. 비밀번호를 입력한다.
4. 로그인 버튼을 클릭한다.

**Expected Results**

- 인증 정보가 올바르면 로그인된다.
- 로그인 후 Dashboard 페이지로 이동한다.
- 인증 정보가 올바르지 않으면 로그인되지 않는다.

---

### REQ-AUTH-004 — 로그인 실패 처리

**Priority:** High

**Description**

존재하지 않는 계정 또는 잘못된 비밀번호로 로그인을 시도할 경우 적절한 오류를 표시해야 한다.

**Expected Results**

- 로그인이 실패한다.
- 사용자에게 로그인 실패 메시지가 표시된다.
- 인증되지 않은 사용자는 보호된 페이지에 접근할 수 없다.

---

### REQ-AUTH-005 — 로그아웃

**Priority:** High

**Description**

로그인한 사용자는 로그아웃할 수 있어야 한다.

**Actions**

1. 로그인 상태에서 로그아웃 버튼을 클릭한다.

**Expected Results**

- 인증 상태가 종료된다.
- 로그인 페이지로 이동한다.
- 로그아웃 이후 보호된 페이지에 접근할 수 없다.

---

## 4.2 User Data Isolation

### REQ-USER-001 — 사용자 데이터 격리

**Priority:** Critical

**Description**

각 사용자의 과목과 과제 데이터는 다른 사용자에게 노출되지 않아야 한다.

**Preconditions**

- User A와 User B가 존재한다.
- User A와 User B가 각각 로그인할 수 있다.

**Scenario**

1. User A가 과목을 생성한다.
2. User A가 과제를 생성한다.
3. User B가 로그인한다.
4. User B가 과목 및 과제 목록을 확인한다.

**Expected Results**

- User B에게 User A의 데이터가 표시되지 않는다.
- User B는 User A의 데이터를 수정하거나 삭제할 수 없다.

---

### REQ-USER-002 — 인증 사용자 데이터 접근

**Priority:** Critical

**Description**

과목 및 과제 관련 API는 인증된 사용자의 데이터만 반환해야 한다.

**Expected Results**

- 인증된 사용자는 자신의 데이터에 접근할 수 있다.
- 인증되지 않은 요청은 거부된다.
- 다른 사용자의 데이터 ID를 직접 요청하더라도 해당 데이터에 접근할 수 없다.

---

# 5. Subject Management

## 5.1 Subject CRUD

### REQ-SUBJECT-001 — 과목 등록

**Priority:** High

**Description**

로그인한 사용자는 새로운 과목을 등록할 수 있어야 한다.

**Input**

- 과목명

**Expected Results**

- 과목이 생성된다.
- 생성된 과목이 과목 목록에 표시된다.
- 과목은 현재 로그인한 사용자에게 귀속된다.

---

### REQ-SUBJECT-002 — 과목 목록 조회

**Priority:** High

**Description**

사용자는 자신이 등록한 과목 목록을 조회할 수 있어야 한다.

**Expected Results**

- 자신의 과목만 표시된다.
- 다른 사용자의 과목은 표시되지 않는다.

---

### REQ-SUBJECT-003 — 과목 수정

**Priority:** Medium

**Description**

사용자는 자신이 등록한 과목의 이름을 수정할 수 있어야 한다.

**Actions**

1. 과목을 선택한다.
2. 수정 버튼을 클릭한다.
3. 새로운 과목명을 입력한다.
4. 저장한다.

**Expected Results**

- 과목명이 변경된다.
- 변경된 과목명이 목록에 표시된다.

---

### REQ-SUBJECT-004 — 과목 삭제

**Priority:** High

**Description**

사용자는 자신이 등록한 과목을 삭제할 수 있어야 한다.

**Actions**

1. 과목을 선택한다.
2. 삭제 버튼을 클릭한다.
3. 삭제를 확인한다.

**Expected Results**

- 과목이 삭제된다.
- 과목 목록에서 해당 과목이 제거된다.

---

### REQ-SUBJECT-005 — 과목명 입력값 검증

**Priority:** Medium

**Description**

과목 등록 및 수정 시 과목명이 유효한지 검증해야 한다.

**Expected Results**

- 빈 과목명은 등록할 수 없다.
- 공백만 입력한 경우 등록할 수 없다.
- 유효하지 않은 입력에 대해 오류 메시지가 표시된다.

---

# 6. Task Management

## 6.1 Task CRUD

### REQ-TASK-001 — 과제 등록

**Priority:** Critical

**Description**

로그인한 사용자는 특정 과목에 새로운 과제를 등록할 수 있어야 한다.

**Input**

- 과제명
- 과목
- 마감일
- 설명

**Actions**

1. 과제 추가 버튼을 클릭한다.
2. 과제명을 입력한다.
3. 과목을 선택한다.
4. 마감일을 입력한다.
5. 필요하면 설명을 입력한다.
6. 등록 버튼을 클릭한다.

**Expected Results**

- 과제가 생성된다.
- 과제 목록에 생성된 과제가 표시된다.
- 생성된 과제는 현재 로그인한 사용자에게 귀속된다.

---

### REQ-TASK-002 — 과제 목록 조회

**Priority:** High

**Description**

사용자는 자신이 등록한 과제 목록을 조회할 수 있어야 한다.

**Expected Results**

- 자신의 과제만 표시된다.
- 과제명, 과목, 마감일, 상태가 표시된다.

---

### REQ-TASK-003 — 과제 상세 조회

**Priority:** Medium

**Description**

사용자는 과제를 선택하여 상세 정보를 확인할 수 있어야 한다.

**Expected Results**

- 과제명
- 과목
- 마감일
- 설명
- 상태

가 표시된다.

---

### REQ-TASK-004 — 과제 수정

**Priority:** High

**Description**

사용자는 자신이 등록한 과제 정보를 수정할 수 있어야 한다.

**Expected Results**

- 수정된 정보가 저장된다.
- 과제 목록에 변경된 정보가 반영된다.

---

### REQ-TASK-005 — 과제 삭제

**Priority:** High

**Description**

사용자는 자신이 등록한 과제를 삭제할 수 있어야 한다.

**Actions**

1. 과제를 선택한다.
2. 삭제 버튼을 클릭한다.
3. 삭제를 확인한다.

**Expected Results**

- 과제가 삭제된다.
- 과제 목록에서 해당 과제가 제거된다.

---

### REQ-TASK-006 — 과제 입력값 검증

**Priority:** High

**Description**

과제 등록 및 수정 시 입력값을 검증해야 한다.

**Validation Rules**

- 과제명은 필수이다.
- 과목은 필수이다.
- 마감일은 필수이다.
- 과제명은 공백만으로 구성될 수 없다.

**Expected Results**

- 유효하지 않은 입력은 저장되지 않는다.
- 입력 오류 메시지가 표시된다.

---

# 7. Task Status

### REQ-STATUS-001 — 과제 완료 처리

**Priority:** High

**Description**

사용자는 과제의 상태를 완료로 변경할 수 있어야 한다.

**Actions**

1. 미완료 과제를 선택한다.
2. 완료 버튼 또는 상태 변경 기능을 실행한다.

**Expected Results**

- 과제 상태가 완료로 변경된다.
- UI에 변경된 상태가 표시된다.

---

### REQ-STATUS-002 — 과제 미완료 처리

**Priority:** Medium

**Description**

완료된 과제를 다시 미완료 상태로 변경할 수 있어야 한다.

**Expected Results**

- 과제 상태가 미완료로 변경된다.
- 변경된 상태가 UI에 반영된다.

---

# 8. Search and Filter

### REQ-SEARCH-001 — 과제 검색

**Priority:** High

**Description**

사용자는 과제명을 기준으로 자신의 과제를 검색할 수 있어야 한다.

**Actions**

1. 검색창에 검색어를 입력한다.

**Expected Results**

- 검색어와 일치하는 과제가 표시된다.
- 일치하지 않는 과제는 표시되지 않는다.
- 검색 결과가 없을 경우 적절한 안내가 표시된다.

---

### REQ-FILTER-001 — 과목별 필터

**Priority:** Medium

**Description**

사용자는 특정 과목에 속한 과제만 조회할 수 있어야 한다.

**Expected Results**

- 선택한 과목의 과제만 표시된다.

---

### REQ-FILTER-002 — 상태별 필터

**Priority:** Medium

**Description**

사용자는 완료 또는 미완료 상태를 기준으로 과제를 필터링할 수 있어야 한다.

**Expected Results**

- 완료 필터 선택 시 완료된 과제만 표시된다.
- 미완료 필터 선택 시 미완료 과제만 표시된다.

---

### REQ-FILTER-003 — 복합 필터

**Priority:** Medium

**Description**

사용자는 과목과 상태 조건을 동시에 적용하여 과제를 조회할 수 있어야 한다.

**Expected Results**

- 선택한 모든 조건을 만족하는 과제만 표시된다.
- 조건에 해당하는 과제가 없으면 결과 없음 상태가 표시된다.

---

# 9. Dashboard

### REQ-DASH-001 — 사용자별 Dashboard

**Priority:** Medium

**Description**

로그인한 사용자는 자신의 과제 현황을 Dashboard에서 확인할 수 있어야 한다.

**Dashboard Information**

- 전체 과제 수
- 완료 과제 수
- 미완료 과제 수
- 마감 임박 과제 수

**Expected Results**

- 현재 로그인한 사용자의 데이터만 집계된다.
- 과제 상태 변경 시 통계가 적절하게 변경된다.

---

### REQ-DASH-002 — 보호된 Dashboard 접근

**Priority:** High

**Description**

로그인하지 않은 사용자는 Dashboard에 접근할 수 없어야 한다.

**Expected Results**

- 비로그인 상태에서 Dashboard 접근 시 로그인 페이지로 이동한다.

---

# 10. Error Handling

### REQ-ERROR-001 — API 오류 처리

**Priority:** High

**Description**

서버 또는 API 요청에서 오류가 발생할 경우 사용자에게 적절한 오류 상태를 표시해야 한다.

**Expected Results**

- 오류 발생 사실을 사용자에게 알린다.
- 애플리케이션이 비정상적으로 종료되지 않는다.
- 사용자는 필요한 경우 다시 요청할 수 있다.

---

### REQ-ERROR-002 — 존재하지 않는 리소스 처리

**Priority:** Medium

**Description**

존재하지 않는 과목 또는 과제를 요청할 경우 적절한 오류를 반환해야 한다.

**Expected Results**

- 서버는 적절한 오류 상태를 반환한다.
- 존재하지 않는 리소스에 대한 수정 또는 삭제가 수행되지 않는다.

---

# 11. Navigation

### REQ-NAV-001 — 주요 페이지 이동

**Priority:** Medium

**Description**

사용자는 주요 기능 페이지 간 이동이 가능해야 한다.

**Required Pages**

- Login
- Register
- Dashboard
- Subjects
- Tasks

**Expected Results**

- 각 페이지로 정상적으로 이동할 수 있다.
- 로그인 상태에 따라 접근 가능한 페이지가 달라진다.

---

# 12. Non-Functional Requirements

## REQ-NFR-001 — 데이터 일관성

과목 또는 과제의 생성, 수정, 삭제 결과는 데이터베이스와 UI에 일관되게 반영되어야 한다.

---

## REQ-NFR-002 — 사용자 데이터 보안

사용자는 다른 사용자의 데이터를 조회, 수정 또는 삭제할 수 없어야 한다.

---

## REQ-NFR-003 — 테스트 가능성

주요 기능은 Playwright를 이용한 End-to-End 테스트가 가능하도록 구현해야 한다.

주요 UI 요소에는 안정적인 접근 방법을 제공한다.

예:

- Role
- Label
- Accessible Name
- Test ID

---

## REQ-NFR-004 — 요구사항 추적성

각 기능 요구사항은 하나 이상의 테스트 케이스와 연결될 수 있어야 한다.

추적 관계는 다음과 같다.

```text
REQ-ID
  ↓
Test Goal ID (G1–G5, 네 변형 공통)
  ↓
Scenario ID (Goal × Variant A–D)
  ↓
LLM Suite ID (Scenario × 반복)
  ↓
Fault ID (F1–F7)
  ↓
Execution Result / Label
```

v1.0의 Human Test Case ID 단계는 v2.0에서 **결함별 기준 테스트(reference test)**로 역할이 바뀌었다 (15장 참조).

---

# 13. Requirement Priority

요구사항의 우선순위는 다음과 같이 정의한다.

| Priority | Meaning |
|---|---|
| Critical | 시스템 핵심 기능 또는 연구 실험의 핵심 조건 |
| High | 정상적인 서비스 이용에 필수적인 기능 |
| Medium | 서비스 기능을 확장하거나 테스트 다양성을 높이는 기능 |
| Low | 향후 확장을 위한 기능 |

---

# 14. Research-oriented Requirement Classification

LLM Test Case Generation 실험을 위해 요구사항을 다음과 같이 분류한다.

| Category | Description |
|---|---|
| Positive | 정상적인 사용 시나리오 |
| Negative | 잘못된 입력 또는 실패 시나리오 |
| Boundary | 경계값 및 극단값 |
| State | 상태 변화와 관련된 시나리오 |
| Authorization | 인증 및 데이터 접근 제어 |
| Integration | 여러 기능이 연결된 시나리오 |

예를 들어:

```text
REQ-TASK-001
→ Positive

REQ-TASK-006
→ Negative / Boundary

REQ-USER-001
→ Authorization

REQ-STATUS-001
→ State

REQ-FILTER-003
→ Integration
```

---

# 15. Research Traceability

StudyFlow는 각 요구사항을 테스트 및 결함과 연결할 수 있도록 설계한다.

## 15.1 Requirement → Test Goal

```text
REQ-STATUS-001  →  G2 (과제 완료 처리)
```

테스트 목표는 네 앱 변형(A–D)에서 동일하다 (`research/design/conditions.md`).

↓

## 15.2 Scenario (Goal × Variant)

```text
G2-B   (research/scenarios/G2-B.json)
```

시나리오에는 사용자가 관찰 가능한 기대 동작만 기술하며, 변형 ID와 결함 정보는 포함하지 않는다.

↓

## 15.3 LLM Suite

```text
G2-B_r1  (생성 반복 1, research/llm-results/runs/<run_id>/)
```

↓

## 15.4 Fault

```text
F1  (research/faults/catalog.yaml)
```

각 결함에는 사람이 작성한 **기준 테스트(reference test)**를 두어, 결함이 관찰 가능함을 사전에 확인한다 (`tests/reference/`).

↓

## 15.5 Execution Label

```text
detected / missed / no_opportunity / oracle_error / execution_failure / environment_error / flaky
```

↓

## 15.6 Evaluation

다음 지표를 계산한다 (정의와 계산은 `docs/research/PROTOCOL.md` §6, §8).

- Fault Detection Rate (주분석 결과변수)
- 실패 유형 분포: 미탐지(missed / no_opportunity), 오라클 오류, 실행 실패
- 수정 노력: 수정 횟수, 토큰 사용량
- 오라클 약화: 수정 전후 assertion 개수 변화
- 결함 1건당 탐지 비용 (토큰)

---

# 16. Versioning Policy

요구사항 변경 시 버전을 관리한다.

```text
v1.0
v1.1
v2.0
```

### Major Version

기능 구조 또는 연구 실험 조건이 변경되는 경우 증가시킨다.

### Minor Version

기존 요구사항의 세부 내용 또는 Acceptance Criteria가 변경되는 경우 증가시킨다.

요구사항 변경은 기존 테스트 케이스와의 추적성을 유지할 수 있도록 기록한다.

---

# 17. Scope of StudyFlow v1

StudyFlow v1에서는 다음 기능을 구현 범위로 한다.

### Included

- User Registration
- Login / Logout
- User Data Isolation
- Subject CRUD
- Task CRUD
- Task Status
- Search
- Filter
- Dashboard
- Validation
- API Error Handling
- Protected Routes

### Excluded from v1

다음 기능은 연구 범위를 불필요하게 확대할 가능성이 있으므로 v1에서는 구현하지 않는다.

- Social Login
- Email Verification
- Password Reset
- Real-time Notification
- Chat
- File Upload
- Payment
- Calendar Synchronization
- Mobile Application
- Multi-level Administrator
- Social Features
- Recommendation System

---

# 18. Definition of Done

StudyFlow v1은 다음 조건을 만족하면 기능 구현이 완료된 것으로 정의한다.

1. 사용자가 회원가입할 수 있다.
2. 사용자가 로그인 및 로그아웃할 수 있다.
3. 로그인하지 않은 사용자는 보호된 페이지에 접근할 수 없다.
4. 사용자는 자신의 과목을 CRUD할 수 있다.
5. 사용자는 자신의 과제를 CRUD할 수 있다.
6. 사용자는 과제 상태를 변경할 수 있다.
7. 사용자는 과제를 검색할 수 있다.
8. 사용자는 과제를 필터링할 수 있다.
9. Dashboard에서 자신의 과제 현황을 확인할 수 있다.
10. 사용자는 다른 사용자의 데이터에 접근할 수 없다.
11. 주요 입력값에 대한 validation이 동작한다.
12. API 오류가 적절하게 처리된다.
13. 주요 요구사항에 대해 Playwright E2E 테스트가 작성될 수 있다.
14. 모든 주요 기능이 Requirement ID와 연결될 수 있다.

---

# 19. Research Design Principle

StudyFlow의 기능 구현은 단순히 실제 서비스를 만드는 것을 목적으로 하지 않는다.

본 시스템은 **LLM 기반 Web QA Test Case Generation의 통제된 실험 환경**으로 사용한다.

따라서 기능을 추가할 때 다음 원칙을 적용한다.

1. 모든 주요 기능은 명시적인 Requirement ID를 가진다.
2. 모든 Requirement는 검증 가능한 Expected Result를 가진다.
3. 모든 주요 Requirement는 테스트 케이스로 변환 가능해야 한다.
4. 일부 요구사항은 의도적으로 결함을 주입하여 Fault Detection 실험에 사용한다.
5. 핵심 기능과 테스트 목표는 네 앱 변형(A–D)에서 동일하게 유지하고, 상태 반영 범위와 페이지 간 데이터 흐름만 변형에 따라 달리한다.
6. 결함과 변형은 환경변수 스위치(`STUDYFLOW_VARIANT`, `STUDYFLOW_FAULT`)로 전환하며, 결함 코드 도달을 기록한다.
7. 결함 정보·변형 ID·연구용 API는 LLM에 제공되는 어떤 입력에도 노출하지 않는다.
8. 테스트 실행 결과는 정량적인 평가 데이터로 저장한다.
9. 애플리케이션 버전(git commit), 요구사항 버전, 프롬프트 버전, 모델 버전 및 Fault 버전을 기록한다.

최종적으로 다음의 연구 데이터 구조를 구축한다.

```text
Requirement
    │
    └── Test Goal (G1–G5)
             │
             ├── × Variant A / B / C / D  →  Scenario
             │                                  │
             │                         LLM Suites (× 3 반복)
             │                                  │
             └── Injected Faults (F1–F7) ───────┤
                  + Reference Tests             │
                                                ↓
                                     Playwright Execution
                                     (+ fault reach markers)
                                                │
                                                ↓
                                        Evaluation Dataset
                                                │
                                                ├── Fault Detection (detected / missed / no_opportunity)
                                                ├── Oracle Error / Execution Failure / Flaky
                                                ├── Repair Effort & Token Cost
                                                └── DOM Covariates
```