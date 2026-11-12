# StudyFlow 실행 매뉴얼 (전체)

프론트엔드, 백엔드, 실험 하네스를 함께 실행하는 순서를 정리한 문서입니다. 각 구성요소의 세부 내용은 아래 문서에 있습니다.
- [frontend/README.md](../frontend/README.md): 화면, 변형별 동작, 결함 코드 위치
- [backend/README.md](../backend/README.md): API, 환경변수, DB·seed
- [harness/README.md](../harness/README.md): 실험 하네스 옵션과 결과 파일
- [docs/research/PROTOCOL.md](research/PROTOCOL.md): 판정 규칙과 분석 계획

> 아래 명령은 모두 **Windows PowerShell(VS Code 터미널)** 기준입니다. 경로에 한글과 공백이 있으니 `cd` 경로는 큰따옴표로 감싸세요.

---

## 0. 한눈에 보기

| 터미널 | 위치 | 하는 일 |
|---|---|---|
| ① | `StudyFlow\backend` | 백엔드 서버 (:3000) |
| ② | `StudyFlow\frontend` | 프론트엔드 서버 (:5173) |
| ③ | `StudyFlow` (루트) | 하네스 실행, 테스트 실행 |

**세 가지 규칙**
1. `npm run dev`는 **반드시 `backend` 또는 `frontend` 폴더 안에서** 실행합니다. 루트에는 `package.json`이 없습니다.
2. 환경변수는 **서버를 시작하기 전에** 설정합니다. 이미 실행 중인 서버에는 반영되지 않습니다.
3. 백엔드와 프론트엔드의 변형·결함 값은 **항상 같게** 맞춥니다.

---

## 1. 처음 한 번만 (설치)
```powershell
cd "C:\Users\sumin\Desktop\1학기\이번 연구 프로젝트\StudyFlow"
cd backend;  npm install; cd ..
cd frontend; npm install; cd ..
cd tests;    npm install; npx playwright install chromium; cd ..
pip install -r harness/requirements.txt
```
- Gemini API 키는 루트의 `.env` 파일에 `GEMINI_API_KEY=...`로 넣습니다. 이 파일은 git에 올라가지 않습니다.
- 필요한 버전: Node.js 22.13 이상, Python 3.9 이상(3.12 권장).

---

## 2. 평소 개발: 앱만 띄워서 보기

**터미널 ①**
```powershell
cd "C:\Users\sumin\Desktop\1학기\이번 연구 프로젝트\StudyFlow\backend"
$env:STUDYFLOW_RESEARCH_API="1"; $env:STUDYFLOW_VARIANT="A"; $env:STUDYFLOW_FAULT="none"
npm run dev
```
**터미널 ②**
```powershell
cd "C:\Users\sumin\Desktop\1학기\이번 연구 프로젝트\StudyFlow\frontend"
$env:VITE_STUDYFLOW_VARIANT="A"; $env:VITE_STUDYFLOW_FAULT="none"
npm run dev
```
**확인**
- http://localhost:5173 : 과제 목록 화면
- http://localhost:3000/api/__research/info : `{"variant":"A","fault":null,...}`

변형 B를 보려면 두 터미널 모두 `Ctrl+C`로 끄고, `A`를 `B`로 바꿔 다시 실행합니다.

---

## 3. 실험 Stage 1: LLM 테스트 생성 (정상 앱)

생성 단계는 **결함이 꺼진 앱**에서, **시나리오와 같은 변형**으로 실행합니다. 이 두 조건이 맞지 않으면 하네스가 실행을 거부합니다.

1. §2처럼 터미널 ①②를 **변형 B, 결함 none**으로 실행합니다.
2. **터미널 ③**에서 실행합니다.
```powershell
cd "C:\Users\sumin\Desktop\1학기\이번 연구 프로젝트\StudyFlow"
python harness/selftest_labels.py                                         # 판정기 점검 (무료)
python harness/generate.py --scenario research/scenarios/G2-B.json --reps 3
```
3. 결과는 `research/llm-results/runs/<run_id>/suites.jsonl`에 쌓입니다. 각 스위트의 `final_label`이 `valid`이면 Stage 2에 쓸 수 있습니다.

- 하네스는 Playwright를 실행하기 전마다 DB를 seed 상태로 되돌립니다.
- 변형 A 시나리오(`G2-A.json`)는 앱을 변형 A로 다시 띄운 뒤 실행합니다. **한 번에 한 변형만** 실행합니다.

---

## 4. 실험 Stage 2 미리보기: 결함 앱에서 실행

`harness/evaluate.py`는 아직 작성 전입니다. 그때까지는 수동으로 확인합니다.

1. 터미널 ①②를 **같은 변형 + 결함**으로 다시 실행합니다. 도달 기록 경로는 절대 경로로 씁니다.
```powershell
# ① backend
$env:STUDYFLOW_RESEARCH_API="1"; $env:STUDYFLOW_VARIANT="B"; $env:STUDYFLOW_FAULT="F1"
$env:STUDYFLOW_REACH_LOG="C:\Users\sumin\Desktop\1학기\이번 연구 프로젝트\StudyFlow\research\evaluation\reach.jsonl"
npm run dev
# ② frontend
$env:VITE_STUDYFLOW_VARIANT="B"; $env:VITE_STUDYFLOW_FAULT="F1"
npm run dev
```
2. 터미널 ③에서 DB를 초기화하고, 고정된 생성 테스트를 실행합니다.
```powershell
curl.exe -X POST http://localhost:3000/api/__research/reset
cd tests
npx playwright test llm-generated/<run_id>/<suite>_s<step>.spec.ts --reporter=line
```
3. 판정합니다(PROTOCOL §6.2).
   - 테스트 실패 + `reach.jsonl`에 기록 있음 → **detected**
   - 테스트 통과 + 기록 있음 → **missed**
   - 테스트 통과 + 기록 없음 → **no_opportunity**

---

## 5. 결함 유효성 검증 (기준 테스트)

결함을 새로 구현하면, 본 실험에 넣기 전에 사람이 작성한 기준 테스트(`tests/reference/F<n>.spec.ts`)로 확인합니다.

| 앱 상태 | 기준 테스트 결과 | 도달 기록 |
|---|---|---|
| 해당 변형 + 결함 none | **통과**해야 함 | 없음 |
| 해당 변형 + 결함 Fn | **실패**해야 함 | Fn 기록 있어야 함 |

```powershell
curl.exe -X POST http://localhost:3000/api/__research/reset
cd tests; npx playwright test reference/F1.spec.ts --reporter=line
```
F1 검증 결과(2026-11-12): 정상 B에서 3회 연속 통과했습니다. B + F1에서는 `완료 5 / 전체 12`를 기대했는데 `완료 4`가 나와 실패했고, 도달 기록이 남았습니다.

---

## 6. 끄기와 정리
- 각 서버 터미널에서 `Ctrl+C`를 누르고, `일괄 작업을 끝내시겠습니까?`가 나오면 `Y`를 누릅니다.
- 현재 터미널에 설정한 실험 환경변수를 지우려면:
```powershell
Remove-Item Env:STUDYFLOW_*, Env:VITE_STUDYFLOW_* -ErrorAction SilentlyContinue
```

---

## 7. 문제 해결

| 증상 | 원인 | 해결 |
|---|---|---|
| `npm ERR! enoent ... StudyFlow\package.json` | 루트에서 `npm run dev`를 실행함 | `cd backend` 또는 `cd frontend` 후 실행 |
| `/info`가 설정한 값과 다름 (예: A, null) | 환경변수 설정 전에 시작한 서버가 아직 실행 중 | 그 서버를 `Ctrl+C`로 끄고, 설정한 뒤 다시 시작 |
| `EADDRINUSE :3000` / `Port 5173 is already in use` | 이전 서버가 실행 중 | 이전 터미널에서 `Ctrl+C` |
| 하네스: `research API not reachable` | 백엔드를 `STUDYFLOW_RESEARCH_API=1` 없이 시작함 | 백엔드를 그 값으로 다시 시작 |
| 하네스: `backend runs with fault F1` | 결함이 켜진 앱에서 생성 단계를 실행하려 함 | 두 서버를 결함 none으로 다시 시작 |
| 하네스: `scenario variant does not match` | 시나리오 변형과 앱 변형이 다름 | 앱을 시나리오 변형으로 다시 시작 |
| Gemini `503 UNAVAILABLE` | 모델 서버 과부하 | 하네스가 자동으로 재시도·기록합니다. 계속되면 잠시 후 다시 실행 |
| 화면에 "과제 목록을 불러오지 못했습니다." | 백엔드가 꺼져 있음 | 터미널 ① 확인 |
