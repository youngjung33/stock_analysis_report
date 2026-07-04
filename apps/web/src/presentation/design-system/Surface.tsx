import { cn } from '../lib/cn';

type SurfaceVariant = 'section' | 'card' | 'subtle';

const VARIANT_CLASS: Record<SurfaceVariant, string> = {
  section:
    'ui-surface ui-surface--section rounded-2xl border border-border bg-card/90 p-6 shadow-sm sm:p-8',
  card: 'ui-surface ui-surface--card rounded-xl border border-border bg-card/70 p-5 sm:p-6',
  subtle:
    'ui-surface ui-surface--subtle rounded-xl border border-border/80 bg-muted/30 p-5 sm:p-6',
};

interface SurfaceProps extends React.HTMLAttributes<HTMLElement> {
  variant?: SurfaceVariant;
  as?: 'section' | 'div' | 'article' | 'form';
}

/** shadcn-fintech 스타일 표면 — 섹션·카드 패딩 통일 */
export function Surface({
  variant = 'section',
  as: Tag = 'section',
  className,
  children,
  ...props
}: SurfaceProps) {
  return (
    <Tag className={cn(VARIANT_CLASS[variant], className)} {...props}>
      {children}
    </Tag>
  );
}

interface PageStackProps {
  className?: string;
  children: React.ReactNode;
}

/** 페이지 섹션 간 세로 간격 */
export function PageStack({ className, children }: PageStackProps) {
  return <div className={cn('space-y-8 sm:space-y-10', className)}>{children}</div>;
}
