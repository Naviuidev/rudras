import { useEffect, useState } from 'react';
import { Carousel } from 'react-bootstrap';
import { getBanners } from '../services/api';
import type { Banner } from '../types';
import LoadingSpinner from './LoadingSpinner';

export default function BannerSlider() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getBanners()
      .then(setBanners)
      .catch(() => setBanners([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner message="Loading banners..." />;

  if (banners.length === 0) {
    return (
      <div className="hero-section text-center mb-4">
        <h2 className="fw-bold" style={{ color: 'var(--accent)' }}>
          Fresh Farm Milk Delivered Daily
        </h2>
        <p className="mb-0">Pure, natural dairy products straight from Rudra&apos;s Farm to your doorstep.</p>
      </div>
    );
  }

  return (
    <Carousel className="mb-4 rounded overflow-hidden shadow-sm" indicators={banners.length > 1}>
      {banners.map((banner) => (
        <Carousel.Item key={banner.id}>
          {banner.link ? (
            <a href={banner.link} target="_blank" rel="noopener noreferrer">
              <img
                className="d-block w-100"
                src={banner.image}
                alt={banner.title}
                style={{ maxHeight: 320, objectFit: 'cover' }}
              />
            </a>
          ) : (
            <img
              className="d-block w-100"
              src={banner.image}
              alt={banner.title}
              style={{ maxHeight: 320, objectFit: 'cover' }}
            />
          )}
          {banner.title && (
            <Carousel.Caption className="bg-dark bg-opacity-50 rounded">
              <p className="mb-0">{banner.title}</p>
            </Carousel.Caption>
          )}
        </Carousel.Item>
      ))}
    </Carousel>
  );
}
