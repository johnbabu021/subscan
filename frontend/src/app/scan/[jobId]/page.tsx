import { ScanPageClient } from "./ScanPageClient";

interface ScanPageProps {
  params: {
    jobId: string;
  };
}

export default function ScanPage({ params }: ScanPageProps) {
  return <ScanPageClient jobId={params.jobId} />;