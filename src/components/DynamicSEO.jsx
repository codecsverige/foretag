import React from "react";
import { Helmet } from "react-helmet-async";
import PropTypes from "prop-types";

/**
 * مكون للبيانات الوصفية الديناميكية وStructured Data
 * يحل مشكلة العنوان والوصف المكرر ويضيف JSON-LD للرحلات
 */
export default function DynamicSEO({ 
  title, 
  description, 
  keywords, 
  image, 
  url, 
  type = "website",
  ride = null,
  structuredData = null 
}) {
  // إنشاء JSON-LD للرحلات
  const generateRideStructuredData = (rideData) => {
    if (!rideData) return null;

    return {
      "@context": "https://schema.org",
      "@type": "Trip",
      "name": `Resa från ${rideData.from} till ${rideData.to}`,
      "description": `Skjuts från ${rideData.from} till ${rideData.to} den ${rideData.date}`,
      "url": `${window.location.origin}/book-ride/${rideData.id}`,
      "departureLocation": {
        "@type": "Place",
        "name": rideData.from,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": rideData.from
        }
      },
      "arrivalLocation": {
        "@type": "Place", 
        "name": rideData.to,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": rideData.to
        }
      },
      "departureTime": rideData.date,
      "offers": {
        "@type": "Offer",
        "price": rideData.price,
        "priceCurrency": "SEK",
        "availability": rideData.availableSeats > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
      },
      "provider": {
        "@type": "Person",
        "name": rideData.driverName || "VägVänner användare"
      }
    };
  };

  // إنشاء JSON-LD للموقع
  const generateWebsiteStructuredData = () => {
    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "VägVänner",
      "description": "Sveriges ledande samåkningsplattform",
      "url": "https://vagvanner.se",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://vagvanner.se/select-location?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };
  };

  // إنشاء JSON-LD للمؤسسة
  const generateOrganizationStructuredData = () => {
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": "VägVänner",
      "description": "Sveriges ledande samåkningsplattform. Hitta billiga skjuts eller erbjud resor enkelt, säkert och miljövänligt.",
      "url": "https://vagvanner.se",
      "logo": "https://vagvanner.se/favicon.png",
      "sameAs": [
        "https://www.facebook.com/vagvanner",
        "https://www.instagram.com/vagvanner",
        "https://www.linkedin.com/company/vagvanner"
      ],
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "availableLanguage": "Swedish",
        "email": "info@vagvanner.se"
      }
    };
  };

  // تحديد البيانات المنظمة
  const getStructuredData = () => {
    if (structuredData) return structuredData;
    if (ride) return generateRideStructuredData(ride);
    return [generateWebsiteStructuredData(), generateOrganizationStructuredData()];
  };

  const structuredDataToRender = getStructuredData();
  const canonicalUrl = url || window.location.href;

  return (
    <Helmet>
      {/* العنوان الديناميكي */}
      <title>{title || "VägVänner – Samåkning & Skjuts i Sverige"}</title>
      
      {/* الوصف الديناميكي */}
      <meta name="description" content={description || "Sveriges ledande samåkningsplattform. Hitta billiga skjuts eller erbjud resor enkelt, säkert och miljövänligt."} />
      
      {/* الكلمات المفتاحية */}
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title || "VägVänner – Samåkning & Skjuts i Sverige"} />
      <meta property="og:description" content={description || "Sveriges ledande samåkningsplattform. Hitta billiga skjuts eller erbjud resor enkelt, säkert och miljövänligt."} />
      <meta property="og:url" content={canonicalUrl} />
      {image && <meta property="og:image" content={image} />}
      <meta property="og:site_name" content="VägVänner" />
      <meta property="og:locale" content="sv_SE" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title || "VägVänner – Samåkning & Skjuts i Sverige"} />
      <meta name="twitter:description" content={description || "Sveriges ledande samåkningsplattform. Hitta billiga skjuts eller erbjud resor enkelt, säkert och miljövänligt."} />
      {image && <meta name="twitter:image" content={image} />}
      
      {/* JSON-LD Structured Data */}
      {Array.isArray(structuredDataToRender) ? (
        structuredDataToRender.map((data, index) => (
          <script key={index} type="application/ld+json">
            {JSON.stringify(data)}
          </script>
        ))
      ) : (
        <script type="application/ld+json">
          {JSON.stringify(structuredDataToRender)}
        </script>
      )}
    </Helmet>
  );
}

DynamicSEO.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  keywords: PropTypes.string,
  image: PropTypes.string,
  url: PropTypes.string,
  type: PropTypes.oneOf(['website', 'article', 'product']),
  ride: PropTypes.shape({
    id: PropTypes.string,
    from: PropTypes.string,
    to: PropTypes.string,
    date: PropTypes.string,
    price: PropTypes.number,
    availableSeats: PropTypes.number,
    driverName: PropTypes.string
  }),
  structuredData: PropTypes.oneOfType([
    PropTypes.object,
    PropTypes.array
  ])
}; 