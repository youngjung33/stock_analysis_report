# AI 분석 연동 계획

정형화된 포트폴리오·종목 데이터를 **Context Pack**으로 조립하고, 자체 AI 또는 외부 AI API에 전달한 뒤 **Insight Pack** (정형 JSON)으로 받아 UI에 표시하는 시스템 설계안.

> 현재 앱은 rule-based 리포트(`buildStockPriceExplanationReport`, 포트폴리오 RSI/뉴스 인사이트 등)가 이미 있다.  
> AI 레이어는 **사실 데이터를 새로 수집하지 않고**, 기존 use case 산출물을 요약·해석·연결하는 **추가 레이어**로 둔다.

관련 문서: [PLAN.md](PLAN.md) · [USECASES.md](USECASES.md) · [investor-profile.md](investor-profile.md)

---

## 1. 목표

| 목표 | 설명 |
|------|------|
| **정형 입력** | DB·시세 API raw가 아닌, 버전이 있는 JSON Context Pack |
| **정형 출력** | Zod/JSON Schema로 검증 가능한 Insight Pack |
| **Provider 교체** | OpenAI · Anthropic · 자체 HTTP endpoint 등 동일 port로 교체 |
| **1차 화면** | **내 정보** (`/my-info`) 포트폴리오 AI 해석 · **종목 집중** (`/market/analysis`, `/stocks/[symbol]`) 단일 종목 AI 해석 |
| **비침습** | 기존 rule-based 리포트 유지 — AI 실패 시 fallback |

---

## 2. 현재 자산 (재사용)

AI Context Pack은 아래 **이미 계산된 데이터**에서만 조립한다.

### 2.1 내 정보 / 포트폴리오

| 소스 | Use Case / 모듈 | 포함 데이터 |
|------|-----------------|-------------|
| 대시보드 요약 | `GetDashboardUseCase` | 평가금·손익·현금 잔액 |
| 포트folio 분석 | `GetPortfolioAnalysisUseCase` | 기간 수익률·벤치마크 α·종목별 RSI·뉴스 헤드라인 |
| 시뮬레이션 | `GetPortfolioSimulationUseCase` | 목표 비중 대비 유지/축소/매수 검토 |
| 투자 성향 | `StoredInvestorProfile` | composite·tags·preferredTags·adjustment |
| 선호 비중 | `PortfolioPreferenceEntity` | KR/US·maxSingleWeight |
| 현금·거래 | cash ledger, holdings | (요약만 — 개별 거래 ID·메모 원문은 제외 가능) |

### 2.2 종목 집중 분석

| 소스 | Use Case / 모듈 | 포함 데이터 |
|------|-----------------|-------------|
| 종목 리포트 | `BuildStockAnalysisReportUseCase` → `StockPriceExplanationReport` | 가격·변동률·score·tag·insights·scoreBreakdown |
| Enrichment | `BuildStockEnrichmentUseCase` | technical · news · event · figure (이미 pick된 snapshot) |
| 시장 맥락 | `BuildMarketContextUseCase` | macro · sector · index · regime |
| 보유/관심 | route input | userHoldings · userWatchlist (symbol+market만) |

### 2.3 하지 않을 것 (1차)

- LLM에게 Yahoo/Finnhub **직접 호출**시키지 않음
- DB 전체 dump · 비밀번호·이메일·OAuth 토큰 전송 금지
- 매매 **지시** 생성 금지 (참고 의견 수준 — 기존 `stockAction` 카테고리와 동일 톤)

---

## 3. 개념 모델

```
[기존 Use Cases]  →  Context Builder  →  Context Pack (v1 JSON)
                                              ↓
                                        AiProviderPort
                                              ↓
                                        Insight Pack (v1 JSON)
                                              ↓
                                        Presentation (카드·접기)
```

| 용어 | 정의 |
|------|------|
| **Context Pack** | AI에 보내는 정형 입력. `schemaVersion`, `kind`, `locale`, `facts`, `constraints` |
| **Insight Pack** | AI가 반환하는 정형 출력. `schemaVersion`, `kind`, `sections[]`, `disclaimer`, `meta` |
| **AiProviderPort** | `completeStructured<T>(request): Promise<T>` — provider 무관 인터페이스 |
| **Analysis Job** | (선택) 비동기·캐시 키. 동일 context hash → TTL 내 재사용 |

---

## 4. Context Pack 스키마 (초안)

`packages/shared/src/ai/` 에 TypeScript 타입 + Zod 스키마로 정의 (single source of truth).

### 4.1 공통 envelope

```typescript
interface AiContextEnvelope {
  schemaVersion: '1.0';
  kind: 'portfolio' | 'stock';
  locale: 'ko' | 'en';
  generatedAt: string;          // ISO
  contextHash: string;            // SHA-256 of canonical JSON (캐시 키)
  constraints: {
    maxSections: number;
    tone: 'neutral' | 'educational';
    noTradeAdvice: true;          // 항상 true — prompt에도 반복
  };
}
```

### 4.2 Portfolio Context Pack (`kind: 'portfolio'`)

```typescript
interface PortfolioAiContext extends AiContextEnvelope {
  kind: 'portfolio';
  facts: {
    summary: {
      totalValueKrw: number;
      totalPnlKrw: number;
      cashKrw: number;
      cashUsd: number;
      holdingCount: number;
    };
    investorProfile: {
      compositePercent: number | null;
      primaryTypeId: string | null;
      tags: string[];
      adjustmentPercent: number;
    } | null;
    allocation: {
      targetKrPercent: number;
      targetUsPercent: number;
      actualKrPercent: number;
      actualUsPercent: number;
      maxSingleWeightPercent: number;
      topHoldings: Array<{ symbol: string; market: 'KR' | 'US'; weightPercent: number }>;
    };
    performance: {
      portfolioReturns: PortfolioAnalysisResult['portfolioReturns'];
      benchmarkComparisons: PortfolioAnalysisResult['benchmarkComparisons'];
    };
    simulation: {
      actions: Array<{ symbol: string; action: string; reason: string }>;  // rule-based picks 요약
    } | null;
    holdingsDigest: Array<{
      symbol: string;
      market: 'KR' | 'US';
      name: string;
      rsi14: number | null;
      newsHeadlines: string[];    // title만, url은 insight에서 링크용으로 별도 보관 가능
    }>;
  };
}
```

**조립 Use Case (신규):** `BuildPortfolioAiContextUseCase`  
- `GetDashboardUseCase` + `GetPortfolioAnalysisUseCase` + `GetPortfolioSimulationUseCase` + preferences 병렬 호출 후 facts만 추출.

### 4.3 Stock Context Pack (`kind: 'stock'`)

```typescript
interface StockAiContext extends AiContextEnvelope {
  kind: 'stock';
  facts: {
    instrument: { symbol: string; name: string; market: 'KR' | 'US'; currency: string };
    price: {
      current: number;
      change1d: number;
      change1w: number | null;
      change1mo: number | null;
    };
    ruleBasedReport: {
      tag: string;
      tagLabel: string;
      score: number | null;
      insights: Array<{ category: string; title: string; body: string }>;
      scoreBreakdown: Array<{ label: string; score: number; maxScore: number }>;
    };
    technical: { rsi14: number | null; macdSignal: string | null; trend: string | null } | null;
    marketLink: {
      regimeIds: string[];
      indexChange1d: number | null;
      leadingSectors: string[];
    };
    userLink: {
      isHeld: boolean;
      isWatchlisted: boolean;
      portfolioWeightPercent: number | null;
    };
    recentNews: Array<{ title: string; source: string; ageHours: number | null }>;
  };
}
```

**조립 Use Case (신규):** `BuildStockAiContextUseCase`  
- `BuildStockAnalysisReportUseCase` 결과 + enrichment snapshot + (선택) holding weight.

---

## 5. Insight Pack 스키마 (초안)

LLM **structured output** (JSON Schema / function calling)으로 강제.

### 5.1 공통 envelope

```typescript
interface AiInsightEnvelope {
  schemaVersion: '1.0';
  kind: 'portfolio' | 'stock';
  locale: 'ko' | 'en';
  disclaimer: string;             // 고정 문구 + AI 생성 불가 영역
  meta: {
    providerId: string;           // 'openai' | 'anthropic' | 'custom'
    model: string;
    promptVersion: string;        // 'portfolio-v1', 'stock-v1'
    latencyMs: number;
  };
  sections: AiInsightSection[];
}

interface AiInsightSection {
  id: string;                     // stable key for i18n fallback
  title: string;
  body: string;                     // markdown subset (bold, list only)
  severity?: 'info' | 'watch' | 'highlight';
  relatedSymbols?: string[];
  confidence?: 'low' | 'medium' | 'high';
}
```

### 5.2 Portfolio Insight — 권장 section id

| id | UI 위치 | 내용 |
|----|---------|------|
| `portfolio.summary` | 내 정보 상단 카드 | 한 줄 건강도·총평 |
| `portfolio.allocation` | CapitalAndSimulation 근처 | 목표 vs 실제 비중 해석 |
| `portfolio.profileFit` | InvestorProfile 근처 | 성향·보유 종목 정합성 |
| `portfolio.riskWatch` | SummaryCards 아래 | RSI·뉴스·집중도 주의点 |
| `portfolio.nextQuestions` | 하단 | 사용자가 스스로 점검할 질문 2~3개 |

### 5.3 Stock Insight — 권장 section id

| id | UI 위치 | 내용 |
|----|---------|------|
| `stock.summary` | StockFocusSection 상단 | 한 줄 요약 |
| `stock.priceContext` | 기존 rule insights 아래 | 가격·레인지·레짐 연결 해석 |
| `stock.catalysts` | 이벤트·뉴스 영역 | upcoming / recent catalyst |
| `stock.profileLink` | (보유 시) | 내 포트폴리오 비중·성향과의 관계 |
| `stock.openQuestions` | 하단 | 추가 확인 포인트 |

검증 실패 시: section 단위 drop + rule-based fallback UI.

---

## 6. Provider 추상화

### 6.1 Port (`server/domain/ports/ai-provider.port.ts`)

```typescript
interface AiStructuredRequest<TOut> {
  systemPrompt: string;
  userPayload: unknown;           // Context Pack JSON
  outputSchema: JsonSchema;       // Insight Pack
  locale: 'ko' | 'en';
  maxTokens: number;
  temperature: number;
}

interface AiProviderPort {
  readonly id: string;
  completeStructured<T>(req: AiStructuredRequest<T>): Promise<T>;
}
```

### 6.2 Adapter ( `server/data/ai/` )

| Adapter | env | 비고 |
|---------|-----|------|
| `GeminiProvider` | `GOOGLE_AI_API_KEY`, `AI_MODEL` | **Phase 1 기본** — AI Studio API key |
| `OpenAiProvider` | `OPENAI_API_KEY` | BYOK 또는 서버 fallback |
| `AnthropicProvider` | `ANTHROPIC_API_KEY` | BYOK 또는 서버 fallback |
| `HttpCustomProvider` | `AI_CUSTOM_ENDPOINT`, `AI_CUSTOM_API_KEY` | 전용 POST `{ context, outputSchema, locale }` |
| `NoOpProvider` | — | AI 비활성 시 `{ enabled: false }` |

**선택 전략:** `AI_PROVIDER=gemini|openai|anthropic|custom|off` — 회원 BYOK 우선, 없으면 서버 env key.

### 6.3 Prompt 관리

```
apps/web/src/server/data/ai/prompts/
├── portfolio-v1.ko.txt
├── portfolio-v1.en.txt
├── stock-v1.ko.txt
└── stock-v1.en.txt
```

- Prompt 버전 = `promptVersion` 메타에 기록 (회귀·A/B 추적)
- System prompt: `noTradeAdvice`, fact-only, hallucination 금지, 숫자는 context에 있는 것만 인용

---

## 7. API · Use Case

### 7.1 신규 Route (안)

| Method | Path | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/ai/portfolio-analysis` | ✅ 회원 (`AI_ALLOW_GUEST=true` 시 테스트용 guest) | Portfolio Context → Insight |
| POST | `/api/ai/stock-analysis` | ✅ 동일 | body: `{ symbol, name, market }` → Insight |
| PUT/GET/DELETE | `/api/account/ai-credential` | ✅ 회원 | BYOK provider·key 암호화 저장 |

Handler → quota check (`AiUsageLog`) → Context Builder → Provider → Zod validate → JSON (**insight DB 저장 없음**).

### 7.2 Use Case (신규)

| Use Case | 역할 |
|----------|------|
| `BuildPortfolioAiContextUseCase` | dashboard + analysis + simulation + profile → `PortfolioAiContext` |
| `BuildStockAiContextUseCase` | stock report + enrichment → `StockAiContext` |
| `RunAiAnalysisUseCase` | context build → provider → Zod validate → `AiInsightEnvelope` |
| `GetCachedAiInsightUseCase` | (선택) Redis/DB TTL 조회 |

Client: `FetchPortfolioAiInsightUseCase`, `FetchStockAiInsightUseCase` (thin wrapper).

### 7.3 Rate limit · 비용

| tier | 제한 (확정) |
|------|-------------|
| member | portfolio **1/일** · stock **3/일** (KST 기준, `AiUsageLog`) |
| guest | 기본 **불가** — `AI_ALLOW_GUEST=true` 시 테스트만 |

- Insight **저장·캐시 없음** — 매 요청 1회 LLM 호출
- 기존 `apiHeavy` rate limit + DB daily quota 이중 적용
- Provider timeout 30s, 1 retry

---

## 8. UI 배치

### 8.1 내 정보 (`/my-info`)

```
SummaryCards
  └─ [NEW] AiPortfolioInsightCard   ← POST /api/ai/portfolio-analysis
InvestorProfileSection              ← profileFit section 강조
CapitalAndSimulationSection         ← allocation section 연동
```

- 최초 진입: 접힌 카드 + 「AI 해석 받기」 버튼 (명시적 opt-in — 비용·latency)
- 로딩·에러·fallback: rule-based simulation/actions 그대로 표시

### 8.2 종목 집중 (`/market/analysis`, `/stocks/[symbol]`)

```
StockFocusSection
  ├─ 기존 StockPriceExplanationReport (rule-based)
  └─ [NEW] AiStockInsightPanel       ← 종목 선택 시 POST /api/ai/stock-analysis
```

- Rule-based insights **위**에 AI summary, **아래**에 openQuestions
- 동일 종목·동일 context hash → 캐시 badge 표시

---

## 9. 저장 (확정)

| 저장 | 내용 |
|------|------|
| `AiUsageLog` | userId + kind + usedAt — **일일 quota 카운트만** |
| `UserAiCredential` | userId + provider + encryptedKey (AES-256-GCM) — BYOK |

**저장하지 않을 것:** Insight JSON, full prompt, provider raw response, API key 평문.

---

## 10. 보안 · 컴플라이ance

- Context Pack에 **PII 최소화** (username, email, transaction memo 제외)
- Insight에 **투자 권유·매매 지시** 금지 — validator + prompt 이중 적용
- `disclaimer` 필드 필수 — UI footer 고정 노출
- Provider로 나가는 payload 로깅: prod에서 **facts만** structured log (Sentry breadcrumb)
- env 미설정 → `AI_PROVIDER=off` — 503 아닌 `{ enabled: false }` 로 UI graceful degrade

---

## 11. 구현 단계

### Phase 0 — 스키마·계약

- [x] `packages/shared/src/ai/` — Context/Insight Zod + dedicated contract
- [x] `test/shared/ai-schemas.spec.ts`
- [x] 본 문서 확정 사항 반영

### Phase 1 — Stock (vertical slice)

- [ ] `GeminiProvider` + `BuildStockAiContextUseCase` + `RunAiAnalysisUseCase`
- [ ] `POST /api/ai/stock-analysis` + `AiStockInsightPanel` (opt-in button)

### Phase 2 — Portfolio + BYOK + Quota DB

- [ ] Prisma `AiUsageLog` + `UserAiCredential`
- [ ] `BuildPortfolioAiContextUseCase` + portfolio API + settings UI

### Phase 3 — Multi-provider

- [ ] OpenAI / Anthropic / HttpCustom adapters + `AI_PROVIDER` switch

---

## 12. 디렉터리 (예상)

```
packages/shared/src/ai/
├── context.ts          # PortfolioAiContext, StockAiContext
├── insight.ts          # AiInsightEnvelope
└── index.ts

apps/web/src/server/
├── domain/
│   ├── ports/ai-provider.port.ts
│   └── usecases/ai/
│       ├── build-portfolio-ai-context.use-case.ts
│       ├── build-stock-ai-context.use-case.ts
│       └── run-ai-analysis.use-case.ts
├── data/ai/
│   ├── openai.provider.ts
│   ├── anthropic.provider.ts
│   ├── http-custom.provider.ts
│   └── prompts/
└── app/api/ai/
    ├── portfolio-analysis/route.ts
    └── stock-analysis/route.ts

apps/web/src/presentation/features/ai/
├── AiPortfolioInsightCard.tsx
└── AiStockInsightPanel.tsx
```

---

## 13. 환경 변수 (안)

```bash
AI_PROVIDER=off|gemini|openai|anthropic|custom
AI_MODEL=gemini-2.0-flash               # provider별 override

GOOGLE_AI_API_KEY=                      # Phase 1 server default
OPENAI_API_KEY=
ANTHROPIC_API_KEY=

AI_CUSTOM_ENDPOINT=https://your-ai.example/v1/analyze
AI_CUSTOM_API_KEY=
AI_CUSTOM_TIMEOUT_MS=30000

AI_CREDENTIALS_SECRET=                  # BYOK AES-256-GCM (≥32 chars)
AI_ALLOW_GUEST=false                    # true = 테스트용 guest AI 허용
```

`.env.example`에 placeholder 추가 (Phase 0).

---

## 14. 성공 기준

| # | 기준 |
|---|------|
| 1 | Context·Insight JSON이 Zod 통과 — provider mock 테스트 100% |
| 2 | AI off일 때 기존 화면 변화 없음 |
| 3 | Stock·Portfolio 각 1클릭으로 insight 표시 (캐시 hit 시 <500ms) |
| 4 | Provider를 `custom` ↔ `openai` env만 바꿔 교체 가능 |
| 5 | guest/member rate limit 동작 · audit log에 API key 미포함 |

---

## 15. 확정 사항 (2026-09-12)

| # | 결정 |
|---|------|
| 1 | Custom AI = 전용 POST `{ context, outputSchema, locale } → { insight }` |
| 2 | Insight **미저장** — quota만 Postgres `AiUsageLog` |
| 3 | UI = **opt-in 버튼** |
| 4 | 단일 prompt + `locale` 필드 |
| 5 | Rule-based **유지**, AI는 **보완 section** |
| 6 | Phase 1 Provider = **Gemini** (서버 key), BYOK = Phase 2 DB 암호화 |
| 7 | Quota = portfolio **1/일**, stock **3/일** (KST), 회원 only |

---

## 16. 다음 액션

1. **Phase 0** — `packages/shared/src/ai/` 스키마 + fixture 테스트 PR
2. 자체 AI endpoint contract 확정 (15-1)
3. **Phase 1** stock vertical slice — `/market/analysis`에서 첫 UI 노출

USECASES.md · PLAN.md 구현 상태 표는 Phase 1 merge 시 갱신.
