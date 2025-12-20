import { serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

// ...other imports

export default function CreatePage() {
  // ...state hooks

  const handleCreate = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        // ...map form fields
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Always write to Firestore. No localStorage fallback.
      const docRef = await addDoc(collection(db, 'companies'), payload);
      const id = docRef.id;

      setCreatedCompanyId(id);
      setIsSuccess(true);
    } catch (e: any) {
      console.error(e);
      setError('Det gick inte att skapa företaget. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {/* ...form UI */}
      {isSuccess && createdCompanyId && (
        <div className="mt-6 rounded border p-4">
          <h2 className="text-lg font-semibold">Företaget är skapat</h2>
          <p className="mt-2">ID: <code>{createdCompanyId}</code></p>
          <div className="mt-4">
            <Link className="underline" href={`/foretag/${createdCompanyId}`}>
              Visa företag
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
