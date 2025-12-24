'use client'

import { useEffect, useState } from 'react';
import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Home feed should show newly created ads immediately
// Ensure we query only active ads and order by createdAt desc.
async function loadAds() {
  if (!db) {
    console.error('Firebase is not initialized');
    return [];
  }
  
  try {
    const q = query(
      collection(db, 'ads'),
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error loading ads:', error);
    return [];
  }
}

export default function HomePage() {
  const [ads, setAds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAds().then((data) => {
      setAds(data);
      setLoading(false);
    });
  }, []);

  return (
    <main>
      {/* existing hero etc. */}
      {loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      )}
      {/* render ads */}
      <section>
        {/* map ads */}
        {ads.length > 0 && (
          <div className="grid gap-4">
            {ads.map((ad: any) => (
              <div key={ad.id} className="p-4 border rounded">
                {ad.title}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
