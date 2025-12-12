// src/components/Seo.jsx
import React from "react";
import PropTypes from "prop-types";
import { Helmet } from "react-helmet-async";

export default function Seo({ title, description, canonical, schema, keywords, image }) {
  const fullTitle = title.includes("VägVänner") ? title : `${title} | VägVänner`;
  const fullDescription = description || "VägVänner – Sveriges ledande samåkningsplattform. Hitta billiga skjuts eller erbjud resor enkelt, säkert och miljövänligt.";
  const fullKeywords = keywords || "samåkning, bilpool, skjuts, miljövänlig, resa, delningsekonomi, bilresa, spara pengar, transport, vägvänner";
  const ogImage = image || "https://vagvanner.se/og/vagvanner-og.jpg";

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={fullDescription} />
      <meta name="keywords" content={fullKeywords} />
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={fullDescription} />
      <meta property="og:type" content="website" />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:locale" content="sv_SE" />
      
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={fullDescription} />
      <meta name="twitter:image" content={ogImage} />
      
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}

Seo.propTypes = {
  title:       PropTypes.string.isRequired,
  description: PropTypes.string,
  canonical:   PropTypes.string,
  schema:      PropTypes.oneOfType([PropTypes.object, PropTypes.array]),
  keywords:    PropTypes.string,
  image:       PropTypes.string,
};

Seo.defaultProps = {
  canonical: window.location.href,
  schema:    null,
  keywords:  null,
  image:     null,
};
