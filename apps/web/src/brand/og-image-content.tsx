import { BRAND_VISUAL } from './visual-theme';

/** JSX for next/og ImageResponse — shared by opengraph-image and apple-icon */
export function BrandMark({ size }: { size: 'icon' | 'og' }) {
  const chartHeight = size === 'og' ? 120 : 64;
  const chartWidth = size === 'og' ? 200 : 108;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size === 'og' ? 160 : 120,
        height: size === 'og' ? 160 : 120,
        borderRadius: size === 'og' ? 36 : 28,
        background: BRAND_VISUAL.surface,
        border: `2px solid ${BRAND_VISUAL.border}`,
        boxShadow: '0 24px 80px rgba(0,0,0,0.45)',
      }}
    >
      <svg
        width={chartWidth}
        height={chartHeight}
        viewBox="0 0 200 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M12 92 L52 62 L92 78 L172 22"
          stroke={BRAND_VISUAL.primary}
          strokeWidth="10"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="172" cy="22" r="10" fill={BRAND_VISUAL.success} />
        <path
          d="M12 102 H188"
          stroke="rgba(255,255,255,0.15)"
          strokeWidth="4"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function OgImageLayout() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '64px 72px',
        background: `linear-gradient(145deg, ${BRAND_VISUAL.background} 0%, #111827 48%, #1e1b4b 100%)`,
        color: BRAND_VISUAL.foreground,
        fontFamily: 'system-ui, Segoe UI, sans-serif',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 28 }}>
        <BrandMark size="og" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            style={{
              fontSize: 56,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
            }}
          >
            {BRAND_VISUAL.siteName}
          </div>
          <div style={{ fontSize: 28, color: BRAND_VISUAL.muted }}>{BRAND_VISUAL.tagline}</div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div style={{ fontSize: 24, color: BRAND_VISUAL.muted, maxWidth: 720, lineHeight: 1.45 }}>
          Portfolio · Trades · Dividends · Tax estimates
        </div>
        <div
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: BRAND_VISUAL.primary,
            background: BRAND_VISUAL.primarySoft,
            padding: '12px 20px',
            borderRadius: 999,
            border: `1px solid rgba(99,102,241,0.35)`,
          }}
        >
          sar.portfolio
        </div>
      </div>
    </div>
  );
}

export function AppleIconLayout() {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: `linear-gradient(145deg, ${BRAND_VISUAL.background} 0%, #1e1b4b 100%)`,
      }}
    >
      <BrandMark size="icon" />
    </div>
  );
}
