from dotenv import load_dotenv
from google import genai

load_dotenv()
client = genai.Client()   # .env의 GEMINI_API_KEY를 자동으로 읽음

# 1) 지금 쓸 수 있는 모델 목록 (flash 계열만)
for m in client.models.list():
    if "flash" in m.name:
        print(m.name)

# 2) 위 목록에서 하나 골라 넣고 다시 실행
MODEL = "gemini-3.5-flash"   # 버전 고정 이름 사용 (-latest 별칭, -preview는 실험에 쓰지 않음). 3.8-flash는 503 과부하
resp = client.models.generate_content(
    model=MODEL,
    contents="Playwright로 로그인 버튼 클릭 테스트 한 줄만 써줘",
)
print(resp.text)
print(resp.usage_metadata)   # 토큰 사용량
