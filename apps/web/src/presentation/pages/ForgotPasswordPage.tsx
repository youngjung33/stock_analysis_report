'use client';

import { useState } from 'react';
import Link from 'next/link';
import { getErrorMessage } from '@/client/domain/errors/app-error';
import { useToast } from '@/presentation/components/Toast';
import { useServices } from '@/presentation/hooks/useServices';
import { APP_BRAND } from '@/presentation/layout';

export function ForgotPasswordPage() {
  const { requestPasswordResetUseCase } = useServices();
  const { showError, showSuccess } = useToast();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await requestPasswordResetUseCase.execute(email.trim());
      showSuccess('등록된 이메일이 있으면 재설정 링크를 보냈습니다.');
    } catch (err) {
      showError(getErrorMessage(err, '요청을 처리하지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <p className="text-center text-lg font-semibold">{APP_BRAND.name}</p>
      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-8 w-full max-w-md space-y-4 rounded-xl border border-border bg-card p-6"
      >
        <h1 className="text-xl font-semibold">비밀번호 찾기</h1>
        <p className="text-sm text-muted-foreground">가입 시 등록한 이메일로 재설정 링크를 보냅니다.</p>
        <label className="block">
          <span className="text-sm text-muted-foreground">이메일</span>
          <input
            type="email"
            className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary py-2.5 font-medium text-primary-foreground disabled:opacity-50"
        >
          {loading ? '발송 중...' : '재설정 링크 받기'}
        </button>
        <p className="text-center text-sm">
          <Link href="/login" className="text-primary hover:underline">
            로그인으로 돌아가기
          </Link>
        </p>
      </form>
    </div>
  );
}
