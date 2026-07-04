# Use Case 정의서

Next.js 풀스택 단일 앱 — use case 목록, 테스트 ID, 디렉터리 매핑.

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

**의존성**: Presentation → Domain ← Data

---

## 소스 디렉터리

```
apps/web/src/
├── app/
│   ├── layout.tsx, providers.tsx, globals.scss
│   ├── page.tsx, login/page.tsx, transactions/page.tsx
│   └── api/
│       ├── auth/login|refresh|logout/route.ts
│       ├── transactions/route.ts, [id]/route.ts
│       ├── portfolio/dashboard/route.ts
│       └── market/refresh/route.ts
├── server/
│   ├── container.ts              # DI (getServerServices)
│   ├── http/                       # errors, route-utils, auth
│   ├── domain/
│   │   ├── entities/
│   │   ├── errors/
│   │   ├── repositories/
│   │   ├── services/               # PositionCalculator, StockSymbolResolver
│   │   └── usecases/
│   └── data/
│       ├── persistence/            # Prisma
│       ├── auth/                   # JWT, bcrypt
│       └── market/                 # Yahoo(KR), Finnhub(US)
├── client/
│   ├── bootstrap.ts
│   ├── domain/usecases/            # API 호출 + 입력 검증
│   └── data/                       # axios, repositories
├── presentation/
│   ├── views/                      # desktop/mobile 분기 (*View.tsx)
│   ├── hooks/screens/              # ViewModel
│   ├── desktop/, mobile/
│   └── routes/ProtectedRoute.tsx
└── styles/                         # SCSS partials (globals.scss에서 @use)
```

### MVVM

| MVVM | 위치 |
|------|------|
| View | `presentation/desktop|mobile/**`, `presentation/views/*` |
| ViewModel | `presentation/hooks/**` |
| Model | `server/domain` (서버), `client/domain` (클라이언트) |
| Data | `server/data`, `client/data` |

---

## 테스트

```
test/
├── server/
│   ├── mocks/repositories.mock.ts
│   └── domain/ + data/market/
└── web/
    ├── mocks/fake-repositories.ts
    └── domain/usecases/
```

```bash
npm run test    # 60 tests (Vitest)
```

---

## Domain Services (server)

| Service | 소스 | 테스트 ID |
|---------|------|-----------|
| `PositionCalculator` | `server/domain/services/position-calculator.ts` | PC-01 ~ PC-05 |
| `StockSymbolResolver` | `server/domain/services/stock-symbol.resolver.ts` | SS-01 ~ SS-03 |

---

## Server Use Cases

| Use Case | 소스 | Route | 테스트 ID |
|----------|------|-------|-----------|
| `LoginUseCase` | `server/domain/usecases/auth/login.use-case.ts` | POST `/api/auth/login` | AU-01 ~ AU-04 |
| `RefreshTokenUseCase` | `server/domain/usecases/auth/refresh-token.use-case.ts` | POST `/api/auth/refresh` | AU-02, AU-05 |
| `LogoutUseCase` | `server/domain/usecases/auth/logout.use-case.ts` | POST `/api/auth/logout` | LO-01, LO-02 |
| `CreateTransactionUseCase` | `server/domain/usecases/transactions/create-transaction.use-case.ts` | POST `/api/transactions` | CT-01 ~ CT-05 |
| `ListTransactionsUseCase` | `server/domain/usecases/transactions/list-transactions.use-case.ts` | GET `/api/transactions` | LT-01 |
| `DeleteTransactionUseCase` | `server/domain/usecases/transactions/delete-transaction.use-case.ts` | DELETE `/api/transactions/[id]` | DT-01, DT-02 |
| `GetDashboardUseCase` | `server/domain/usecases/portfolio/get-dashboard.use-case.ts` | GET `/api/portfolio/dashboard` | DA-01 ~ DA-05 |
| `RefreshQuotesUseCase` | `server/domain/usecases/market/refresh-quotes.use-case.ts` | POST `/api/market/refresh` | RQ-01 ~ RQ-06 |

Mock: `test/server/mocks/repositories.mock.ts`

---

## Client Use Cases

| Use Case | 소스 | 테스트 ID |
|----------|------|-----------|
| `LoginUseCase` | `client/domain/usecases/auth/login.use-case.ts` | WL-01 ~ WL-03 |
| `RefreshSessionUseCase` | `client/domain/usecases/auth/refresh-session.use-case.ts` | WS-01 |
| `LogoutUseCase` | `client/domain/usecases/auth/logout.use-case.ts` | WS-02 |
| `CreateTransactionUseCase` | `client/domain/usecases/transactions/create-transaction.use-case.ts` | WT-01 ~ WT-04 |
| `ListTransactionsUseCase` | `client/domain/usecases/transactions/list-transactions.use-case.ts` | WT-05 |
| `DeleteTransactionUseCase` | `client/domain/usecases/transactions/delete-transaction.use-case.ts` | WT-06 |
| `GetDashboardUseCase` | `client/domain/usecases/portfolio/get-dashboard.use-case.ts` | WP-01 |
| `RefreshQuotesUseCase` | `client/domain/usecases/portfolio/refresh-quotes.use-case.ts` | WP-02 |

Mock: `test/web/mocks/fake-repositories.ts`

---

## 테스트 ID 상세

### PositionCalculator (PC) — `test/server/domain/position-calculator.spec.ts`

| ID | 시나리오 | 기대 |
|----|----------|------|
| PC-01 | BUY 1건 | quantity, averageCost, costBasis 정확 |
| PC-02 | DCA BUY 2건 | 가중 평단 |
| PC-03 | BUY 후 SELL 일부 | realizedPnl, 잔량 감소 |
| PC-04 | SELL > 보유 | InvalidPositionError |
| PC-05 | 전량 SELL | quantity=0 |

### StockSymbolResolver (SS) — `test/server/domain/stock-symbol.resolver.spec.ts`

| ID | 시나리오 | 기대 |
|----|----------|------|
| SS-01 | KR `005930` | `005930.KS`, KRW |
| SS-02 | KR `035720.KQ` | `035720.KQ` |
| SS-03 | US `AAPL` | AAPL, USD |

### Server Auth (AU, LO) — `test/server/domain/usecases/auth.use-cases.spec.ts`

| ID | 시나리오 | 기대 |
|----|----------|------|
| AU-01 | 잘못된 password | 401 |
| AU-02 | refresh rotation | 새 access/refresh |
| AU-03 | 로그인 성공 | token 발급 |
| AU-04 | 없는 username | 401 |
| AU-05 | 무효 refresh | 401 |
| LO-01 | 유효 refresh logout | revoke |
| LO-02 | token 없음 | no-op |

### Server Transactions (CT, LT, DT) — `test/server/domain/usecases/transactions.use-cases.spec.ts`

| ID | 시나리오 | 기대 |
|----|----------|------|
| CT-01 ~ CT-05 | create 검증 | stock/tx orchestration |
| LT-01 | 필터 | repo 전달 |
| DT-01, DT-02 | delete | 본인/타인 |

### Server Portfolio (DA) — `test/server/domain/usecases/portfolio.use-cases.spec.ts`

| ID | 시나리오 | 기대 |
|----|----------|------|
| DA-01 ~ DA-05 | dashboard 집계 | summary, holdings |

### Server Market (RQ) — `test/server/domain/usecases/market.use-cases.spec.ts`

| ID | 시나리오 | 기대 |
|----|----------|------|
| RQ-01 ~ RQ-05 | refresh | updated/failed |
| RQ-06 | API key 없음 | failed, fetch 미호출 |

### Web (WL, WS, WT, WP) — `test/web/domain/usecases/*.spec.ts`

| ID | 시나리오 | 기대 |
|----|----------|------|
| WL-01 ~ WL-03 | login validation | AppError |
| WS-01, WS-02 | session | repo 위임 |
| WT-01 ~ WT-06 | transactions | validation/위임 |
| WP-01, WP-02 | portfolio | 위임 |

---

## 의존성 규칙

- **server/domain** → server/domain만
- **server/data** → server/domain
- **app/api** → server/container (Use Case만)
- **client/** → client/domain, axios
- **presentation/** → client/ (bootstrap, hooks), UI only
- **테스트** → `test/server`, `test/web`
