# 주식 포트폴리오 대시보드

개인용 주식 포트폴리오 관리 웹 앱입니다. 매수/매도 거래 등록, Finnhub(미국)·Yahoo Finance(한국) 시세 갱신, JWT 인증을 지원합니다.

## 기술 스택

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS, TanStack Query
- **Backend**: NestJS, Prisma, SQLite
- **Auth**: JWT access token + refresh token (httpOnly cookie)

## 사전 요구

- Node.js 20+
- npm 10+
- [Finnhub API Key](https://finnhub.io/) (미국 종목 시세)

## 설치

```bash
npm install
npm run build -w @sar/shared
```

### API 설정

```bash
cp apps/api/.env.example apps/api/.env
# FINNHUB_API_KEY 등 값 수정
```

```bash
cd apps/api
npx prisma migrate dev --name init
npx ts-node prisma/seed.ts
```

### Web 설정

```bash
cp apps/web/.env.example apps/web/.env
```

## 실행

터미널 1 (API):

```bash
npm run dev:api
```

터미널 2 (Web):

```bash
npm run dev:web
```

- Web: http://localhost:5173
- API: http://localhost:3000
- 기본 계정: `admin` / `admin1234` (`.env`의 SEED_* 값)

## 주요 기능

- 로그인 / JWT 자동 갱신
- 매수·매도·분할매수 거래 등록
- 포트폴리오 대시보드 (평단, 미실현/실현 손익)
- **갱신** 버튼으로 보유 종목 시세 최신화

## 클린 아키텍처

프론트/백엔드 모두 `domain` → `application` → `infrastructure` / `presentation` 레이어를 따릅니다. ESLint boundaries 규칙으로 의존성 방향을 강제합니다.

## 확장

- `userId` FK로 다중 사용자 확장 가능
- `IMarketDataProvider`로 KIS 등 추가 API 연동 가능
- `DATABASE_URL` 변경으로 PostgreSQL 전환 가능
