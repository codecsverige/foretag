import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';

const PageMeta = ({ 
  title, 
  description, 
  noindex = false,
  canonical,
  type = "website" 
}) => {
  const location = useLocation();
  const baseUrl = "https://vagvanner.se";
  const currentUrl = `${baseUrl}${location.pathname}`;
  
  // Use provided canonical or current URL
  const canonicalUrl = canonical || currentUrl;
  
  // Default values
  const defaultTitle = "VägVänner - Samåkning i Sverige";
  const defaultDescription = "Sveriges plattform för samåkning. Hitta eller erbjud skjuts mellan svenska städer.";
  
  const finalTitle = title || defaultTitle;
  const finalDescription = description || defaultDescription;
  
  return (
    <Helmet>
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots meta tag */}
      {noindex ? (
        <meta name="robots" content="noindex,follow" />
      ) : (
        <meta name="robots" content="index,follow" />
      )}
      
      {/* Open Graph */}
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="VägVänner" />
      
      {/* Twitter */}
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDescription} />
    </Helmet>
  );
};

export default PageMeta;