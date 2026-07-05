interface FieldHintProps {
  message?: string;
  tone?: 'muted' | 'error' | 'success' | 'info';
}

const TONE_CLASS: Record<NonNullable<FieldHintProps['tone']>, string> = {
  muted: 'text-muted-foreground',
  error: 'text-danger',
  success: 'text-emerald-400',
  info: 'text-muted-foreground',
};

export function AuthFieldHint({ message, tone = 'muted' }: FieldHintProps) {
  if (!message) return null;
  return <p className={`mt-1 text-xs ${TONE_CLASS[tone]}`}>{message}</p>;
}
