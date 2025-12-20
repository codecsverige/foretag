import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="border-b">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="font-semibold">
          Foretag <span aria-label="rose">🌹</span>
        </Link>
        {/* existing nav links */}
        <div className="flex items-center gap-4">{/* ... */}</div>
      </nav>
    </header>
  );
}
