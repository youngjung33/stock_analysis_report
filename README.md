# 주식 포트폴리오 대시보드

Next.js 풀스택 + PostgreSQL + Vercel 배포용 포트폴리오 앱입니다.

## 기술 스택

- **Framework**: Next.js 15 (App Router)
- **DB**: PostgreSQL + Prisma
- **UI**: React 19, Tailwind CSS v4, TanStack Query
- **Auth**: httpOnly 쿠키 세션, 회원가입·SSO·비회원
- **시세**: Yahoo Finance (KR/US 차트), Finnhub (US 포트폴리오 갱신, 선택)

## 프로젝트 구조

```
apps/web/src/
├── app/              # pages + /api
├── client/           # domain/data (axios)
├── server/           # domain/data (Prisma, Use Case)
└── presentation/     # UI (pages, hooks, layout)
packages/shared/      # 공통 도메인·포맷·시뮬레이션
```

## 주요 기능

- **자본금·현금** — 초기 자본, 입출금, 매수/매도·배당 연동
- **포트폴리오 시뮬레이션** — 목표 비중 대비 유지/축소/매수 검토
- **내 정보** (`/my-info`) — 자본금·주식 거래 등록·수정 (비회원 포함)
- **온보딩** — 자본·종목 미등록 시 대시보드 시작 안내
- **시세 캐시** — React Query staleTime, 갱신 버튼으로만 외부 API 재호출

## 사전 요구

- Node.js 20+
- PostgreSQL (로컬 또는 Supabase 등)
- (선택) 미국 시세 API 키 — 미설정 시 US 포트폴리오 갱신만 제한

## 설치

```bash
npm install
npm run build -w @sar/shared
```

로컬 env 파일(`apps/web/.env`)에 DB·인증·선택 기능을 설정합니다. **민감 값은 git에 올리지 마세요.**

## DB

```bash
npm run db:push      # 스키마 적용 (로컬)
npm run db:migrate   # migration (프로덕션 권장)
npm run db:seed      # 초기 데이터
```

seed 계정 정보는 로컬 env에서 지정합니다.

## 로컬 실행

```bash
npm run dev
```

http://localhost:3000

## Vercel 배포

1. Vercel에 repo 연결, **Root Directory**: `apps/web`
2. Environment Variables: Vercel 대시보드에서 DB·인증·선택 기능 설정
3. Deploy

## 테스트

```bash
npm run test           # Vitest (226+ tests)
npm run lint           # ESLint (flat config)
npm run test:e2e       # Playwright smoke
npm run build          # 프로덕션 빌드
```

## 문서

| 문서 | 내용 |
|------|------|
| [docs/PLAN.md](docs/PLAN.md) | 아키텍처·API·구현 상태 |
| [docs/USECASES.md](docs/USECASES.md) | Use Case·테스트 매핑 |
| [docs/stock-catalog-import.md](docs/stock-catalog-import.md) | 종목 마스터 import |

## 클린 아키텍처

- **server/domain**: Use Case, Entity
- **server/data**: Prisma, 시세 provider
- **client/domain**: API 호출 Use Case
- **presentation**: MVVM hooks + UI
