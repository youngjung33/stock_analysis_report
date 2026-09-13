'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { AiProviderId } from '@sar/shared';
import { useServices } from '../../hooks/useServices';

const PROVIDERS: AiProviderId[] = ['gemini', 'openai', 'anthropic', 'custom'];

export function AiCredentialSection() {
  const { t } = useTranslation();
  const { getAiCredentialStatusUseCase, upsertAiCredentialUseCase, deleteAiCredentialUseCase } =
    useServices();
  const [provider, setProvider] = useState<AiProviderId>('gemini');
  const [apiKey, setApiKey] = useState('');
  const [configured, setConfigured] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    getAiCredentialStatusUseCase
      .execute()
      .then((s) => {
        setConfigured(s.configured);
        if (s.configured && s.provider) setProvider(s.provider);
      })
      .finally(() => setLoading(false));
  }, [getAiCredentialStatusUseCase]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await upsertAiCredentialUseCase.execute(provider, apiKey);
      setConfigured(true);
      setApiKey('');
      setMessage(t('ai.credentialSaved'));
    } catch {
      setMessage(t('ai.credentialFailed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setSaving(true);
    try {
      await deleteAiCredentialUseCase.execute();
      setConfigured(false);
      setMessage(t('ai.credentialRemoved'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-base font-semibold">{t('ai.credentialTitle')}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t('ai.credentialDesc')}</p>
        {configured && (
          <p className="mt-2 text-xs text-emerald-400/90">{t('ai.credentialConfigured')}</p>
        )}
      </div>
      <form onSubmit={handleSave} className="flex flex-col gap-3">
        <label className="block">
          <span className="text-xs text-muted-foreground">{t('ai.credentialProvider')}</span>
          <select
            className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
            value={provider}
            onChange={(e) => setProvider(e.target.value as AiProviderId)}
          >
            {PROVIDERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-muted-foreground">{t('ai.credentialKey')}</span>
          <input
            type="password"
            autoComplete="off"
            className="mt-1 w-full rounded-lg border border-border-strong bg-muted px-3 py-2 text-sm"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="••••••••"
          />
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            disabled={saving || apiKey.length < 8}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-50"
          >
            {t('ai.credentialSave')}
          </button>
          {configured && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={saving}
              className="rounded-lg border border-border-strong px-4 py-2 text-sm text-muted-foreground"
            >
              {t('ai.credentialDelete')}
            </button>
          )}
        </div>
      </form>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
