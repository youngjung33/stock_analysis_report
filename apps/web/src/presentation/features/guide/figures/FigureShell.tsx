import { cn } from '../../../lib/cn';

interface Props {
  caption?: string;
  children: React.ReactNode;
  className?: string;
}

export function FigureShell({ caption, children, className }: Props) {
  return (
    <figure className={cn('mt-4 overflow-hidden rounded-lg border border-border bg-card/80 p-3 sm:p-4', className)}>
      <div className="overflow-x-auto">{children}</div>
      {caption && (
        <figcaption className="mt-2 text-center text-[11px] text-muted-foreground sm:text-xs">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}

interface TableProps {
  columns: string[];
  rows: string[][];
}

export function MiniTable({ columns, rows }: TableProps) {
  return (
    <table className="w-full min-w-[240px] text-left text-xs sm:text-sm">
      <thead>
        <tr className="border-b border-border text-muted-foreground">
          {columns.map((col) => (
            <th key={col} className="pb-2 pr-3 font-medium">
              {col}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i} className="border-b border-border/60 last:border-0">
            {row.map((cell, j) => (
              <td key={j} className={cn('py-2 pr-3', j === 0 ? 'font-medium text-foreground' : 'text-muted-foreground')}>
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

interface BarProps {
  label: string;
  value: number;
  max: number;
  color?: string;
  suffix?: string;
}

export function MiniBars({ bars }: { bars: BarProps[] }) {
  return (
    <div className="space-y-2.5">
      {bars.map((bar) => (
        <div key={bar.label}>
          <div className="mb-1 flex justify-between text-[11px] sm:text-xs">
            <span className="text-foreground">{bar.label}</span>
            <span className="tabular-nums text-muted-foreground">
              {bar.suffix ?? bar.value}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full"
              style={{
                width: `${Math.min(100, (bar.value / bar.max) * 100)}%`,
                backgroundColor: bar.color ?? '#6366f1',
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
