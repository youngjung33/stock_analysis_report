# 종목 마스터 (StockCatalog) 임포트

종목 검색용 데이터는 **git에 넣지 않고**, 로컬에서 받아 Supabase에 넣습니다.

- `apps/web/data/stock-catalog/` — fetch 산출물 (gitignore)
- `apps/web/prisma/` — schema·migration·seed (gitignore, 로컬/Supabase 전용)

## 1. 파일 받기

```bash
npm run fetch:stocks
```

생성 위치 (`apps/web/data/stock-catalog/`, gitignore):

| 파일 | 설명 |
|------|------|
| `raw/nasdaqlisted.txt` | 미국 NASDAQ 원본 txt |
| `raw/otherlisted.txt` | NYSE·AMEX 등 원본 txt |
| `raw/kind-corp-list.html` | 한국 KIND 상장법인 원본 html |
| `raw/*.sha256` | 원본 파일 해시 (변경 없으면 json 재생성 skip) |
| `us-stocks.json` | 미국 종목 JSON |
| `kr-stocks.json` | 한국 종목 JSON |
| `all-stocks.json` | 한국+미국 합본 |

한국·미국 모두 **원본 파일 1~2회 HTTP 다운로드 → SHA256 해시 비교** 방식입니다.  
내용이 같으면 json 재생성을 건너뜁니다. API 키는 필요 없습니다.

스크립트: `apps/web/scripts/fetch-stocks.ts` (내부: `stock-catalog-fetch.ts`)

## 2. JSON 형식

```json
[
  {
    "symbol": "005930",
    "name": "삼성전자",
    "market": "KR",
    "board": "KOSPI",
    "yahooSymbol": "005930.KS"
  },
  {
    "symbol": "AAPL",
    "name": "Apple Inc.",
    "market": "US",
    "board": "NASDAQ",
    "yahooSymbol": "AAPL"
  }
]
```

Supabase `StockCatalog` 테이블 컬럼 (Prisma schema 기준, 로컬 파일):

| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | uuid | 자동 생성 |
| symbol | text | 종목코드 |
| name | text | 종목명 |
| market | text | `KR` 또는 `US` |
| board | text | KOSPI, KOSDAQ, NASDAQ, NYSE, AMEX 등 |
| yahooSymbol | text | 시세 조회용 |
| isActive | boolean | 기본 `true` |
| syncedAt | timestamptz | 임포트 시각 |

`(symbol, market)` 유니크.

## 3. Supabase에 넣는 방법

### A) 스크립트 (Prisma) — 권장

```bash
npm run db:push          # StockCatalog 테이블 생성
npm run db:import-stocks # all-stocks.json → DB
```

특정 파일만:

```bash
npm run db:import-stocks -- --file apps/web/data/stock-catalog/kr-stocks.json
```

스크립트: `apps/web/scripts/import-stocks.ts`

### B) Supabase Dashboard

1. Table Editor → `StockCatalog`
2. Import data from CSV/JSON (또는 SQL Editor에서 `COPY`)

### C) MCP (Supabase)

JSON 배열을 읽어 `StockCatalog`에 insert/upsert.  
`symbol`+`market` 기준으로 중복 처리.

## 4. 검색 동작

서버: `SearchStocksUseCase` (`GET /api/market/search?q=...&market=KR|US`)

| 조건 | 동작 |
|------|------|
| `StockCatalog`에 해당 시장 **1건 이상** | **DB 검색** (`catalog.search`) |
| 카탈로그 비어 있음 | Yahoo API fallback + `@sar/shared` featured 종목 |

DB에 넣은 뒤 `/transactions` 거래 등록·종목 검색 UI가 DB 기준으로 동작합니다.

## 5. 운영 참고

- 대량 import 후 DB pooler 연결 사용 권장
- import는 idempotent upsert — 재실행해도 `(symbol, market)` 기준 갱신
- 프로덕션 DB에 import할 때는 **로컬에서 env로 DB 연결만 지정**해 실행 (연결 문자열은 git·문서에 기재하지 않음)
