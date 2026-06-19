# 주식 포트폴리오 대시보드

Next.js 풀스택 + Supabase(PostgreSQL) + Vercel 배포용 개인 포트폴리오 앱입니다.

## 기술 스택

- **Framework**: Next.js 15 (App Router, Route Handlers)
- **DB**: Supabase PostgreSQL + Prisma
- **UI**: React 19, Tailwind CSS v4, SCSS, TanStack Query
- **Auth**: JWT access token + refresh token (httpOnly cookie)
- **시세**: Yahoo Finance (KR), Finnhub (US, 키 설정 시)

## 프로젝트 구조

```
apps/web/src/
├── app/              # Next.js pages + /api Route Handlers
├── client/           # 브라우저용 domain/data (axios → /api)
├── server/           # 서버 domain/data (Prisma, Use Case)
└── presentation/     # UI (desktop/mobile)
```

## 사전 요구

- Node.js 20+
- [Supabase](https://supabase.com) 프로젝트
- (선택) [Finnhub API Key](https://finnhub.io/register) — 미국 종목

## 설치

```bash
npm install
npm run build -w @sar/shared
cp apps/web/.env.example apps/web/.env
# DATABASE_URL, DIRECT_URL, JWT_* 설정
```

## DB (Supabase)

Supabase Dashboard → **Settings → Database → Connection string**

- `DATABASE_URL`: **Transaction pooler** (port 6543, `?pgbouncer=true`)
- `DIRECT_URL`: **Direct** (port 5432, migrate용)

```bash
npm run db:push      # 스키마 적용
npm run db:seed      # admin 계정 생성
```

## 로컬 실행

```bash
npm run dev
```

- http://localhost:3000
- 기본 계정: `admin` / `admin1234`

## Vercel 배포

1. Vercel에 repo 연결, **Root Directory**: `apps/web`
2. Environment Variables: `.env.example` 항목 전부 등록
3. Deploy

## 테스트

```bash
npm run test
```

## 클린 아키텍처

- **server/domain**: Use Case, Entity, Repository interface
- **server/data**: Prisma, Finnhub, Yahoo
- **client/domain**: API 호출용 Use Case (입력 검증)
- **presentation**: MVVM hooks + desktop/mobile UI

Use Case 정의: [docs/USECASES.md](docs/USECASES.md)
