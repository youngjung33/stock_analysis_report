import { DesktopFooter } from './DesktopFooter';
import { DesktopHeader } from './DesktopHeader';

interface Props {
  title: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  showFooter?: boolean;
}

export function DesktopLayout({
  title,
  subtitle,
  headerActions,
  children,
  showFooter = true,
}: Props) {
  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <DesktopHeader title={title} subtitle={subtitle} actions={headerActions} />
      <div className="flex-1">{children}</div>
      {showFooter && <DesktopFooter />}
    </div>
  );
}
