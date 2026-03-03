import { R2BucketViewClient } from "@/components/dashboard/r2/R2BucketViewClient";

interface PageProps {
  params: Promise<{ bucket: string; path: string[] }>;
}

export default async function R2BucketFolderPage({ params }: PageProps) {
  const { bucket, path } = await params;
  return <R2BucketViewClient bucketSlug={bucket} pathSegments={path} />;
}
