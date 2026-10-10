/**
 * 라우트 **이동** 시 즉시 표시 (Next `loading.tsx`, Suspense).
 *
 * 같은 화면 **확장**은 이 컴포넌트를 쓰지 않음 — 섹션별 로딩 문구/React Query 사용.
 * 예: 시장 분석 리포트, 종목 집중 분석+AI 패널, 관심종목 추가, 거래 폼 종목 선택.
 */
export function RouteLoadingFallback() {
  return (
    <div
      className="flex min-h-screen items-center justify-center bg-background text-muted-foreground"
      role="status"
      aria-busy="true"
      aria-live="polite"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground" />
    </div>
  );
}
