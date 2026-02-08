'use client';

import { useState } from 'react';

interface PexelsImage {
  id: number;
  url: string;
  src: { original: string; large: string; medium: string; small: string };
  alt: string;
  photographer: string;
  photographer_url: string;
}

interface ImageGalleryProps {
  images: PexelsImage[];
  query: string;
}

export default function ImageGallery({ images, query }: ImageGalleryProps) {
  const [loaded, setLoaded] = useState<Record<number, boolean>>({});

  if (!images.length) return null;

  return (
    <section className="section image-gallery">
      <h2 className="section-title">Images</h2>
      <div className="gallery-grid">
        {images.map((img) => (
          <a
            key={img.id}
            href={img.url}
            target="_blank"
            rel="noopener noreferrer"
            className="gallery-item"
          >
            <div className="gallery-image-wrapper">
              {/* Use img for external Pexels URLs - Next/Image needs config */}
              <img
                src={img.src.medium}
                alt={img.alt || query}
                loading="lazy"
                className="gallery-image"
                onLoad={() => setLoaded((p) => ({ ...p, [img.id]: true }))}
              />
              {!loaded[img.id] && <div className="gallery-skeleton" />}
            </div>
            <span className="gallery-attribution">
              Photo by{' '}
              <a href={img.photographer_url} target="_blank" rel="noopener noreferrer">
                {img.photographer}
              </a>{' '}
              on Pexels
            </span>
          </a>
        ))}
      </div>
      <p className="pexels-attribution">Images provided by Pexels (free stock photos)</p>
    </section>
  );
}
