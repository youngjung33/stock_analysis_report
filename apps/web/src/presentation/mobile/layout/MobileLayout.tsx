import { MobileFooterNav } from './MobileFooterNav';
import { MobileHeader } from './MobileHeader';

interface Props {
  title: string;
  subtitle?: string;
  onLogout: () => void;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  showFooterNav?: boolean;
}

export function MobileLayout({
  title,
  subtitle,
  onLogout,
  headerActions,
  children,
  showFooterNav = true,
}: Props) {
  return (
    <div className={`min-h-screen bg-slate-950 text-slate-100 ${showFooterNav ? 'pb-20' : ''}`}>
      <MobileHeader
        title={title}
        subtitle={subtitle}
        onLogout={onLogout}
        actions={headerActions}
      />
      <main className="px-4 py-4">{children}</main>
      {showFooterNav && <MobileFooterNav />}
    </div>
  );
}
