# 주식 포트폴리오 대시보드 프로젝트 계획

## 확정 요구사항

| 항목 | 결정 |
|------|------|
| 프레임워크 | **Next.js 15** (App Router, Route Handlers) |
| DB | **PostgreSQL** + Prisma |
| 배포 | **Vercel** |
| 시세 API | **미국: Finnhub**, **한국: Yahoo Finance** |
| 거래 | **매수 + 매도 + 분할매수(DCA)** |
| 사용자 | **회원가입 · SSO · 비회원** 지원 |
| UI | **대시보드 · 내 정보 · 거래 · 시장 분석 · 계정 설정**, responsive + `AppShell` |

---

## 목표

- 종목별 거래 등록 → 포트폴리오 대시보드 (손익·평가금액·기간 수익률)
- **갱신** 버튼으로 KR/US 보유 종목 시세 DB 갱신
- httpOnly 쿠키 기반 세션 인증
- Market API IP 기준 rate limit (tier별)
- **단일 Next.js 앱** — UI + `/api` same-origin
- 종목 검색: **StockCatalog** (로컬 import) → DB 우선, Yahoo fallback
- Toast 알림, 서버 에러 사용자 마스킹

---

## 프로젝트 구조

```
stock-analysis-report/
├── apps/web/                 # @sar/web — Next.js 풀스택 앱
│   ├── prisma/               # schema, seed (gitignore — 로컬·배포 DB 전용)
│   ├── data/stock-catalog/   # fetch:stocks 산출물 (gitignore)
│   ├── scripts/              # fetch-stocks, import-stocks
│   └── src/
│       ├── app/              # Next.js App Router + /api
│       ├── server/           # Domain · Data · http
│       ├── client/           # 브라우저 Domain · Data
│       └── presentation/     # UI (MVVM)
│           ├── pages/        # responsive 단일 페이지
│           ├── layout/       # AppShell, nav, header
│           ├── features/     # dashboard, transactions, onboarding
│           └── hooks/
├── packages/shared/          # @sar/shared
└── test/
    ├── server/
    ├── web/
    ├── shared/
    └── e2e/                  # Playwright smoke
```

> DB 스키마·seed·로컬 env 파일은 git에 포함하지 않습니다. 배포·개발 환경에서 별도 관리합니다.

---

## 화면 (App Router)

| 경로 | 역할 |
|------|------|
| `/` | 대시보드 (protected) — 온보딩·요약·시뮬레이션 |
| `/my-info` | 내 정보 — 자본금·주식 거래 (protected, 비회원 포함) |
| `/login` | 로그인 · 회원가입 · SSO · 비회원 |
| `/transactions` | 거래 · 기업행위 (protected) |
| `/stocks/[symbol]` | 종목 상세 (`?market=KR\|US`) |
| `/market/analysis` | 시장 분석 (protected) |
| `/settings` | 계정 설정 (protected) |
| `/forgot-password` | 비밀번호 찾기 |
| `/reset-password` | 비밀번호 재설정 |

### UI 레이아웃

- **`AppShell`**: sidebar(데스크톱) + header + bottom nav(모바일)
- **데스크톱**: 사이드바 — 대시보드 · **내 정보** · 거래 · 시장 / 하단 계정 설정
- **모바일**: 하단 nav 4탭 (홈 · 내 정보 · 거래 · 시장)
- **`pages/`**: Dashboard, Transactions, Login 등 responsive 단일 페이지
- **Toast**: PC 우상단 / 모바일 하단

---

## API 개요

Handler → `getServerServices()` → Domain Use Case

### Auth

| Method | Path | 인증 |
|--------|------|------|
| POST | `/api/auth/login` | — |
| POST | `/api/auth/register` | — |
| GET | `/api/auth/check-username` | — |
| POST | `/api/auth/refresh` | refresh cookie |
| POST | `/api/auth/logout` | — |
| POST | `/api/auth/forgot-password` | — |
| POST | `/api/auth/reset-password` | — |
| GET | `/api/auth/oauth/providers` | — |
| GET/POST | `/api/auth/oauth/[provider]/start`, `.../callback` | — |

### Account

| Method | Path | 인증 |
|--------|------|------|
| GET | `/api/account` | ✅ |
| DELETE | `/api/account` | ✅ (회원탈퇴) |
| POST | `/api/account/password` | ✅ |
| POST | `/api/account/email` | ✅ |
| POST | `/api/account/verify-email` | ✅ (인증 코드 발급) |
| POST | `/api/account/confirm-email` | ✅ (인증 코드 확인) |
| DELETE | `/api/account/oauth/[provider]` | ✅ |

### Portfolio · Transactions · Watchlist · Corporate Actions

| Method | Path | 인증 |
|--------|------|------|
| GET/POST | `/api/transactions` | ✅ |
| DELETE | `/api/transactions/[id]` | ✅ |
| GET | `/api/portfolio/dashboard` | ✅ |
| GET | `/api/portfolio/analysis` | ✅ |
| GET | `/api/portfolio/holding` | ✅ |
| GET/PUT | `/api/portfolio/preferences` | ✅ |
| GET | `/api/portfolio/simulation` | ✅ |
| GET/POST | `/api/cash` | ✅ |
| GET/POST | `/api/watchlist` | ✅ |
| DELETE | `/api/watchlist/[id]` | ✅ |
| GET/POST | `/api/corporate-actions` | ✅ |
| DELETE | `/api/corporate-actions/[id]` | ✅ |

### Market

| Method | Path | 인증 |
|--------|------|------|
| POST | `/api/market/refresh` | ✅ |
| POST | `/api/market/quotes` | — (게스트) |
| GET | `/api/market/featured` | — |
| GET | `/api/market/quote` | — |
| GET | `/api/market/search` | — |
| GET | `/api/market/status` | — |
| GET | `/api/market/fx` | — |
| GET | `/api/market/analysis` | — |

Use Case 상세: [USECASES.md](USECASES.md)

---

## 인증·보안 (개요)

| 항목 | 설명 |
|------|------|
| 세션 | httpOnly 쿠키, refresh rotation |
| 인증 API | 로그인·가입·OAuth 등 rate limit |
| Market API | IP 기준 tier별 rate limit, 초과 시 429 |
| 에러 응답 | DB·인프라 상세는 사용자에게 노출하지 않음 |
| 보안 헤더 | CSP, HSTS(프로덕션), X-Frame-Options 등 |
| 관측 | structured logging, Sentry(선택, env 설정 시) |

> 쿠키명·JWT·OAuth·DB 연결 문자열 등 **민감 설정은 문서에 기재하지 않습니다.** 로컬 env 파일로만 관리합니다.

---

## 시세(Market) API

### 데이터 소스

| 용도 | 한국 (KR) | 미국 (US) |
|------|-----------|-----------|
| 포트폴리오 **갱신** | Yahoo Chart | Finnhub Quote (키 설정 시) |
| 종목 **기간 차트** | Yahoo Chart | Yahoo Chart |
| 종목 **검색** | StockCatalog DB → Yahoo fallback | 동일 |

- US Finnhub 미설정 시 포트폴리오 US 갱신 실패 가능. 상세·주요 종목은 Yahoo로 조회.
- **갱신**: KR 보유 종목 병렬, US 순차(Finnhub rate limit).

### 종목 상세

- 기간 버튼 (`1d` … `max`) → `GET /api/market/quote`
- 차트 hover/터치 시 날짜·가격 tooltip

---

## 비회원(게스트) 모드

- JWT·DB 없음. 거래·시세는 **sessionStorage**.
- 시세 갱신: `POST /api/market/quotes`
- 주요 종목·기간 조회는 회원과 동일 API

---

## 계정·복구 (현재)

| 기능 | 상태 |
|------|------|
| 아이디 회원가입 / 로그인 | ✅ |
| SSO (Google, Naver, Kakao, Apple) | ✅ (env 설정 시) |
| 비밀번호 재설정 | ✅ UI·API (메일 발송은 추후 EmailSender) |
| 이메일 인증 | ✅ 6자리 코드 → toast (실메일 발송 TODO) |
| 계정 설정 / SSO 연동 해제 | ✅ |
| 회원탈퇴 | ✅ User cascade 삭제 |

---

## 클린 아키텍처

```
app/ + presentation/  →  server/domain  ←  server/data
client/domain  ←  client/data  (axios → /api)
```

**의존성**: Presentation → Domain ← Data

---

## 로컬 / 배포

```bash
npm install
# apps/web/.env — DB·인증·선택 기능(시세·OAuth·관측) 설정 (git 미포함)
npm run db:push
npm run db:seed
npm run fetch:stocks          # (선택) 종목 마스터
npm run db:import-stocks      # (선택)
npm run dev
npm run test                  # Vitest
npm run test:e2e              # Playwright (선택)
```

**Vercel**: Root Directory = `apps/web`, 환경 변수는 대시보드에서 설정

---

## 구현 상태

| # | 항목 | 상태 |
|---|------|------|
| 1 | Next.js 풀스택 단일 앱 | ✅ |
| 2 | PostgreSQL + Prisma | ✅ |
| 3 | 3계층 아키텍처 | ✅ |
| 4 | responsive UI + MVVM + AppShell | ✅ |
| 5 | JWT httpOnly + 회원가입·SSO | ✅ |
| 6 | KR Yahoo / US Finnhub | ✅ |
| 7 | 종목 상세·시장·포트폴리오 분석 | ✅ |
| 8 | StockCatalog + import | ✅ |
| 9 | 관심종목·기업행위 | ✅ |
| 10 | Rate limit + 보안 헤더 | ✅ |
| 11 | Toast · 에러 마스킹 | ✅ |
| 12 | 계정 설정·탈퇴·비밀번호 재설정 | ✅ |
| 13 | Vitest **192 tests** (45 files) | ✅ |
| 14 | Playwright smoke E2E | ✅ |
| 15 | Sentry·structured log (골격) | ✅ |

---

## 확장 포인트

- 프로덕션 **EmailSender** (비밀번호 재설정·이메일 인증 실메일)
- 가입 직후 이메일 인증 플로우 연동
- `desktop/mobile` feature 컴포넌트 통합
- `views/*` → `pages/*` 직접 import 정리
- Account API·E2E 테스트 보강
- logger ↔ route-error ↔ Sentry 연동

종목 마스터: [stock-catalog-import.md](stock-catalog-import.md)
