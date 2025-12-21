import { serverTimestamp, doc, setDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { getAuth } from 'firebase/auth';

// ... existing imports and component wrapper ...

/**
 * NOTE:
 * This page previously used localStorage / local_ ids for drafts.
 * We now always write real ads to Firestore so they appear immediately.
 */

async function createAdInFirestore(payload: any) {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Not authenticated');

  if (!db) {
    throw new Error('Firebase är inte konfigurerat. Kontakta support.');
  }

  // Create a new doc id up front so we can use it in the UI immediately
  const ref = doc(collection(db, 'ads'));
  const now = serverTimestamp();

  const ad = {
    ...payload,
    id: ref.id,
    ownerId: uid,
    status: 'active',
    createdAt: now,
    updatedAt: now,
  };

  await setDoc(ref, ad, { merge: false });
  return ref.id;
}

export default function NewAdPage() {
  // ... existing component state ...

  const onSubmit = async (formValues: any) => {
    // Map from form values to Firestore document shape
    const payload = {
      title: formValues.title?.trim(),
      description: formValues.description?.trim(),
      category: formValues.category ?? null,
      companyId: formValues.companyId ?? null,
      location: formValues.location ?? null,
      price: formValues.price ?? null,
      contactEmail: formValues.contactEmail ?? null,
    };

    // Never use localStorage/local_ ids for real creation
    const adId = await createAdInFirestore(payload);

    // ... existing navigation/toast ...
    // Example:
    // router.push(`/annonser/${adId}`);
  };

  // ... existing JSX ...
  return (
    <div>
      {/* existing form that calls onSubmit */}
    </div>
  );
}
