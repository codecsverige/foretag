import Link from 'next/link';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// Public company page improvements: professional, works without images

type Params = { params: { id: string } };

export default async function CompanyPublicPage({ params }: Params) {
  const ref = doc(db, 'companies', params.id);
  const snap = await getDoc(ref);

  if (!snap.exists()) {
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

  const company: any = { id: snap.id, ...snap.data() };
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
              {company.category ?? company.industry ?? ''}
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
            </div>
          </div>
        </div>

        {company.description ? (
          <p className="mt-6 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {company.description}
          </p>
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
