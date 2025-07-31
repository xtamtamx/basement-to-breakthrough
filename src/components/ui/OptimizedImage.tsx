import React, { useState, useEffect, useRef } from 'react';
import { devLog } from '@utils/devLogger';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  srcSet?: string;
  sizes?: string;
  alt: string;
  priority?: 'high' | 'low' | 'auto';
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
  quality?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  srcSet,
  sizes,
  alt,
  priority = 'auto',
  placeholder,
  onLoad,
  onError,
  quality = 85,
  className = '',
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;

    // Set loading priority
    if (priority === 'high') {
      img.loading = 'eager';
      img.fetchPriority = 'high';
    } else if (priority === 'low') {
      img.loading = 'lazy';
      img.fetchPriority = 'low';
    } else {
      img.loading = 'lazy';
      img.fetchPriority = 'auto';
    }

    // Use Intersection Observer for lazy loading
    if (priority !== 'high' && 'IntersectionObserver' in window) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              // Load the image
              const target = entry.target as HTMLImageElement;
              if (target.dataset.src) {
                target.src = target.dataset.src;
                if (target.dataset.srcset) {
                  target.srcset = target.dataset.srcset;
                }
              }
              observerRef.current?.unobserve(target);
            }
          });
        },
        {
          rootMargin: '50px'
        }
      );

      observerRef.current.observe(img);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [priority]);

  const handleLoad = () => {
    setIsLoaded(true);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    devLog.error(`Failed to load image: ${src}`);
    onError?.();
  };

  // Generate WebP source if supported
  const webpSrc = src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  const shouldUseWebP = 'image' in document.createElement('picture');

  return (
    <div className={`relative ${className}`}>
      {/* Placeholder */}
      {placeholder && !isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-gray-800 animate-pulse"
          style={{
            backgroundImage: placeholder ? `url(${placeholder})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            filter: 'blur(10px)',
            transform: 'scale(1.1)'
          }}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
          <span className="text-gray-500 text-sm">Failed to load image</span>
        </div>
      )}

      {/* Image */}
      <picture>
        {shouldUseWebP && (
          <source 
            type="image/webp" 
            srcSet={srcSet?.replace(/\.(jpg|jpeg|png)/gi, '.webp') || webpSrc}
            sizes={sizes}
          />
        )}
        {srcSet && (
          <source 
            srcSet={srcSet}
            sizes={sizes}
          />
        )}
        <img
          ref={imgRef}
          src={priority === 'high' ? src : undefined}
          data-src={priority !== 'high' ? src : undefined}
          data-srcset={priority !== 'high' ? srcSet : undefined}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          className={`
            transition-opacity duration-300
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${className}
          `}
          {...props}
        />
      </picture>
    </div>
  );
};