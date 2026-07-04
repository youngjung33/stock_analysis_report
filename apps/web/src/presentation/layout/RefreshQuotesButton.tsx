import { cn } from '../lib/cn';

interface Props {
  onClick: () => void;
  loading?: boolean;
  className?: string;
  compact?: boolean;
}

/** 대시보드 시세 갱신 — AppShell headerActions용 */
export function RefreshQuotesButton({ onClick, loading, className, compact }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={cn(
        'rounded-lg bg-success font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50',
        compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm',
        className,
      )}
    >
      {loading ? '갱신 중...' : '갱신'}
    </button>
  );
}
