'use client';

import { useEffect } from 'react';
import { useToast } from '../components/Toast';

/** 쿼리/요청 실패 시 toast로 알림 (인라인 에러 대신) */
export function useErrorToast(isError: boolean, message: string) {
  const { showError } = useToast();

  useEffect(() => {
    if (isError) showError(message);
  }, [isError, message, showError]);
}
