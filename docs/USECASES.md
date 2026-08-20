# Use Case 정의서

Next.js 풀스택 단일 앱 — use case 목록, 테스트, 디렉터리 매핑.

---

## 아키텍처

```
app/ + presentation/  →  server/domain  ←  server/data
                              ↑
client/domain  ←  client/data  (axios → /api)
```

| 계층 | 서버 | 클라이언트 |
|------|------|------------|
| **Presentation** | `app/api/**/route.ts` | `app/**/page.tsx`, `presentation/**` |
| **Domain** | `server/domain/` | `client/domain/` |
| **Data** | `server/data/` | `client/data/` |

**라우트 보호:** `middleware.ts` — `refreshToken` 또는 `sarGuestSession` 쿠키 없으면 protected 페이지 → `/login`  
**클라이언트:** `ProtectedRoute` — 게스트·회원 UI 가드 (이중 보호)

---

## 소스 디렉터리

```
apps/web/src/
├── app/
│   ├── page.tsx, login/, transactions/, settings/, tax/
│   ├── forgot-password/, reset-password/
│   ├── market/analysis/, stocks/[symbol]/, guide/
│   └── api/
│       ├── auth/          # login, register, oauth, forgot/reset-password, …
│       ├── account/       # profile, password, email, verify, delete, oauth
│       ├── transactions/, portfolio/, watchlist/, corporate-actions/
│       └── market/
├── server/
│   ├── container.ts
│   ├── domain/usecases/
│   │   ├── auth/
│   │   ├── account/
│   │   ├── transactions/, portfolio/, market/, watchlist/, corporate-actions/
│   └── data/
├── client/
│   ├── bootstrap.ts
│   ├── domain/usecases/
│   └── domain/services/   # investor-profile-hydrate, pending-investor-profile
└── presentation/
    ├── pages/             # responsive 단일 페이지
    ├── hooks/             # screens/, useInvestorProfile, useAuth, …
    └── features/          # investor-profile, investor-survey, guide, tax, …
```

> Tip(`/guide`)·진단 설문은 **비회원 입장 또는 로그인 후** 이용 가능 (`ProtectedRoute`).

### MVVM

| MVVM | 위치 |
|------|------|
| View | `presentation/pages/*`, `layout/AppShell`, feature 컴포넌트 |
| ViewModel | `presentation/hooks/screens/*`, `useInvestorProfile`, … |
| Model | `server/domain`, `client/domain` |

---

## 테스트

```
test/
├── server/          # domain, http, data/market
├── web/             # client use case, guest, middleware, i18n
├── shared/          # @sar/shared
└── e2e/             # Playwright smoke (17 scenarios)
```

```bash
npm run test         # Vitest — see README for current count
npm run test:e2e     # Playwright (dev server + E2E_USERNAME/PASSWORD for member login)
```

---

## Domain Services (server)

| Service | 소스 | 테스트 |
|---------|------|--------|
| `PositionCalculator` | `position-calculator.ts` | `position-calculator.spec.ts` |
| `StockSymbolResolver` | `stock-symbol.resolver.ts` | `stock-symbol.resolver.spec.ts` |
| `EmailVerification` (코드 발급) | `email-verification.service.ts` | use case + route |

---

## Server Use Cases

### Auth

| Use Case | Route | 테스트 |
|----------|-------|--------|
| `LoginUseCase` | POST `/api/auth/login` | `auth.use-cases.spec.ts` |
| `RegisterUseCase` | POST `/api/auth/register` | 동일 |
| `CheckUsernameAvailabilityUseCase` | GET `/api/auth/check-username` | `check-username-availability.use-case.spec.ts` |
| `RefreshTokenUseCase` | POST `/api/auth/refresh` | `auth.use-cases.spec.ts` |
| `LogoutUseCase` | POST `/api/auth/logout` | 동일 |
| `StartOAuthLoginUseCase` | GET `/api/auth/oauth/[provider]/start` | `auth.use-cases.spec.ts` |
| `CompleteOAuthLoginUseCase` | GET `/api/auth/oauth/[provider]/callback` | 동일 |

### Account

| Use Case | Route | 테스트 |
|----------|-------|--------|
| `GetAccountUseCase` | GET `/api/account` | `account.use-cases.spec.ts` |
| `ChangePasswordUseCase` | POST `/api/account/password` | 동일 |
| `ChangeEmailUseCase` | POST `/api/account/email` | 동일 |
| `RequestEmailVerificationUseCase` | POST `/api/account/verify-email` | 동일 |
| `VerifyEmailUseCase` | POST `/api/account/confirm-email` | 동일 |
| `RequestPasswordResetUseCase` | POST `/api/auth/forgot-password` | 동일 |
| `ResetPasswordUseCase` | POST `/api/auth/reset-password` | 동일 |
| `UnlinkOAuthAccountUseCase` | DELETE `/api/account/oauth/[provider]` | 동일 |
| `DeleteAccountUseCase` | DELETE `/api/account` | 동일 |

### Transactions · Portfolio · Market · Watchlist · Corporate Actions

| Use Case | Route | 테스트 |
|----------|-------|--------|
| `CreateTransactionUseCase` | POST `/api/transactions` | domain + `portfolio-api-routes.spec.ts` |
| `ListTransactionsUseCase` | GET `/api/transactions` | domain + HTTP |
| `DeleteTransactionUseCase` | DELETE `/api/transactions/[id]` | domain |
| `GetDashboardUseCase` | GET `/api/portfolio/dashboard` | `portfolio.use-cases.spec.ts` + HTTP |
| `GetPortfolioAnalysisUseCase` | GET `/api/portfolio/analysis` | `get-portfolio-analysis.use-case.spec.ts` |
| `GetPortfolioPreferencesUseCase` | GET `/api/portfolio/preferences` | `portfolio.use-cases.spec.ts` + `cash-routes.spec.ts` |
| `UpdatePortfolioPreferencesUseCase` | PUT `/api/portfolio/preferences` | `portfolio-capital.use-cases.spec.ts` + HTTP |
| `GetPortfolioSimulationUseCase` | GET `/api/portfolio/simulation` (+ `regimes`, `recommendations`) | `portfolio-capital.use-cases.spec.ts`, `cash-routes.spec.ts` |
| `BuildMarketContextUseCase` | (내부) macro/sector/index for recommendation | `get-market-analysis.use-case.spec.ts` |
| `FetchRecommendationQuotesUseCase` | (내부) candidate pool quotes + 15m cache | `portfolio-capital.use-cases.spec.ts` |
| `FetchRecommendationTechnicalSnapshotsUseCase` | (내부) candidate chart snapshots + 15m cache | `technical-enrichment.spec.ts` |
| `FetchRecommendationNewsSnapshotsUseCase` | (내부) KR Google RSS / US Finnhub company news + 15m cache | `news-enrichment.spec.ts` |
| `FetchRecommendationEventSnapshotsUseCase` | (내부) US Finnhub earnings + **KR DART** + headline fallback + 15m cache | `event-enrichment.spec.ts`, `kr-disclosure-enrichment.spec.ts` |
| `FetchRecommendationFigureStatementsUseCase` | (내부) global figure **RSS + X/SNS 2차** + 15m cache | `figure-enrichment.spec.ts`, `figure-sns-merge.spec.ts` |
| `BuildStockEnrichmentUseCase` | (내부) quotes + technical + news + events + figures batch | portfolio + ledger |
| `GetHoldingBySymbolUseCase` | GET `/api/portfolio/holding` | `get-holding.use-case.spec.ts` |
| `RecordCashEntryUseCase` | POST `/api/cash` | `cash.use-cases.spec.ts` + HTTP |
| `RefreshQuotesUseCase` | POST `/api/market/refresh` | `market.use-cases.spec.ts` |
| `GetFeaturedQuotesUseCase` | GET `/api/market/featured` | `get-featured-quotes.use-case.spec.ts` |
| `GetStockQuoteUseCase` | GET `/api/market/quote` | provider/chart |
| `FetchQuotesUseCase` | POST `/api/market/quotes` | `market.use-cases.spec.ts` |
| `GetMarketStatusUseCase` | GET `/api/market/status` | `get-market-status.use-case.spec.ts` |
| `SearchStocksUseCase` | GET `/api/market/search` | `search-stocks.use-case.spec.ts` |
| `GetFxRateUseCase` | GET `/api/market/fx` | client `market.use-cases.spec.ts` |
| `GetMarketAnalysisUseCase` | GET `/api/market/analysis` | `get-market-analysis.use-case.spec.ts` |
| `RunGlobalRecommendationBatchUseCase` | POST `/api/cron/recommendation-batch` | `global-baseline-recommendations.spec.ts`, cron route |
| `EvaluateRecommendationOutcomesUseCase` | POST `/api/cron/recommendation-outcomes` | cron route + ledger repository |
| `ListRecommendationHistoryUseCase` | GET `/api/market/recommendation-history` | `recommendation-ledger.spec.ts`, `recommendation-backtest.spec.ts` |
| `GetRecommendationBatchUseCase` | GET `/api/market/recommendation-history/[batchId]` | ledger repository |
| `BuildMarketContextUseCase` | GET `/api/market/recommendation-context` | shared with analysis/simulation |
| Watchlist use cases | `/api/watchlist` | domain + `portfolio-api-routes.spec.ts` |
| Corporate action use cases | `/api/corporate-actions` | `corporate-actions.use-cases.spec.ts` |

Mock: `test/server/mocks/repositories.mock.ts`, `account.mock.ts`

---

## Client Use Cases

| 영역 | 소스 | 테스트 |
|------|------|--------|
| Auth (login, register, oauth, session) | `client/domain/usecases/auth/` | `auth.use-cases.spec.ts`, `auth-register-oauth.use-cases.spec.ts` |
| Account (settings, delete, verify) | `client/domain/usecases/account/` | `account.use-cases.spec.ts` |
| Transactions | `client/domain/usecases/transactions/` | `transactions.use-cases.spec.ts` |
| Portfolio | `client/domain/usecases/portfolio/` | `portfolio.use-cases.spec.ts` |
| **Investor profile** | `presentation/hooks/useInvestorProfile.ts`, `client/domain/services/` | shared + hydrate + pending specs |
| Watchlist | `client/domain/usecases/watchlist/` | `watchlist.use-cases.spec.ts` |
| Corporate actions | `client/domain/usecases/corporate-actions/` | `corporate-actions.use-cases.spec.ts` |
| Market | `client/domain/usecases/market/` (+ `GetRecommendationHistoryUseCase`) | `market.use-cases.spec.ts`, `recommendation-backtest.spec.ts` |
| Guest adapters | `client/data/guest/` | `guest-repositories.spec.ts` |

---

## @sar/shared

| 모듈 | 역할 |
|------|------|
| `app-error-codes` | 공통 에러 코드·사용자 메시지 |
| `auth`, `auth-tokens`, `route-access` | 가입 검증, 토큰, middleware 경로 |
| `portfolio-dashboard` | dashboard summary/holdings 집계 (guest/server 공유) |
| `portfolio-capital-simulation` | enrichment-aware simulation rank + deploy cap (Phase K) |
| `investor-survey/` | 투자 유형 catalog, 미니 테스트, **profile** |
| `guide/` | Tip FAQ catalog |
| `market-recommendation/` | scoring, **G0** score-caps/dedupe/pipeline, engine, enrichment **(G–N+)** |
| `simulation-ranking.ts` | §10 v2 add priority (buyback boost, narrative/earnings/figure deprioritize), deploy cap |
| `kr-corp-registry.ts` · `kr-disclosure-enrichment.ts` | Phase L — DART corp_code · 공시→CH_EVENT |
| `StockCatalog.dartCorpCode` | Phase M — Catalog DB corp_code lookup |
| `recommendation-ledger.ts` | engine version, horizons, batch view types |
| `recommendation-backtest.ts` | Phase N+ — horizon/tag α 집계 |
| `enrichment-delta-tuning.ts` | delta profile version, ledger 기반 튜닝 힌트 (`enrichment-delta-tuning.spec.ts`) |
| `build-global-baseline-recommendations.ts` | global profile baseline picks |

투자 프로필 상세: [investor-profile.md](investor-profile.md)

테스트: `test/shared/`

---

## HTTP · 보안 테스트

| 영역 | 파일 | 내용 |
|------|------|------|
| Route utils | `route-utils.spec.ts` | 인증 헬퍼 |
| Portfolio/transactions/watchlist | `portfolio-api-routes.spec.ts` | CRUD smoke |
| Cash/preferences/simulation | `cash-routes.spec.ts` | capital API |
| Market rate limit | `market-routes.spec.ts` | 429 |
| Auth rate limit | `auth-routes.spec.ts` | login, check-username |
| Verify email | `verify-email-route.spec.ts` | 링크 인증 redirect |
| Route error | `route-error.spec.ts` | DB 에러 마스킹 |
| Middleware | `middleware.spec.ts` | protected route redirect |

---

## E2E (Playwright)

| 시나리오 | 파일 |
|----------|------|
| 로그인·회원가입·비밀번호 찾기 | `test/e2e/smoke.spec.ts` |
| 비회원 대시보드·거래·my-info·세금 | 동일 |
| 미인증 → `/login` redirect (middleware) | 동일 |
| 회원 로그인 | 동일 (`E2E_USERNAME` / `E2E_PASSWORD` env) |

---

## 의존성 규칙

- **server/domain** → @sar/shared
- **server/data** → server/domain
- **app/api** → server/container
- **client/** → client/domain
- **presentation/** → client/domain, hooks (ESLint: `@/client/data`, `@/server` import 금지)
