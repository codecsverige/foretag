import Link from 'next/link';

type Props = {
  company: any;
};

export default function CompanyCard({ company }: Props) {
  const name = company?.name ?? 'Företag';
  const subtitle = company?.category ?? company?.industry ?? '';
  const initials = name
    .split(' ')
    .slice(0, 2)
    .map((s: string) => s[0]?.toUpperCase())
    .join('');

  return (
    <Link
      href={`/foretag/${company.id}`}
      className="group block rounded-lg border bg-card p-4 transition hover:shadow-sm"
    >
      <div className="flex items-start gap-3">
        {/* No image required: professional fallback */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border bg-muted text-sm font-semibold">
          {initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-semibold group-hover:underline">
              {name}
            </h3>
          </div>
          {subtitle ? (
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {subtitle}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {company?.location ? <span>{company.location}</span> : null}
            {company?.orgNumber ? <span>Org.nr {company.orgNumber}</span> : null}
          </div>
        </div>
      </div>
    </Link>
  );
}
