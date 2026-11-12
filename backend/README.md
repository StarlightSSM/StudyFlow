# StudyFlow Backend 실행 매뉴얼

Node.js + Express + TypeScript(ESM) API 서버입니다. DB는 Node 내장 SQLite(`node:sqlite`)를 써서 별도 설치가 필요 없습니다.
전체 실행 순서는 [`docs/RUNNING.md`](../docs/RUNNING.md)를 참고하세요.

## 1. 준비
- Node.js 22.13 이상 (`node:sqlite` 사용, 확인: `node -v`)

```powershell
cd "C:\Users\sumin\Desktop\1학기\이번 연구 프로젝트\StudyFlow\backend"
npm install          # 최초 1회
```

## 2. 실행
```powershell
npm run dev          # http://localhost:3000 (코드 수정 시 자동 재시작)
```
- 정상 메시지: `StudyFlow backend running on http://localhost:3000`
- `ExperimentalWarning: SQLite is an experimental feature`는 Node 내장 SQLite의 안내 메시지입니다. 무시해도 됩니다.
- 확인: http://localhost:3000/api/health 에서 `{"status":"ok",...}`가 나오면 정상입니다.
- 종료: `Ctrl+C`

## 3. 환경변수
**서버를 시작하기 전에** 같은 터미널에서 설정합니다(PowerShell: `$env:이름="값"`).

| 변수 | 값 | 기본값 | 의미 |
|---|---|---|---|
| `STUDYFLOW_RESEARCH_API` | `1` | (꺼짐) | 하네스 전용 `/api/__research` 사용. **실험할 때는 반드시 켭니다.** |
| `STUDYFLOW_VARIANT` | `A`–`D` | `A` | 앱 변형. 잘못된 값이면 시작할 때 오류가 납니다. |
| `STUDYFLOW_FAULT` | `none`, `F1`–`F7` | `none` | 켤 결함 (한 번에 하나) |
| `STUDYFLOW_REACH_LOG` | 파일 경로 (**절대 경로 권장**) | (없음) | 결함 코드 도달 기록(JSONL) 위치 |
| `STUDYFLOW_DB` | 파일 경로 | `backend/data/studyflow.db` | SQLite 파일 위치 |

```powershell
# 예: 변형 B, 결함 없음, 연구용 API 켜기
$env:STUDYFLOW_RESEARCH_API="1"; $env:STUDYFLOW_VARIANT="B"; $env:STUDYFLOW_FAULT="none"
npm run dev
```

## 4. API
### 서비스 API
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/health` | 서버 상태 |
| GET | `/api/subjects` | 과목 목록 |
| GET | `/api/tasks?status=todo\|done` | 과제 목록 (최신 등록순). `status`를 빼면 전체 |
| GET | `/api/tasks/summary` | `{ total, done, todo }` |
| PATCH | `/api/tasks/:id/status` | 본문 `{ "status": "done" }` 또는 `"todo"`. 잘못된 값이면 400, 없는 과제면 404 |

### 연구용 API (`STUDYFLOW_RESEARCH_API=1`일 때만)
| 메서드 | 경로 | 설명 |
|---|---|---|
| GET | `/api/__research/info` | 현재 `{ variant, fault, reachLogEnabled }` |
| POST | `/api/__research/reset` | DB를 seed 상태로 초기화 (하네스가 실행 전마다 호출) |
| POST | `/api/__research/reach` | 프론트엔드 결함의 도달 기록 수신 |

> 연구용 API는 화면 어디에도 연결하지 않습니다. LLM에게 보여주는 정보에도 포함하지 않습니다.

## 5. DB와 seed data
- 처음 실행하면 `data/studyflow.db`를 만들고 seed data를 넣습니다. 이 파일은 git에서 제외됩니다.
- seed `seed-v1`: 사용자 1명(`student@studyflow.test`), 과목 3개, 과제 12개(완료 4 / 미완료 8). id와 시간이 고정돼 있어서 초기화할 때마다 똑같은 데이터가 만들어집니다.
- 데이터를 처음 상태로 되돌리는 방법은 두 가지입니다.
  - 서버를 끄고 `data/studyflow.db`를 삭제한 뒤 다시 실행
  - 연구용 API를 켠 상태에서 `curl -X POST http://localhost:3000/api/__research/reset`
- seed를 바꾸면 이미 생성된 테스트의 기대값이 달라집니다. `src/seed.ts`의 `SEED_VERSION`을 올리고 프로토콜 변경 이력에 남기세요.

> 로그인(REQ-AUTH)은 아직 미구현입니다. 현재는 모든 요청을 seed 사용자(id 1)의 요청으로 처리합니다(`src/routes/tasks.ts`의 `CURRENT_USER_ID`).

## 6. 스크립트
| 명령 | 설명 |
|---|---|
| `npm run dev` | 개발 서버 (`tsx watch`) |
| `npm run typecheck` | 타입 검사 (`tsc --noEmit`) |

## 7. 폴더 구조
```text
src/
├── server.ts               서버 시작 (포트 3000)
├── app.ts                  라우터 연결, 연구용 API 마운트
├── db.ts                   SQLite 연결, 스키마, resetDatabase()
├── seed.ts                 고정 seed data
├── routes/tasks.ts         과제·과목 API
└── research/experiment.ts  변형·결함 스위치, 도달 기록, /api/__research
```

## 8. 문제 해결
| 증상 | 원인 / 해결 |
|---|---|
| `EADDRINUSE :3000` | 이전 서버가 실행 중입니다. 그 터미널에서 `Ctrl+C`로 끄세요. |
| `/info`가 설정과 다르게 나옴 | 서버가 환경변수를 설정하기 **전에** 시작됐습니다. 끄고 설정한 뒤 다시 시작하세요. |
| `/api/__research/...`가 404 | `STUDYFLOW_RESEARCH_API=1` 없이 시작했습니다. |
| `npm ERR! enoent ... package.json` | `backend` 폴더 밖에서 실행했습니다. `cd backend` 후 실행하세요. |
