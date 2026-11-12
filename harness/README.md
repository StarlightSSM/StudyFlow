# harness: LLM 테스트 생성·평가 실험 하네스

실험 절차와 판정 규칙은 [`docs/research/PROTOCOL.md`](../docs/research/PROTOCOL.md)를 따릅니다. 이 폴더는 그 프로토콜을 실행하는 코드입니다.

| 파일 | 역할 |
|---|---|
| `generate.py` | **Stage 1.** 스위트를 생성하고 정상 앱에서 검증합니다. 수정 루프는 정상 앱에서 난 실패만 받습니다. 이어서 flaky 재실행을 하고 최종 파일을 고정합니다. |
| `evaluate.py` | **Stage 2.** 고정된 스위트를 결함 앱(F1–F7)에서 실행해 detected, missed, no_opportunity를 판정합니다. *앱 기능을 구현한 뒤 작성합니다.* |
| `llm.py` | 모델 호출 계층. 모델을 바꾸면 이 파일과 `--provider`, `--model` 옵션만 바뀝니다. |
| `playwright_runner.py` | Playwright 실행과 생성 단계 라벨 판정 |
| `selftest_labels.py` | 정답 라벨을 아는 테스트로 판정기를 점검합니다. LLM을 호출하지 않아 비용이 들지 않습니다. 판정 규칙을 바꿀 때마다 실행하세요. |
| `check_connection.py` | Gemini API 연결 확인 |
| `prompts/` | 고정 프롬프트 템플릿. 내용을 바꾸면 파일명의 버전(`_v2`)을 올리세요. 해시가 `run.json`에 기록됩니다. |

## 준비 (최초 1회)
```powershell
pip install -r harness/requirements.txt
cd tests; npm install; npx playwright install chromium; cd ..
```
- API 키는 `StudyFlow/.env`에 `GEMINI_API_KEY=...`로 넣습니다. 이 파일은 git에 올라가지 않습니다.
- 지금 쓰는 Python 3.9는 지원이 끝난 버전입니다. 본 실험 전에 Python 3.12 이상과 venv 환경으로 옮기는 걸 권장합니다.

## 실행
전체 순서는 [`docs/RUNNING.md`](../docs/RUNNING.md)를 따르세요. 요약하면 다음과 같습니다.
```powershell
# 1) 앱 실행: 시나리오와 같은 변형, 결함 none (터미널 2개, 각 폴더 안에서)
#    backend : $env:STUDYFLOW_RESEARCH_API="1"; $env:STUDYFLOW_VARIANT="B"; $env:STUDYFLOW_FAULT="none"; npm run dev
#    frontend: $env:VITE_STUDYFLOW_VARIANT="B"; $env:VITE_STUDYFLOW_FAULT="none"; npm run dev

# 2) 판정기 자체 점검 (무료)
python harness/selftest_labels.py

# 3) 생성 + 정상 앱 검증 (StudyFlow 루트에서)
python harness/generate.py --scenario research/scenarios/G2-B.json --reps 3
```

**자동 사전 점검**
- 연구용 API가 꺼져 있으면 중단합니다.
- 결함이 켜진 앱이면 중단합니다.
- 시나리오의 변형과 앱의 변형이 다르면 중단합니다.
- 통과하면, snapshot 캡처 전과 Playwright 실행 전마다 DB를 seed 상태로 초기화합니다.

연구용 API가 없는 앱에서만 `--no-reset`을 쓰세요. `SMOKE-*` 시나리오는 Vite 기본 화면(commit `d6eb633`)이 대상이라 현재 앱에서는 쓰지 않습니다.

## 결과 위치: `research/llm-results/runs/<run_id>/`
| 파일 | 내용 |
|---|---|
| `run.json` | 모델, 실제로 응답한 모델 버전, 프롬프트 해시, 앱 git commit, 도구 버전 |
| `calls.jsonl` | LLM 호출 1회당 1줄: 응답 원문, 토큰(생각 토큰 포함), 지연 시간, 실패한 시도 |
| `executions.jsonl` | Playwright 실행 1회당 1줄: 라벨, 오류 발췌, `expect` 개수 |
| `suites.jsonl` | 스위트 1개당 1줄: 최종 라벨, 수정 이력, flaky 재실행 결과, 비용 합계, DOM 공변량 |
| `specs/`, `snapshots/` | 생성된 모든 코드(단계별), LLM에 보여준 ARIA snapshot |
| `pw-artifacts/` | 실패 시 trace, 스크린샷, 녹화. git에서 제외합니다. |

## 스모크 검증 기록 (2026-11-12, Vite 기본 화면 대상)
- `pilot-smoke-001`: `gemini-3.5-flash`를 요청했는데 **`gemini-3.6-flash`가 응답**했습니다. 2회 반복 모두 step 0에서 `valid`였고, flaky 재실행 3회도 모두 통과했습니다.
- `pilot-smoke-002`: 명세를 일부러 틀리게 준 시나리오입니다. step 0에서 `oracle_error`가 났고, 정상 앱 실패만 받아 1회 수정한 뒤 `valid`가 됐습니다. `expect` 개수는 2개 그대로 유지됐습니다.
- `selftest_labels.py`: 4개 사례(valid, oracle_error, locator 실패, 문법 오류)가 모두 통과했습니다.
