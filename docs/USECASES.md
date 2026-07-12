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

---

## 소스 디렉터리

```
apps/web/src/
├── app/
│   ├── page.tsx, login/, transactions/, settings/
│   ├── forgot-password/, reset-password/
│   ├── market/analysis/, stocks/[symbol]/
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
│   └── domain/usecases/
└── presentation/
    ├── pages/             # responsive 단일 페이지
    ├── views/             # 일부 app route 래퍼
    ├── hooks/screens/     # ViewModel
    └── desktop/, mobile/  # feature 컴포넌트
```

### MVVM

| MVVM | 위치 |
|------|------|
| View | `presentation/pages/*`, `layout/AppShell`, feature 컴포넌트 |
| ViewModel | `presentation/hooks/screens/*` |
| Model | `server/domain`, `client/domain` |

---

## 테스트

```
test/
├── server/          # domain, http, data/market
├── web/             # client use case, guest
├── shared/          # @sar/shared
└── e2e/             # Playwright smoke
```

```bash
npm run test         # 192 tests, 45 files (Vitest)
npm run test:e2e     # Playwright smoke (dev server 필요)
```

---

## Domain Services (server)

| Service | 소스 | 테스트 |
|---------|------|--------|
| `PositionCalculator` | `position-calculator.ts` | `position-calculator.spec.ts` |
| `StockSymbolResolver` | `stock-symbol.resolver.ts` | `stock-symbol.resolver.spec.ts` |
| `EmailVerification` (코드 발급) | `email-verification.service.ts` | use case 경유 |

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
| `GetAccountUseCase` | GET `/api/account` | — |
| `ChangePasswordUseCase` | POST `/api/account/password` | `account.use-cases.spec.ts` |
| `ChangeEmailUseCase` | POST `/api/account/email` | — |
| `RequestEmailVerificationUseCase` | POST `/api/account/verify-email` | `account.use-cases.spec.ts` |
| `VerifyEmailUseCase` | POST `/api/account/confirm-email` | `account.use-cases.spec.ts` |
| `RequestPasswordResetUseCase` | POST `/api/auth/forgot-password` | `account.use-cases.spec.ts` |
| `ResetPasswordUseCase` | POST `/api/auth/reset-password` | `account.use-cases.spec.ts` |
| `UnlinkOAuthAccountUseCase` | DELETE `/api/account/oauth/[provider]` | — |
| `DeleteAccountUseCase` | DELETE `/api/account` | `account.use-cases.spec.ts` |

### Transactions · Portfolio · Market · Watchlist · Corporate Actions

| Use Case | Route | 테스트 |
|----------|-------|--------|
| `CreateTransactionUseCase` | POST `/api/transactions` | `transactions.use-cases.spec.ts` |
| `ListTransactionsUseCase` | GET `/api/transactions` | 동일 |
| `DeleteTransactionUseCase` | DELETE `/api/transactions/[id]` | 동일 |
| `GetDashboardUseCase` | GET `/api/portfolio/dashboard` | `portfolio.use-cases.spec.ts` |
| `GetPortfolioAnalysisUseCase` | GET `/api/portfolio/analysis` | `get-portfolio-analysis.use-case.spec.ts` |
| `GetHoldingBySymbolUseCase` | GET `/api/portfolio/holding` | `get-holding.use-case.spec.ts` |
| `RefreshQuotesUseCase` | POST `/api/market/refresh` | `market.use-cases.spec.ts` (KR 병렬 포함) |
| `GetFeaturedQuotesUseCase` | GET `/api/market/featured` | `get-featured-quotes.use-case.spec.ts` |
| `GetStockQuoteUseCase` | GET `/api/market/quote` | provider/chart |
| `FetchQuotesUseCase` | POST `/api/market/quotes` | `market.use-cases.spec.ts` |
| `GetMarketStatusUseCase` | GET `/api/market/status` | `get-market-status.use-case.spec.ts` |
| `SearchStocksUseCase` | GET `/api/market/search` | `search-stocks.use-case.spec.ts` |
| `GetFxRateUseCase` | GET `/api/market/fx` | — |
| `GetMarketAnalysisUseCase` | GET `/api/market/analysis` | `get-market-analysis.use-case.spec.ts` |
| Watchlist use cases | `/api/watchlist` | `watchlist.use-cases.spec.ts` |
| Corporate action use cases | `/api/corporate-actions` | `corporate-actions.use-cases.spec.ts` |

Mock: `test/server/mocks/repositories.mock.ts`, `account.mock.ts`

---

## Client Use Cases

| 영역 | 소스 | 테스트 |
|------|------|--------|
| Auth (login, register, oauth, session) | `client/domain/usecases/auth/` | `auth.use-cases.spec.ts`, `auth-register-oauth.use-cases.spec.ts` |
| Account (settings, delete, verify) | `client/domain/usecases/account/` | — |
| Transactions | `client/domain/usecases/transactions/` | `transactions.use-cases.spec.ts` |
| Portfolio | `client/domain/usecases/portfolio/` | `portfolio.use-cases.spec.ts` |
| Watchlist | `client/domain/usecases/watchlist/` | `watchlist.use-cases.spec.ts` |
| Corporate actions | `client/domain/usecases/corporate-actions/` | `corporate-actions.use-cases.spec.ts` |
| Market | `client/domain/usecases/market/` | — |
| Guest adapters | `client/data/guest/` | `guest-repositories.spec.ts` |

---

## @sar/shared

| 모듈 | 역할 |
|------|------|
| `app-error-codes` | 공통 에러 코드·사용자 메시지 |
| `auth`, `auth-tokens` | 가입 검증, 토큰 타입 |
| `featured-stocks`, `chart-range` | 주요 종목, 기간 |
| `portfolio-*`, `market-analysis` | 포트폴리오·시장 분석 순수 로직 |
| `corporate-actions`, `stock-search` | 기업행위·검색 |

테스트: `test/shared/`

---

## HTTP · 보안 테스트

| 영역 | 파일 | 내용 |
|------|------|------|
| Route utils | `route-utils.spec.ts` | 인증 헬퍼 |
| Market rate limit | `market-routes.spec.ts` | 429 |
| Auth rate limit | `auth-routes.spec.ts` | login, check-username |
| Route error | `route-error.spec.ts` | DB 에러 사용자 메시지 마스킹 |

---

## E2E (Playwright)

| 시나리오 | 파일 |
|----------|------|
| 로그인 화면 | `test/e2e/smoke.spec.ts` |
| 비밀번호 찾기 | 동일 |
| 비회원 대시보드 | 동일 |

---

## 테스트 ID (주요)

### Account — `account.use-cases.spec.ts`

| ID | 시나리오 |
|----|----------|
| — | ChangePassword, Request/ResetPassword, VerifyEmail(6자리), RequestEmailVerification, DeleteAccount |

### Market Refresh — `market.use-cases.spec.ts`

| ID | 시나리오 |
|----|----------|
| RQ-01 ~ RQ-06 | 갱신 성공/실패, provider 미설정 |
| RQ-07 | KR 병렬 갱신 |

### Auth · Position · Guest

기존 PC-01~05, AU-01~05, guest 6 tests 유지.  
상세 시나리오는 각 `*.spec.ts` 참고.

---

## 의존성 규칙

- **server/domain** → @sar/shared
- **server/data** → server/domain
- **app/api** → server/container
- **client/** → client/domain
- **presentation/** → client bootstrap, hooks
