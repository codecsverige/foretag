import { collection, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// ... existing component wrapper ...

// Home feed should show newly created ads immediately
// Ensure we query only active ads and order by createdAt desc.
async function loadAds() {
  const q = query(
    collection(db, 'ads'),
    where('status', '==', 'active'),
    orderBy('createdAt', 'desc'),
    limit(50)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export default async function HomePage() {
  const ads = await loadAds();
  // ... existing rendering ...
  return (
    <main>
      {/* existing hero etc. */}
      {/* render ads */}
      <section>
        {/* map ads */}
      </section>
    </main>
  );
}
