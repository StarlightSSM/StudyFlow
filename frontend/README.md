# StudyFlow Frontend 실행 매뉴얼

React + TypeScript + Vite로 만든 StudyFlow 화면입니다. 실험을 위해 **앱 변형(A–D)**과 **결함(F1–F7)** 스위치를 갖고 있습니다.
전체 실행 순서는 [`docs/RUNNING.md`](../docs/RUNNING.md)를 참고하세요.

## 1. 준비
- Node.js 22 이상 (설치 확인: `node -v`)
- 백엔드가 http://localhost:3000 에서 실행 중이어야 합니다. 프론트엔드는 `/api/*` 요청을 백엔드로 넘겨줍니다(프록시).

```powershell
cd "C:\Users\sumin\Desktop\1학기\이번 연구 프로젝트\StudyFlow\frontend"
npm install          # 최초 1회
```

## 2. 실행
```powershell
npm run dev          # http://localhost:5173
```
- 브라우저에서 http://localhost:5173 을 열면 `/tasks`(과제 목록)로 이동합니다.
- 포트는 5173으로 고정돼 있습니다(`strictPort`). 이미 사용 중이면 시작하지 않고 오류를 냅니다. 이전에 실행한 서버를 먼저 끄세요.
- 종료: `Ctrl+C`

## 3. 실험 스위치 (환경변수)
**서버를 시작하기 전에** 같은 터미널에서 설정합니다. 이미 실행 중인 서버에는 반영되지 않습니다.

| 변수 | 값 | 기본값 | 의미 |
|---|---|---|---|
| `VITE_STUDYFLOW_VARIANT` | `A`, `B` (`C`, `D`는 아직 미구현) | `A` | 앱 변형 |
| `VITE_STUDYFLOW_FAULT` | `none`, `F1`–`F7` | `none` | 켤 결함 (한 번에 하나) |

```powershell
$env:VITE_STUDYFLOW_VARIANT="B"; $env:VITE_STUDYFLOW_FAULT="none"
npm run dev
```
> 백엔드의 `STUDYFLOW_VARIANT`, `STUDYFLOW_FAULT`와 **같은 값**으로 맞춰야 합니다. 프론트엔드 결함의 도달 기록은 백엔드가 남기기 때문입니다.

### 변형별 화면 차이 (G2: 과제 완료 처리)

| 변형 | 완료 체크박스를 누르면 |
|---|---|
| A (상태 의존성↓) | 그 행의 상태만 `완료`로 바뀝니다. 필터 결과와 다른 값은 그대로입니다. |
| B (상태 의존성↑) | 행 상태와 함께 상단 **과제 현황**(완료 N / 전체 M, 미완료, 진행률)이 갱신되고, 현재 필터도 다시 적용됩니다. |

### 구현된 결함
| 결함 | 변형 | 동작 | 코드 위치 |
|---|---|---|---|
| F1 상태 갱신 누락 | B | 완료 처리 후 과제 현황이 갱신되지 않음 | `src/store/tasks.ts` `setStatus` |

## 4. 스크립트
| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (코드 수정 시 자동 반영) |
| `npm run build` | 타입 검사 + 배포용 빌드 (`dist/`) |
| `npm run lint` | ESLint 검사 |
| `npm run preview` | 빌드 결과 미리보기 |

## 5. 폴더 구조
```text
src/
├── main.tsx                  진입점 (BrowserRouter)
├── App.tsx                   라우팅: /tasks, /help (C·D 변형은 안내 문구)
├── api.ts                    백엔드 API 호출 (axios, baseURL /api)
├── store/tasks.ts            과제 상태 관리 (zustand). 변형 A와 B의 차이가 구현된 곳
├── pages/TasksPage.tsx       과제 목록, 상태 필터, 완료 체크박스
├── pages/HelpPage.tsx        도움말 (모든 변형에 존재, 화면 수 통제용)
├── components/Layout.tsx     상단 메뉴
├── components/SummaryPanel.tsx  과제 현황 (변형 B·D에서만 표시)
└── research/experiment.ts    변형·결함 스위치, 결함 도달 기록
```

## 6. 결함 코드 작성 규칙
```ts
if (isFaultActive('F1')) {
  markFaultReached('F1', 'tasksStore.setStatus.refreshSummary') // 도달 기록
  // ...결함 동작...
} else {
  // ...정상 동작...
}
```
- 결함 ID, 변형 ID는 **화면(DOM)에 절대 표시하지 않습니다.** LLM이 보는 정보에 섞이면 안 되기 때문입니다.
- 결함을 하나 추가하면 `tests/reference/F<n>.spec.ts` 기준 테스트도 함께 작성합니다([`docs/RUNNING.md`](../docs/RUNNING.md) §5).
- 접근성 이름(role, label)은 테스트가 사용하므로, 바꿀 때는 시나리오 명세(`research/scenarios/`)도 같이 확인하세요.

## 7. 문제 해결
| 증상 | 원인 / 해결 |
|---|---|
| `Port 5173 is already in use` | 이전 서버가 아직 실행 중입니다. 그 터미널에서 `Ctrl+C`로 끄세요. |
| 화면에 "과제 목록을 불러오지 못했습니다." | 백엔드가 꺼져 있습니다. `backend`에서 `npm run dev`를 실행하세요. |
| 변형을 바꿨는데 화면이 그대로 | 환경변수는 시작할 때만 읽습니다. `Ctrl+C`로 끄고 값을 설정한 뒤 다시 `npm run dev` 하세요. |
| `npm ERR! enoent ... package.json` | `frontend` 폴더 밖에서 실행했습니다. `cd frontend` 후 실행하세요. |
