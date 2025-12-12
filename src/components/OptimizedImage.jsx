import React, { useState, useEffect, useRef } from "react";
import PropTypes from "prop-types";

/**
 * مكون لتحسين تحميل الصور
 * يحل مشكلة الصور غير المضغوطة والتحميل البطيء
 */
export default function OptimizedImage({
  src,
  alt,
  className = "",
  width,
  height,
  placeholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect width='1' height='1' fill='%23f3f4f6'/%3E%3C/svg%3E",
  loading = "lazy",
  onLoad,
  onError,
  ...props
}) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    if (!src) return;

    // تحويل الصورة إلى WebP إذا كان المتصفح يدعمها
    const convertToWebP = (originalSrc) => {
      // إذا كانت الصورة بالفعل WebP، استخدمها كما هي
      if (originalSrc.includes('.webp') || originalSrc.includes('data:')) {
        return originalSrc;
      }

      // إنشاء canvas لتحويل الصورة إلى WebP
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        try {
          // تحويل إلى WebP مع جودة 85%
          const webpDataUrl = canvas.toDataURL('image/webp', 0.85);
          setImageSrc(webpDataUrl);
        } catch (error) {
          // إذا فشل التحويل، استخدم الصورة الأصلية
          console.warn('WebP conversion failed, using original image:', error);
          setImageSrc(originalSrc);
        }
      };
      
      img.onerror = () => {
        // إذا فشل تحميل الصورة، استخدم الصورة الأصلية
        setImageSrc(originalSrc);
      };
      
      img.src = originalSrc;
    };

    // تحميل الصورة
    const loadImage = () => {
      const img = new Image();
      
      img.onload = () => {
        setIsLoaded(true);
        setHasError(false);
        if (onLoad) onLoad(img);
      };
      
      img.onerror = () => {
        setHasError(true);
        setIsLoaded(false);
        if (onError) onError();
      };
      
      // محاولة تحويل إلى WebP
      if (window.Modernizr && window.Modernizr.webp) {
        convertToWebP(src);
      } else {
        setImageSrc(src);
      }
    };

    loadImage();
  }, [src, onLoad, onError]);

  // تحسين الأداء باستخدام Intersection Observer
  useEffect(() => {
    if (!imgRef.current || loading !== 'lazy') return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              observer.unobserve(img);
            }
          }
        });
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.01
      }
    );

    observer.observe(imgRef.current);

    return () => {
      if (imgRef.current) {
        observer.unobserve(imgRef.current);
      }
    };
  }, [loading]);

  return (
    <div 
      className={`optimized-image-container ${className}`}
      style={{
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#f3f4f6',
        ...(width && { width }),
        ...(height && { height })
      }}
    >
      {/* صورة خلفية للتحميل التدريجي */}
      {!isLoaded && !hasError && (
        <div 
          className="image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'loading 1.5s infinite'
          }}
        />
      )}
      
      {/* الصورة الرئيسية */}
      <img
        ref={imgRef}
        src={loading === 'lazy' ? placeholder : imageSrc}
        data-src={loading === 'lazy' ? imageSrc : undefined}
        alt={alt}
        className={`optimized-image ${isLoaded ? 'loaded' : ''} ${hasError ? 'error' : ''}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          transition: 'opacity 0.3s ease-in-out',
          opacity: isLoaded ? 1 : 0
        }}
        loading={loading}
        {...props}
      />
      
      {/* مؤشر الخطأ */}
      {hasError && (
        <div 
          className="image-error"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#6b7280',
            fontSize: '14px',
            textAlign: 'center'
          }}
        >
          <div>📷</div>
          <div>Bild kunde inte laddas</div>
        </div>
      )}
      
      {/* CSS للتحميل التدريجي */}
      <style jsx>{`
        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        
        .optimized-image.loaded {
          opacity: 1;
        }
        
        .optimized-image.error {
          opacity: 0;
        }
      `}</style>
    </div>
  );
}

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  placeholder: PropTypes.string,
  loading: PropTypes.oneOf(['lazy', 'eager']),
  onLoad: PropTypes.func,
  onError: PropTypes.func
};

// مكون مساعد لتحميل الصور المتعددة
export function ImageGallery({ images, className = "" }) {
  const [loadedImages, setLoadedImages] = useState(0);

  const handleImageLoad = () => {
    setLoadedImages(prev => prev + 1);
  };

  return (
    <div className={`image-gallery ${className}`}>
      {images.map((image, index) => (
        <OptimizedImage
          key={index}
          src={image.src}
          alt={image.alt}
          onLoad={handleImageLoad}
          className="gallery-image"
        />
      ))}
      {loadedImages < images.length && (
        <div className="loading-indicator">
          Laddar bilder... {loadedImages}/{images.length}
        </div>
      )}
    </div>
  );
}

ImageGallery.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      src: PropTypes.string.isRequired,
      alt: PropTypes.string.isRequired
    })
  ).isRequired,
  className: PropTypes.string
}; 