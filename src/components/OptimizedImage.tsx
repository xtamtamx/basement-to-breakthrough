import React, { useState, useEffect, useRef, useCallback } from "react";

interface OptimizedImageProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  loading?: "lazy" | "eager";
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

const OptimizedImageComponent: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  className = "",
  width,
  height,
  loading = "lazy",
  placeholder = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Crect width="400" height="300" fill="%23111111"/%3E%3C/svg%3E',
  onLoad,
  onError,
}) => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  const loadImage = useCallback(() => {
    const img = new Image();

    img.onload = () => {
      setImageSrc(src);
      setImageLoaded(true);
      onLoad?.();
    };

    img.onerror = () => {
      setError(true);
      onError?.();
    };

    img.src = src;
  }, [src, onLoad, onError]);

  useEffect(() => {
    // Use Intersection Observer for truly lazy loading
    if (loading === "lazy" && "IntersectionObserver" in window) {
      const currentImg = imgRef.current;
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              loadImage();
              observer.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "50px" },
      );

      if (currentImg) {
        observer.observe(currentImg);
      }

      return () => {
        if (currentImg) {
          observer.unobserve(currentImg);
        }
      };
    } else {
      loadImage();
    }
  }, [src, loading, loadImage]);

  if (error) {
    return (
      <div
        className={`bg-bg-tertiary flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-text-muted text-xs">Failed to load</span>
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      width={width}
      height={height}
      className={`transition-opacity duration-300 ${
        imageLoaded ? "opacity-100" : "opacity-0"
      } ${className}`}
      loading={loading}
    />
  );
};

export const OptimizedImage = React.memo(OptimizedImageComponent);