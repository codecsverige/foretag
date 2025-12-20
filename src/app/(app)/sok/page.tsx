import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ... existing component wrapper ...

// Search should also only show active ads.
export async function fetchSearchAds(searchTerm?: string) {
  // NOTE: If you already have a text index based search, keep it.
  // This change ensures status filter is applied so actives appear and drafts don't.
  const base = [
    collection(db, 'ads'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(50),
  ] as any;

  // If project has a dedicated query for searchTerm, it will be applied elsewhere.
  const q = query(...base);
  const snap = await getDocs(q);
  let items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

  if (searchTerm) {
    const t = searchTerm.toLowerCase();
    items = items.filter(
      (a: any) =>
        (a.title ?? '').toLowerCase().includes(t) ||
        (a.description ?? '').toLowerCase().includes(t)
    );
  }

  return items;
}

export default async function SearchPage({ searchParams }: any) {
  const term = searchParams?.q ?? '';
  const ads = await fetchSearchAds(term);

  return (
    <main>
      {/* existing search UI */}
      <section>
        {/* render results */}
      </section>
    </main>
  );
}
