import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="border-b">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <Link href="/" className="font-semibold">
          Foretag <span aria-label="rose">🌹</span>
        </Link>
        {/* existing nav links */}
        <div className="flex items-center gap-4">
          <Link
            href="/settings"
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
          >
            Settings
          </Link>
        </div>
      </nav>
    </header>
  );
}
