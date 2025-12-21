'use client'

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Public company page improvements: professional, works without images

type Params = { params: { id: string } };

export default function CompanyPublicPage({ params }: Params) {
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    async function fetchCompany() {
      if (!db) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, 'companies', params.id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          setNotFound(true);
        } else {
          setCompany({ id: snap.id, ...snap.data() });
        }
      } catch (error) {
        console.error('Error fetching company:', error);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    }

    fetchCompany();
  }, [params.id]);

  if (loading) {
    return (
      <main className="container mx-auto p-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground">Laddar...</p>
        </div>
      </main>
    );
  }

  if (notFound || !company) {
    return (
      <main className="container mx-auto p-6">
        <h1 className="text-2xl font-semibold">Företag hittades inte</h1>
        <p className="mt-2 text-muted-foreground">
          Kontrollera länken eller gå tillbaka till{' '}
          <Link className="underline" href="/">
            startsidan
          </Link>
          .
        </p>
      </main>
    );
  }

  const initials = (company.name ?? 'Företag')
    .split(' ')
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase())
    .join('');

  return (
    <main className="container mx-auto p-6">
      <header className="rounded-lg border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border bg-muted text-lg font-semibold">
            {initials}
          </div>

          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-tight">
              {company.name ?? 'Företag'}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {company.categoryName ?? company.category ?? company.industry ?? ''}
            </p>

            <div className="mt-4 grid gap-2 text-sm">
              {company.website ? (
                <a
                  className="underline"
                  href={company.website}
                  target="_blank"
                  rel="noreferrer"
                >
                  {company.website}
                </a>
              ) : null}
              {company.email ? (
                <a className="underline" href={`mailto:${company.email}`}>
                  {company.email}
                </a>
              ) : null}
              {company.phone ? <div>{company.phone}</div> : null}
              {company.address ? <div>{company.address}</div> : null}
              {company.city ? <div>{company.city}</div> : null}
            </div>
          </div>
        </div>

        {company.description ? (
          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {company.description}
          </p>
        ) : null}

        {company.services && company.services.length > 0 ? (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Tjänster</h3>
            <div className="grid gap-3">
              {company.services.map((service: any, index: number) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-medium">{service.name}</h4>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-semibold">{service.price} SEK</div>
                      {service.duration && (
                        <div className="text-sm text-muted-foreground">
                          {service.duration} min
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {company.openingHours ? (
          <div className="mt-6">
            <h3 className="font-semibold mb-3">Öppettider</h3>
            <div className="grid gap-2 text-sm">
              {Object.entries(company.openingHours).map(([day, hours]: [string, any]) => {
                const dayNames: { [key: string]: string } = {
                  monday: 'Måndag',
                  tuesday: 'Tisdag',
                  wednesday: 'Onsdag',
                  thursday: 'Torsdag',
                  friday: 'Fredag',
                  saturday: 'Lördag',
                  sunday: 'Söndag',
                };
                return (
                  <div key={day} className="flex justify-between">
                    <span className="font-medium">{dayNames[day]}</span>
                    <span className="text-muted-foreground">
                      {hours.closed ? 'Stängt' : `${hours.open} - ${hours.close}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}
      </header>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Annonser</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Se företagets aktiva annonser i listan.
        </p>
        {/* existing ads listing component can be rendered below if exists */}
      </section>
    </main>
  );
}
