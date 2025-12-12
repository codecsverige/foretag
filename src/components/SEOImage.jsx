import React from 'react';

/**
 * SEO-optimized image component with proper alt tags
 */
const SEOImage = ({ 
  src, 
  alt, 
  title,
  width,
  height,
  loading = "lazy",
  className = "",
  ...props 
}) => {
  // Ensure alt text is always present
  const altText = alt || title || "VägVänner samåkning bild";
  
  return (
    <img
      src={src}
      alt={altText}
      title={title || altText}
      width={width}
      height={height}
      loading={loading}
      className={className}
      decoding="async"
      {...props}
    />
  );
};

export default SEOImage;