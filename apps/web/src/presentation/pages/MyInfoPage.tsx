'use client';

import { CapitalAndSimulationSection } from '../components/CapitalAndSimulationSection';
import { TransactionForm } from '../features/transactions/TransactionForm';
import { TransactionList } from '../features/transactions/TransactionList';
import { MyTaxSection } from '../features/tax/MyTaxSection';
import { SummaryCards } from '../features/dashboard/SummaryCards';
import { useMyInfoScreen } from '../hooks/screens/useMyInfoScreen';
import { AppShell } from '../layout';
import { PageStack, Surface } from '../design-system';

/** 자본금·보유 종목 등록·수정 전용 페이지 */
export function MyInfoPage() {
  const screen = useMyInfoScreen();

  return (
    <AppShell title="내 정보" subtitle={`${screen.displayName}님의 포트폴리오`}>
      <PageStack>
        {screen.isGuest && (
          <p className="rounded-xl border border-amber-900/40 bg-amber-950/30 px-4 py-3 text-xs text-amber-200/90 md:px-5 md:text-sm">
            비회원 모드입니다. 여기서 입력한 자본금·거래는 브라우저에만 저장되며, 탭을 닫으면
            사라집니다. 회원가입하면 서버에 안전하게 보관됩니다.
          </p>
        )}

        {screen.isLoading && (
          <p className="text-sm text-muted-foreground">불러오는 중...</p>
        )}

        {screen.data && (
          <>
            <SummaryCards summary={screen.data.summary} />

            <section id="capital" className="scroll-mt-6">
              <Surface variant="section" className="mb-4 space-y-1">
                <h2 className="text-base font-semibold md:text-lg">자본금 관리</h2>
                <p className="text-xs text-muted-foreground md:text-sm">
                  초기 자본 설정, 입금·출금으로 가용 현금을 자유롭게 조정할 수 있습니다.
                </p>
              </Surface>
              <CapitalAndSimulationSection onPortfolioUpdated={screen.onPortfolioUpdated} />
            </section>

            <section id="stocks" className="scroll-mt-6 space-y-5">
              <Surface variant="section" className="space-y-1">
                <h2 className="text-base font-semibold md:text-lg">주식 거래</h2>
                <p className="text-xs text-muted-foreground md:text-sm">
                  매수·매도를 등록하거나 거래 내역을 삭제해 보유 종목을 조정할 수 있습니다.
                </p>
              </Surface>
              <TransactionForm onSuccess={screen.onPortfolioUpdated} />
              <div>
                <h3 className="mb-4 text-sm font-semibold text-muted-foreground md:text-base">
                  거래 내역
                </h3>
                <TransactionList refreshKey={screen.refreshKey} />
              </div>
            </section>

            <section id="tax" className="scroll-mt-6 space-y-5">
              <Surface variant="section" className="space-y-1">
                <h2 className="text-base font-semibold md:text-lg">내 세금</h2>
                <p className="text-xs text-muted-foreground md:text-sm">
                  조건을 선택하면 적용되는 세목과 포트폴리오 기반 추정 세액을 확인할 수 있습니다.
                  세금 기준 전체는{' '}
                  <a href="/tax" className="text-primary underline-offset-2 hover:underline">
                    세금 정보
                  </a>
                  탭에서 확인할 수 있습니다.
                </p>
              </Surface>
              <MyTaxSection refreshKey={screen.refreshKey} />
            </section>
          </>
        )}
      </PageStack>
    </AppShell>
  );
}
