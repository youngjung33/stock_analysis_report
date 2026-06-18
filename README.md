# 주식 포트폴리오 대시보드

개인용 주식 포트폴리오 관리 웹 앱입니다. 매수/매도 거래 등록, Finnhub(미국)·Yahoo Finance(한국) 시세 갱신, JWT 인증을 지원합니다.

## 기술 스택

- **Frontend**: React 19, Vite, TypeScript, Tailwind CSS v4, SCSS(reset/variables), TanStack Query
- **Backend**: NestJS, Prisma, SQLite
- **Auth**: JWT access token + refresh token (httpOnly cookie)

## 사전 요구

- Node.js 20+
- npm 10+
- [Finnhub API Key](https://finnhub.io/register) — **미국 종목** 시세 갱신 시에만 필요 (한국 종목은 키 없이 동작)

## 설치

```bash
npm install
npm run build -w @sar/shared
```

### API 설정

```bash
cp apps/api/.env.example apps/api/.env
# 미국 종목 사용 시: FINNHUB_API_KEY만 실제 키로 교체 (한국만 쓰면 그대로 두어도 됨)
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

## 테스트

```bash
npm run test              # API + Web 전체
npm run test -w @sar/api  # Jest (domain + use case)
npm run test -w @sar/web  # Vitest (use case)
```

테스트 소스는 루트 `test/` 디렉터리에 있습니다 (`test/api`, `test/web`).

Use Case 정의 및 테스트 ID: [docs/USECASES.md](docs/USECASES.md)

## 클린 아키텍처 (3계층)

Presentation · **Domain** (Use Case 포함) · **Data** 구조입니다. Web Presentation은 MVVM(Hook = ViewModel) 패턴을 사용하며, **768px 미만은 mobile UI**, 이상은 desktop UI로 분기합니다. 전역 스타일은 [`apps/web/src/styles/main.scss`](apps/web/src/styles/main.scss)(reset + CSS variables + Tailwind)에서 로드합니다. ESLint boundaries로 의존성 방향을 강제합니다.

## 확장

- `userId` FK로 다중 사용자 확장 가능
- `IMarketDataProvider`로 KIS 등 추가 API 연동 가능
- `DATABASE_URL` 변경으로 PostgreSQL 전환 가능
