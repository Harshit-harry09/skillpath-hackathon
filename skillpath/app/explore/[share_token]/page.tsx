/**
 * Explore Results Page — Hybrid Server/Client Component with dual-layer sessionStorage cache
 */

import { getDb } from '@/lib/firebase-admin';
import ExploreResultsClient from '@/components/explore/ExploreResultsClient';

async function getExploration(token: string) {
  try {
    const db = getDb();
    const doc = await db.collection('explorations').doc(token).get();
    if (!doc.exists) return null;
    return doc.data();
  } catch (e) {
    console.warn('[Explore Results] Database fetch warning:', e instanceof Error ? e.message : e);
    return null;
  }
}

export default async function ExploreResultsPage({ params }: { params: Promise<{ share_token: string }> }) {
  const { share_token } = await params;
  const initialData = await getExploration(share_token);

  return (
    <ExploreResultsClient shareToken={share_token} initialData={initialData} />
  );
}
