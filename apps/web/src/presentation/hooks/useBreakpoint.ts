import { useEffect, useState } from 'react';

/** Tailwind `md` 미만을 모바일로 취급 */
export const MOBILE_MEDIA_QUERY = '(max-width: 767px)';

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(MOBILE_MEDIA_QUERY).matches : false,
  );

  useEffect(() => {
    const media = window.matchMedia(MOBILE_MEDIA_QUERY);
    const onChange = () => setIsMobile(media.matches);
    onChange();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  return isMobile;
}
