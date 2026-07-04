import { cn } from '../lib/cn';
import { APP_BRAND } from './nav-config';

interface Props {
  className?: string;
}

export function AppFooter({ className }: Props) {
  return (
    <footer className={cn('border-t border-border bg-card/40', className)}>
      <div className="px-8 py-5 text-center text-xs text-muted-foreground">
        {APP_BRAND.name} &copy; {new Date().getFullYear()}
      </div>
    </footer>
  );
}
