'use client'

import { useState } from 'react';
import { serverTimestamp, addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';

// This page is a placeholder - main creation page is at /skapa

export default function CreatePage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

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
      if (!db) {
        throw new Error('Firebase är inte konfigurerat. Kontakta support.');
      }
      
      const docRef = await addDoc(collection(db, 'companies'), payload);
      const id = docRef.id;

      setCreatedCompanyId(id);
      setIsSuccess(true);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Det gick inte att skapa företaget. Försök igen.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Skapa företag</h1>
      <p className="text-muted-foreground mb-4">
        Denna sida är en platshållare. Använd{' '}
        <Link className="underline" href="/skapa">
          /skapa
        </Link>
        {' '}för att skapa en företagsannons.
      </p>
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
      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}
