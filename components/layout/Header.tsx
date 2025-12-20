import Link from "next/link";

export default function Header() {
  return (
    <header className="w-full py-6 flex justify-center">
      <Link href="/" className="text-2xl font-bold">
        BokaNära 🌹
      </Link>
    </header>
  );
}
