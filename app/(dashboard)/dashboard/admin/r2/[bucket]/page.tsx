import { R2BucketViewClient } from "@/components/dashboard/r2/R2BucketViewClient";

interface PageProps {
  params: Promise<{ bucket: string }>;
}

export default async function R2BucketPage({ params }: PageProps) {
  const { bucket } = await params;
  return <R2BucketViewClient bucketSlug={bucket} pathSegments={[]} />;
}
