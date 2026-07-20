'use client';

import Link from 'next/link';
import { ArrowRight, Banknote, LineChart } from 'lucide-react';
import { Surface } from '../../design-system';

interface Props {
  isGuest: boolean;
}

/** 자본금·종목 미등록 시 대시보드 첫 화면 안내 */
export function PortfolioOnboardingSection({ isGuest }: Props) {
  return (
    <Surface
      variant="section"
      className="border-dashed border-primary/30 bg-primary/5 space-y-5"
    >
      <div>
        <h2 className="text-lg font-semibold tracking-tight md:text-xl">
          투자 내역을 시작해 보세요
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {isGuest
            ? '비회원 모드입니다. 투자 원금과 보유 종목을 등록하면 투자 현황에서 한눈에 확인할 수 있습니다. (탭을 닫으면 데이터가 사라집니다)'
            : '아직 등록된 투자 원금이나 보유 종목이 없습니다. 아래 단계대로 입력해 주세요.'}
        </p>
      </div>

      <ol className="grid gap-3 sm:grid-cols-2">
        <li className="flex gap-3 rounded-xl border border-border bg-card/60 p-4">
          <Banknote className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-medium">1. 투자 원금·예수금 등록</p>
            <p className="mt-1 text-xs text-muted-foreground">
              투자 가능한 원화·달러 예수금을 입력합니다. 이후 입금·출금도 자유롭게 조정할 수 있습니다.
            </p>
          </div>
        </li>
        <li className="flex gap-3 rounded-xl border border-border bg-card/60 p-4">
          <LineChart className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
          <div>
            <p className="text-sm font-medium">2. 매매 등록</p>
            <p className="mt-1 text-xs text-muted-foreground">
              매수·매도 내역을 등록하면 보유 종목과 손익이 자동으로 계산됩니다.
            </p>
          </div>
        </li>
      </ol>

      <Link
        href="/my-info"
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 sm:w-auto"
      >
        내 정보에서 등록하기
        <ArrowRight className="size-4" aria-hidden />
      </Link>
    </Surface>
  );
}
