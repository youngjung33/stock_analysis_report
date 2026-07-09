'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '@/presentation/components/Toast';
import { useServices } from '@/presentation/hooks/useServices';
import { APP_BRAND } from '@/presentation/layout';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { resetPasswordUseCase } = useServices();
  const { showError, showSuccess } = useToast();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!token) {
      showError('유효하지 않은 재설정 링크입니다.');
      return;
    }

    setLoading(true);
    try {
      await resetPasswordUseCase.execute({ token, password, passwordConfirm });
      showSuccess('비밀번호가 변경되었습니다. 로그인해 주세요.');
      router.replace('/login');
    } catch (err) {
      showError(getErrorMessage(err, '비밀번호 재설정에 실패했습니다.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-8 w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6">
      <h1 className="text-xl font-semibold">비밀번호 재설정</h1>
      <label className="block">
        <span className="text-sm text-muted-foreground">새 비밀번호</span>
        <input
          type="password"
          className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </label>
      <label className="block">
        <span className="text-sm text-muted-foreground">새 비밀번호 확인</span>
        <input
          type="password"
          className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-primary py-2.5 font-medium text-primary-foreground disabled:opacity-50"
      >
        {loading ? '변경 중...' : '비밀번호 변경'}
      </button>
      <p className="text-center text-sm">
        <Link href="/login" className="text-primary hover:underline">
          로그인으로 돌아가기
        </Link>
      </p>
    </form>
  );
}

export function ResetPasswordPage() {
  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <p className="text-center text-lg font-semibold">{APP_BRAND.name}</p>
      <Suspense fallback={null}>
        <ResetPasswordForm />
      </Suspense>
    </div>
  );
}
