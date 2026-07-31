import { AnalysisMiniSurveyPage } from '@/presentation/pages/AnalysisMiniSurveyPage';

interface Props {
  params: Promise<{ testId: string }>;
}

export default async function AnalysisMiniSurveyRoutePage({ params }: Props) {
  const { testId } = await params;
  return <AnalysisMiniSurveyPage testId={testId} />;
}
