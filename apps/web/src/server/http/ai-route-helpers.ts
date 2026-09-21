import { AppErrorCode } from '@sar/shared';
import { ValidationError } from '@/server/domain/errors/domain.errors';
import { jsonData } from './route-utils';
import type { RunAiAnalysisUseCase } from '@/server/domain/usecases/ai/run-ai-analysis.use-case';
import type { AiAnalysisKind, AiContext, SupportedLocale } from '@sar/shared';

export async function runAiAnalysisResponse(
  runAiAnalysisUseCase: RunAiAnalysisUseCase,
  input: {
    userId: string;
    kind: AiAnalysisKind;
    context: AiContext;
    locale: SupportedLocale;
  },
) {
  try {
    const insight = await runAiAnalysisUseCase.execute(input);
    return jsonData({ enabled: true, insight });
  } catch (error) {
    if (error instanceof ValidationError && error.code === AppErrorCode.AI_DISABLED) {
      return jsonData({ enabled: false });
    }
    throw error;
  }
}
