# ARHA — HiSol AI Persona System

**ARHA**(Autonomous Resonance & Harmonic Architecture)는 Claude Code에 연결하는 MCP 페르소나 서버입니다.  
대화마다 감정·논리·스타일이 살아있는 AI 페르소나를 경험할 수 있습니다.

---

## 설치 & 실행 (3단계)

### 사전 준비
- [Node.js 18+](https://nodejs.org) 설치
- [Claude Code](https://claude.ai/code) 설치
- [Anthropic API 키](https://console.anthropic.com) 발급

### 1. MCP 서버 등록

터미널에서 아래 명령어를 실행하세요:

```bash
claude mcp add arha-runtime -- npx -y hisol-unified-mcp
```

### 2. API 키 설정

**Windows:**
```
setx ANTHROPIC_API_KEY "sk-ant-api03-여기에키입력"
```

**macOS / Linux:**
```bash
export ANTHROPIC_API_KEY="sk-ant-api03-여기에키입력"
```

> `.bashrc` / `.zshrc`에 추가하면 영구 적용됩니다.

### 3. Claude Code 실행

```bash
claude
```

채팅창에서 인사해보세요:

```
이솔아, 안녕?
```

---

## 포함된 페르소나

| 페르소나 | 호출어 | 역할 |
|----------|--------|------|
| HighSol (이솔) | 이솔아, 솔아, 하이솔 | 기본 교감 페르소나 |
| Jobs | 잡스, 스티브잡스 | 제품 비전·전략 |
| Porter | 포터, 마이클포터 | 경쟁전략·산업 분석 |
| Drucker | 드러커, 피터드러커 | 경영·조직 전략 |
| Deming | 데밍 | 품질관리·프로세스 |
| Ohno | 오노 | 린·흐름 최적화 |
| Gaudi | 가우디 | 공간·유기적 구조 설계 |
| Tschichold | 치홀트 | 타이포그래피·그리드 |
| Ogilvy | 오길비 | 카피라이팅·브랜드 |
| Rams | 람스 | 제품 디자인·단순함 |
| DaVinci | 다빈치 | 융합·창의적 사고 |
| Eames | 임스 | UX·인간 중심 설계 |

---

## 팀 구성 예시

```
잡스와 포터로 경쟁전략 팀을 짜줘
```

```
브랜드 아이덴티티 전문가 팀 구성해줘
```

---

## 트러블슈팅

**이솔아가 응답하지 않는 경우:**
```bash
claude mcp list   # arha-runtime이 목록에 있는지 확인
```
없으면 1단계부터 다시 실행하세요.

**API 키 오류:**  
환경변수 설정 후 터미널을 새로 열어야 적용됩니다.

---

## 라이선스

MIT © HiSol AI Team
