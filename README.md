# StudyFlow

**LLM 기반 웹 QA 테스트 케이스 생성 및 평가 연구**

[한국어](#한국어) | [English](#english)

---

# 한국어

## 1. 프로젝트 소개

**StudyFlow**는 학생들이 자신의 과목과 과제를 관리할 수 있는 다중 사용자 웹 애플리케이션입니다.

본 프로젝트는 일반적인 웹 애플리케이션 개발뿐만 아니라, **대규모 언어 모델(LLM)이 생성한 웹 테스트 케이스의 효과를 정량적으로 평가하기 위한 통제된 연구 환경**을 구축하는 것을 목표로 합니다.

동일한 요구사항을 기준으로 사람이 직접 작성한 테스트 케이스와 LLM이 생성한 테스트 케이스를 비교하고, 테스트 커버리지, 결함 탐지율, 중복성 및 생성 시간 등을 분석합니다.

> **현재 상태:** 프로젝트 초기 설정 및 요구사항 명세 작성 단계입니다. 주요 기능은 단계적으로 구현할 예정입니다.

## 2. 연구 목표

본 프로젝트의 핵심 연구 목표는 LLM 기반 웹 QA 테스트 케이스 생성의 효과와 한계를 분석하는 것입니다.

- LLM이 생성한 테스트 케이스의 요구사항 커버리지 평가
- 사람 작성 테스트와 LLM 생성 테스트의 성능 비교
- 통제된 결함 주입을 통한 결함 탐지 효과 분석
- 테스트 케이스의 중복성과 실행 결과 분석
- 테스트 케이스 생성 시간 비교

### 연구 파이프라인

```text
요구사항 명세
    ↓
웹 애플리케이션 구현
    ↓
 ┌─────────────────┐
 │                 │
사람 작성 테스트   LLM 생성 테스트
 │                 │
 └────────┬────────┘
          ↓
   Playwright 테스트 실행
          ↓
      결과 수집
          ↓
     정량적 분석
```

## 3. 주요 기능

다음은 StudyFlow v1의 구현 계획입니다.

- **사용자 인증:** 회원가입, 로그인, 로그아웃
- **사용자 데이터 격리:** 사용자별 과목 및 과제 데이터 분리
- **과목 관리:** 과목 등록, 조회, 수정, 삭제
- **과제 관리:** 과제 등록, 조회, 수정, 삭제
- **과제 상태 관리:** 완료 및 미완료 상태 변경
- **검색 및 필터링:** 과제명 검색, 과목별·상태별 필터링
- **대시보드:** 과제 현황 및 마감 임박 과제 확인
- **입력값 검증:** 필수 입력값 및 유효하지 않은 입력 처리
- **오류 처리:** API 오류 및 존재하지 않는 리소스에 대한 처리
- **자동화 테스트:** Playwright 기반 E2E 테스트 지원

## 4. 기술 스택

| 구분 | 기술 |
|---|---|
| 프론트엔드 | React, TypeScript, Vite |
| 라우팅 | React Router |
| 상태 관리 | Zustand |
| HTTP 클라이언트 | Axios |
| 백엔드 | Node.js, Express, TypeScript |
| 데이터베이스 | SQLite |
| E2E 테스트 | Playwright |
| 단위 테스트 | Vitest |
| 연구 데이터 분석 | Python, pandas, scipy, statsmodels |
| 버전 관리 | Git, GitHub |

프론트엔드와 Playwright 테스트 패키지의 초기 설정은 완료되었습니다. 백엔드, 데이터베이스 및 분석 코드는 개발 단계에 맞춰 추가할 예정입니다.

## 5. 프로젝트 구조

```text
StudyFlow/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── tests/
│   └── package.json
├── research/
│   ├── requirements/
│   │   └── requirements.md
│   ├── test-cases/
│   ├── faults/
│   ├── llm-results/
│   └── evaluation/
├── docs/
└── README.md
```

| 디렉터리 | 설명 |
|---|---|
| `frontend/` | React 기반 웹 애플리케이션 |
| `tests/` | Playwright 자동화 테스트 |
| `research/requirements/` | 요구사항 명세 및 구조화된 요구사항 데이터 |
| `research/test-cases/` | 사람 작성 및 LLM 생성 테스트 케이스 |
| `research/faults/` | 결함 목록 및 결함 주입 실험 자료 |
| `research/llm-results/` | LLM 생성 결과, 프롬프트 및 실행 메타데이터 |
| `research/evaluation/` | 테스트 실행 결과 및 평가 데이터 |
| `docs/` | 설계 문서 및 개발 관련 자료 |

## 6. 시작하기

### 사전 준비

- Node.js 및 npm
- Git
- Visual Studio Code (권장)

### 6.1. 저장소 복제

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd StudyFlow
```

`<YOUR_GITHUB_REPOSITORY_URL>`을 실제 GitHub 저장소 주소로 변경합니다.

### 6.2. 프론트엔드 의존성 설치

```bash
cd frontend
npm install
```

### 6.3. 개발 서버 실행

```bash
npm run dev
```

터미널에 표시되는 로컬 주소로 접속합니다. 기본 설정에서는 일반적으로 `http://localhost:5173`을 사용합니다.

### 6.4. 프론트엔드 검사

`frontend/` 디렉터리에서 실행합니다.

```bash
npm run lint
npm run build
```

### 6.5. Playwright 설치

프로젝트 루트에서 별도의 터미널을 열고 실행합니다.

```bash
cd tests
npm install
npx playwright install
```

테스트 실행 명령과 대상 서버 설정은 자동화 테스트 구성이 완료된 후 확정할 예정입니다.

## 7. 연구 설계

### 7.1. 실험 환경

StudyFlow는 명시적인 요구사항과 검증 가능한 동작을 갖춘 통제된 웹 애플리케이션으로 개발합니다.

동일한 요구사항을 바탕으로 사람 작성 테스트와 LLM 생성 테스트를 구성하여 일관된 기준에서 비교할 예정입니다.

### 7.2. 평가 지표

| 지표 | 목적 |
|---|---|
| 요구사항 커버리지 (Requirement Coverage) | 테스트가 명세된 요구사항을 얼마나 포함하는지 평가 |
| 결함 탐지율 (Defect Detection Rate) | 주입된 결함 중 테스트가 탐지한 비율 평가 |
| 테스트 중복성 (Test Case Redundancy) | 테스트 간 중복되거나 불필요한 검증 분석 |
| 생성 시간 (Test Generation Time) | 테스트 케이스 작성에 필요한 시간 측정 |
| 실행 통과율 (Execution Pass Rate) | 지정된 애플리케이션 버전에서 통과한 테스트 비율 측정 |

각 지표의 구체적인 계산식과 측정 기준은 실험 프로토콜을 확정하면서 정의합니다.

### 7.3. 요구사항 추적성

각 요구사항과 테스트 케이스, 실행 결과를 연결하여 추적성을 확보합니다.

```text
Requirement ID
      ↓
Human / LLM Test Case
      ↓
Playwright Execution
      ↓
Execution Result
      ↓
Evaluation Dataset
```

### 7.4. 결함 주입 실험

특정 기능에 통제된 결함을 주입한 애플리케이션 버전을 만들어 테스트의 결함 탐지 효과를 평가할 예정입니다.

각 결함에는 고유 ID를 부여하고 관련 요구사항 및 애플리케이션 버전을 기록하여 실험 재현성을 확보합니다.

## 8. 개발 로드맵

- [x] React + TypeScript + Vite 프론트엔드 초기 설정
- [x] Playwright 테스트 패키지 초기 설정
- [x] 연구 디렉터리 구조 생성
- [x] StudyFlow v1 요구사항 명세 초안 작성
- [ ] 구조화된 요구사항 및 인수 기준 확정
- [ ] 백엔드 및 SQLite 데이터베이스 구현
- [ ] 사용자 인증 및 데이터 격리 구현
- [ ] 과목 및 과제 관리 기능 구현
- [ ] 검색, 필터링 및 대시보드 구현
- [ ] Playwright E2E 테스트 구성
- [ ] 사람 작성 테스트 케이스 구축
- [ ] 선정한 LLM을 활용한 테스트 케이스 생성
- [ ] 통제된 결함 주입 실험 수행
- [ ] 결과 분석 및 연구 결과 작성

## 9. 프로젝트 범위

StudyFlow v1은 핵심 웹 애플리케이션 기능과 테스트 가능성에 집중합니다.

다음 기능은 초기 범위에서 제외합니다.

- 소셜 로그인
- 이메일 인증 및 비밀번호 재설정
- 실시간 알림 및 채팅
- 파일 업로드
- 결제 기능
- 외부 캘린더 연동
- 네이티브 모바일 애플리케이션
- 복잡한 다단계 관리자 권한
- 추천 시스템 및 소셜 기능

본 프로젝트의 우선순위는 기능 수를 늘리는 것이 아니라 **재현 가능한 LLM 기반 테스트 생성 평가 환경을 구축하는 것**입니다.

## 10. 라이선스

현재 라이선스는 미정입니다. 사용 및 재배포 조건은 라이선스가 추가된 후 명시할 예정입니다.

---

# English

## 1. Project Overview

**StudyFlow** is a multi-user web application that allows students to manage their subjects and assignments.

Beyond application development, the project aims to establish a **controlled experimental environment for quantitatively evaluating LLM-generated test cases for web applications**.

Human-authored and LLM-generated test cases will be evaluated against the same requirements, with a focus on coverage, defect detection, redundancy, and generation time.

> **Current status:** Initial project setup and requirements specification. Core features will be implemented incrementally.

## 2. Research Objectives

The primary objective is to investigate the effectiveness and limitations of LLM-based web QA test case generation.

- Evaluate the requirement coverage of LLM-generated test cases.
- Compare human-authored and LLM-generated tests.
- Analyze defect detection effectiveness through controlled fault injection.
- Examine test case redundancy and execution outcomes.
- Compare test case generation time.

### Research Pipeline

```text
Requirements Specification
          ↓
  Web Application
          ↓
 ┌────────────────────┐
 │                    │
Human-authored     LLM-generated
    Tests              Tests
 │                    │
 └──────────┬─────────┘
            ↓
   Playwright Execution
            ↓
      Result Collection
            ↓
    Quantitative Analysis
```

## 3. Key Features

The following features are planned for StudyFlow v1.

- **User Authentication:** Registration, login, and logout.
- **User Data Isolation:** Separate subject and assignment data for each user.
- **Subject Management:** Create, read, update, and delete subjects.
- **Task Management:** Create, read, update, and delete assignments.
- **Task Status:** Mark assignments as completed or incomplete.
- **Search and Filtering:** Search assignments and filter by subject or status.
- **Dashboard:** View assignment statistics and upcoming deadlines.
- **Input Validation:** Validate required fields and invalid inputs.
- **Error Handling:** Handle API errors and requests for unavailable resources.
- **Automated Testing:** Support Playwright end-to-end testing.

## 4. Tech Stack

| Category | Technology |
|---|---|
| Frontend | React, TypeScript, Vite |
| Routing | React Router |
| State Management | Zustand |
| HTTP Client | Axios |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite |
| E2E Testing | Playwright |
| Unit Testing | Vitest |
| Research Analysis | Python, pandas, scipy, statsmodels |
| Version Control | Git, GitHub |

The frontend and Playwright test package have been initialized. Backend, database, and analysis components will be added as development progresses.

## 5. Project Structure

```text
StudyFlow/
├── frontend/
│   ├── public/
│   ├── src/
│   ├── package.json
│   └── vite.config.ts
├── tests/
│   └── package.json
├── research/
│   ├── requirements/
│   │   └── requirements.md
│   ├── test-cases/
│   ├── faults/
│   ├── llm-results/
│   └── evaluation/
├── docs/
└── README.md
```

| Directory | Description |
|---|---|
| `frontend/` | React web application |
| `tests/` | Playwright automated tests |
| `research/requirements/` | Requirements specifications and structured requirement data |
| `research/test-cases/` | Human-authored and LLM-generated test cases |
| `research/faults/` | Fault catalog and fault-injection artifacts |
| `research/llm-results/` | LLM outputs, prompts, and generation metadata |
| `research/evaluation/` | Test execution results and evaluation datasets |
| `docs/` | Design documents and development references |

## 6. Getting Started

### Prerequisites

- Node.js and npm
- Git
- Visual Studio Code (recommended)

### 6.1. Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd StudyFlow
```

Replace `<YOUR_GITHUB_REPOSITORY_URL>` with the URL of your GitHub repository.

### 6.2. Install Frontend Dependencies

```bash
cd frontend
npm install
```

### 6.3. Start the Development Server

```bash
npm run dev
```

Open the local URL displayed in the terminal. The default Vite development URL is typically `http://localhost:5173`.

### 6.4. Run Frontend Checks

From the `frontend/` directory, run:

```bash
npm run lint
npm run build
```

### 6.5. Install Playwright

Open a separate terminal at the project root and run:

```bash
cd tests
npm install
npx playwright install
```

The test execution command and target server configuration will be finalized when the automated test suite is configured.

## 7. Research Design

### 7.1. Experimental Environment

StudyFlow will be developed as a controlled web application with explicit requirements and verifiable behavior.

Human-authored and LLM-generated tests will be created from the same requirements and evaluated using consistent criteria.

### 7.2. Evaluation Metrics

| Metric | Purpose |
|---|---|
| Requirement Coverage | Measures how much of the specified functionality is covered by tests. |
| Defect Detection Rate | Measures the proportion of seeded defects detected by tests. |
| Test Case Redundancy | Examines overlapping or unnecessary test cases. |
| Test Generation Time | Measures the time required to generate test cases. |
| Execution Pass Rate | Measures the proportion of tests that pass against a specified application version. |

The exact formulas and measurement procedures will be defined as part of the experimental protocol.

### 7.3. Requirement Traceability

Requirements, test cases, and execution results will be linked to support traceability.

```text
Requirement ID
      ↓
Human / LLM Test Case
      ↓
Playwright Execution
      ↓
Execution Result
      ↓
Evaluation Dataset
```

### 7.4. Fault Injection

Controlled faults will be introduced into designated application versions to evaluate defect detection effectiveness.

Each fault will have a unique identifier and documented links to the affected requirement and application version to support reproducibility.

## 8. Development Roadmap

- [x] Initialize the React + TypeScript + Vite frontend.
- [x] Initialize the Playwright test package.
- [x] Create the research directory structure.
- [x] Draft the StudyFlow v1 requirements specification.
- [ ] Finalize structured requirements and acceptance criteria.
- [ ] Implement the backend and SQLite database.
- [ ] Implement authentication and user data isolation.
- [ ] Implement subject and assignment management.
- [ ] Implement search, filtering, and dashboard features.
- [ ] Configure Playwright E2E tests.
- [ ] Establish human-authored test cases.
- [ ] Generate test cases using selected LLMs.
- [ ] Conduct controlled fault-injection experiments.
- [ ] Analyze results and prepare research findings.

## 9. Project Scope

StudyFlow v1 focuses on core web application functionality and testability.

The initial scope excludes:

- Social login
- Email verification and password reset
- Real-time notifications and chat
- File uploads
- Payments
- External calendar synchronization
- Native mobile applications
- Complex multi-level administrative permissions
- Recommendation systems and social features

The priority is not to maximize the number of application features, but to **establish a reproducible environment for evaluating LLM-based test case generation**.

## 10. License

The project license has not yet been selected. Usage and redistribution terms will be specified when a license is added.
