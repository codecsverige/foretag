import React from "react";
import { useParams } from "react-router-dom";
import PageMeta from "../components/PageMeta.jsx";

const normalize = (s = "") => String(s).toLowerCase().trim();
const prettyCity = (slug = "") => {
  const m = normalize(slug)
    .replace(/-/g, " ")
    .replace(/aa/g, "å").replace(/ae/g, "ä").replace(/oe/g, "ö");
  const map = {
    malmo: "Malmö",
    goteborg: "Göteborg",
    gothenburg: "Göteborg",
    vasteras: "Västerås",
    orebro: "Örebro",
    jonkoping: "Jönköping",
    lulea: "Luleå",
    umea: "Umeå",
    gavle: "Gävle",
    vaxjo: "Växjö",
    ostersund: "Östersund",
  };
  if (map[m]) return map[m];
  return m.split(" ").map(w => (w ? w[0].toUpperCase() + w.slice(1) : w)).join(" ");
};

export default function CityPage() {
  const { city } = useParams();
  const cityName = prettyCity(city || "");
  const canonical = `https://vagvanner.se/city/${city}`;
  const title = `Samåkning ${cityName} – Hitta resor och erbjud skjuts | VägVänner`;
  const desc = `Sök samåkning i ${cityName}. Hitta resor till populära destinationer eller erbjud plats i din bil. Billigare och smidigare än dyra biljetter.`;

  const popular = [
    { href: `/ride/${city}-stockholm`, label: `${cityName} → Stockholm` },
    { href: `/ride/${city}-goteborg`, label: `${cityName} → Göteborg` },
    { href: `/ride/${city}-malmo`, label: `${cityName} → Malmö` },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <PageMeta title={title} description={desc} canonical={canonical} />

      <section className="max-w-5xl mx-auto px-4 pt-10 pb-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900">
            Samåkning i {cityName}
          </h1>
          <p className="mt-3 text-gray-700 max-w-2xl mx-auto">
            Hitta skjuts till och från {cityName} direkt. Dela kostnaden, res flexibelt och smidigt.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-10">
          <a
            href={`/?from=${encodeURIComponent(cityName)}`}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-center"
          >
            Sök resor från {cityName}
          </a>
          <a
            href={`/create-ride?from=${encodeURIComponent(cityName)}`}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-center"
          >
            Erbjud resa från {cityName}
          </a>
        </div>

        <div className="mb-12">
          <h2 className="text-xl font-bold text-gray-900">Populära rutter</h2>
          <ul className="mt-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            {popular.map((r) => (
              <li key={r.href}>
                <a href={r.href} className="block p-3 rounded-lg bg-white border shadow-sm hover:shadow-md transition">
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {[{
            t: "Billigare",
            p: "Dela kostnad istället för dyra biljetter."
          }, {
            t: "Flexibelt",
            p: "Fungerar även vid sena tider eller fulla tåg."
          }, {
            t: "Enkelt",
            p: "Publicera annons på några sekunder."
          }].map((b) => (
            <div key={b.t} className="p-5 rounded-xl bg-white border shadow-sm">
              <div className="text-base font-bold text-gray-900">{b.t}</div>
              <div className="mt-1 text-sm text-gray-600">{b.p}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
