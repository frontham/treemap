import { redirect } from 'next/navigation';

/** Legacy route — the map now lives under a project. Send to the project picker. */
export default async function LegacyMapRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/orgs/${slug}`);
}
