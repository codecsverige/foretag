import React from "react";
import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import CookieBanner from "../components/CookieBanner.jsx";

export default function RootLayout({ title, description, children }) {
  const { pathname } = useLocation();
  const url = `https://vagvanner.se${pathname}`;

  // SEO data based on pathname
  const getSEOData = () => {
    switch (pathname) {
      case '/':
        return {
          title: 'VägVänner – Samåkning & Skjuts i Sverige',
          description: 'Sveriges ledande samåkningsplattform. Hitta billiga skjuts eller erbjud resor enkelt, säkert och miljövänligt. Spara pengar på dina resor idag!',
          keywords: 'samåkning, bilpool, skjuts, miljövänlig, resa, delningsekonomi, bilresa, spara pengar, transport, vägvänner'
        };
      case '/select-location':
        return {
          title: 'Välj Plats – VägVänner',
          description: 'Välj din start- och slutpunkt för att hitta eller erbjuda skjuts. Enkel och snabb bokning av resor i hela Sverige.',
          keywords: 'välj plats, samåkning, skjuts, resa, bokning, startpunkt, slutpunkt'
        };
      case '/my-rides':
        return {
          title: 'Mina Resor – VägVänner',
          description: 'Hantera dina bokade resor och erbjudna skjuts. Se din resehistorik och kommande resor på VägVänner.',
          keywords: 'mina resor, bokade resor, erbjudna skjuts, resehistorik, kommande resor'
        };
      case '/inbox':
        return {
          title: 'Inkorg – VägVänner',
          description: 'Dina meddelanden och notifikationer från VägVänner. Håll dig uppdaterad om dina resor och bokningar.',
          keywords: 'inkorg, meddelanden, notifikationer, resor, bokningar'
        };
      case '/user-profile':
        return {
          title: 'Min Profil – VägVänner',
          description: 'Hantera din profil, inställningar och personlig information på VägVänner. Uppdatera dina uppgifter enkelt.',
          keywords: 'min profil, inställningar, personlig information, uppdatera uppgifter'
        };
      case '/create-ride':
        return {
          title: 'Skapa Resa – VägVänner',
          description: 'Erbjud skjuts och skapa en ny resa på VägVänner. Dela din bil och spara pengar tillsammans med andra.',
          keywords: 'skapa resa, erbjud skjuts, dela bil, spara pengar, samåkning'
        };
      case '/book-ride':
        return {
          title: 'Boka Resa – VägVänner',
          description: 'Hitta och boka skjuts på VägVänner. Spara pengar på dina resor genom att dela bil med andra.',
          keywords: 'boka resa, hitta skjuts, spara pengar, dela bil, samåkning'
        };
      default:
        return {
          title: title || 'VägVänner',
          description: description || 'Sveriges ledande samåkningsplattform. Hitta billiga skjuts eller erbjud resor enkelt, säkert och miljövänligt.',
          keywords: 'samåkning, bilpool, skjuts, miljövänlig, resa, delningsekonomi, bilresa, spara pengar, transport, vägvänner'
        };
    }
  };

  const seoData = getSEOData();

  return (
    <>
      <Helmet>
        <title>{seoData.title}</title>
        <meta name="description" content={seoData.description} />
        <meta name="keywords" content={seoData.keywords} />
        <link rel="canonical" href={url} />

        {/* OpenGraph / Twitter */}
        <meta property="og:title" content={seoData.title} />
        <meta property="og:description" content={seoData.description} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={url} />
        <meta property="og:image" content="https://vagvanner.se/og/vagvanner-og.jpg" />
        <meta property="og:locale" content="sv_SE" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoData.title} />
        <meta name="twitter:description" content={seoData.description} />
        <meta name="twitter:image" content="https://vagvanner.se/og/vagvanner-og.jpg" />
      </Helmet>
      {children}
      <CookieBanner />
    </>
  );
}
