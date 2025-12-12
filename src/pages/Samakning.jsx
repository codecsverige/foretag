import React from "react";
import { Link } from "react-router-dom";

export default function SamakningPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <section className="max-w-5xl mx-auto px-4 pt-10 pb-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
            Samåkning i Sverige – Guide, tips och resor
          </h1>
          <p className="mt-3 text-gray-600 max-w-2xl mx-auto">
            Ekonomiskt smart alternativ till dyra biljetter. Perfekt för studenter, arbetspendlare och alla som vill resa billigare. 
            Här samlar vi allt du behöver för att komma igång med samåkning.
          </p>
        </div>

        {/* CTA-kort */}
        <div className="grid sm:grid-cols-2 gap-4 mb-10">
          <Link to="/select-location" className="p-5 rounded-xl bg-white border shadow-sm hover:shadow-md transition">
            <div className="text-lg font-bold">Hitta samåkning</div>
            <p className="text-sm text-gray-600 mt-1">Sök bland hundratals resor i hela Sverige</p>
          </Link>
          <Link to="/create-ride" className="p-5 rounded-xl bg-white border shadow-sm hover:shadow-md transition">
            <div className="text-lg font-bold">Erbjud resa</div>
            <p className="text-sm text-gray-600 mt-1">Publicera din resa på några sekunder</p>
          </Link>
        </div>

        {/* Fördelar */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {[
            { title: "Ekonomiskt smart", text: "Alternativ till dyra kollektivtrafik och taxi. Perfekt för studenter och arbetspendlare." },
            { title: "Smidigare", text: "Res direkt från punkt A till B – utan byten och väntetider." },
            { title: "Miljövänligt", text: "Mindre utsläpp per person. Dela bil istället för att köra ensam." }
          ].map((b) => (
            <div key={b.title} className="p-5 rounded-xl bg-white border shadow-sm">
              <div className="text-base font-bold text-gray-900">{b.title}</div>
              <div className="mt-1 text-sm text-gray-600">{b.text}</div>
            </div>
          ))}
        </div>

        {/* Populära rutter (internt) */}
        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900">Populära rutter</h2>
          <ul className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {[
              { href: "/ride/stockholm-goteborg", label: "Stockholm → Göteborg" },
              { href: "/ride/malmo-stockholm", label: "Malmö → Stockholm" },
              { href: "/ride/uppsala-stockholm", label: "Uppsala → Stockholm" },
              { href: "/ride/goteborg-stockholm", label: "Göteborg → Stockholm" },
              { href: "/ride/stockholm-malmo", label: "Stockholm → Malmö" },
              { href: "/select-location", label: "Visa fler rutter" }
            ].map((r) => (
              <li key={r.href}>
                <a href={r.href} className="block p-3 rounded-lg bg-white border shadow-sm hover:shadow-md transition">
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-xl font-bold text-gray-900">Vanliga frågor</h2>
          <div className="mt-3 space-y-3">
            <details className="p-4 bg-white rounded-lg border shadow-sm">
              <summary className="font-semibold cursor-pointer">Är samåkning lagligt i Sverige?</summary>
              <p className="text-sm text-gray-700 mt-2">
                Ja – så länge det handlar om kostnadsdelning mellan privatpersoner och inte yrkesmässig trafik.
                VägVänner är en förmedlingstjänst; själva betalningar och avtal sker mellan resenärer.
              </p>
            </details>
            <details className="p-4 bg-white rounded-lg border shadow-sm">
              <summary className="font-semibold cursor-pointer">Hur fungerar betalning?</summary>
              <p className="text-sm text-gray-700 mt-2">
                Ni kommer själva överens. VägVänner hanterar inte biljetter eller kommersiell försäljning. Vid
                delning av kostnader ansvarar parterna för att följa lagar och regler.
              </p>
            </details>
            <details className="p-4 bg-white rounded-lg border shadow-sm">
              <summary className="font-semibold cursor-pointer">Hur hittar jag resor snabbt?</summary>
              <p className="text-sm text-gray-700 mt-2">
                Använd sökningen, skapa bevakning för din sträcka och dela din annons – då får du snabbast svar.
              </p>
            </details>
          </div>
        </div>

        {/* Sektion: upptäck fler resor */}
        <div className="p-6 rounded-xl bg-white border shadow-sm">
          <h2 className="text-xl font-bold text-gray-900">Upptäck fler resor</h2>
          <p className="text-sm text-gray-600 mt-1">
            Sök efter "resor", "skjuts" eller orter direkt – VägVänner hjälper dig även när du inte skriver
            ordet samåkning. Prova till exempel att söka efter städerna du vill resa mellan.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link to="/select-location" className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm">Sök resor</Link>
            <Link to="/create-ride" className="px-4 py-2 rounded-lg bg-gray-900 text-white hover:bg-black text-sm">Erbjud resa</Link>
          </div>
        </div>
      </section>

      {/* FAQ Schema removed to avoid duplicate FAQPage on this URL (handled elsewhere) */}
    </div>
  );
}

