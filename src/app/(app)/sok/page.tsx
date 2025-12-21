'use client'

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Search should also only show active ads.
export async function fetchSearchAds(searchTerm?: string) {
  if (!db) {
    console.error('Firebase is not initialized');
    return [];
  }

  try {
    // NOTE: If you already have a text index based search, keep it.
    // This change ensures status filter is applied so actives appear and drafts don't.
    const q = query(
      collection(db, 'ads'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

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
  } catch (error) {
    console.error('Error fetching search ads:', error);
    return [];
  }
}

export default function SearchPage() {
  const searchParams = useSearchParams();
  const term = searchParams?.get('q') ?? '';
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSearchAds(term).then((data) => {
      setAds(data);
      setLoading(false);
    });
  }, [term]);

  return (
    <main>
      {/* existing search UI */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Söker...</p>
        </div>
      )}
      <section>
        {/* render results */}
        {ads.length > 0 && (
          <div className="grid gap-4">
            {ads.map((ad: any) => (
              <div key={ad.id} className="p-4 border rounded">
                {ad.title}
              </div>
            ))}
          </div>
        )}
        {!loading && ads.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Inga resultat hittades</p>
          </div>
        )}
      </section>
    </main>
  );
}
