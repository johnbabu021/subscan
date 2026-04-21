import { ResultsPageClient } from "./ResultsPageClient";

interface ResultsPageProps {
  params: {
    shareId: string;
  };
}

export default function ResultsPage({ params }: ResultsPageProps) {
  return <ResultsPageClient shareId={params.shareId} />}