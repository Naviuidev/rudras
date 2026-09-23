import { useCallback, useEffect, useState } from 'react';

type PackagingSlide = {
  id: string;
  title: string;
  summary: string;
  paragraphs: string[];
  icon: 'avoid' | 'steel' | 'earthen';
};

const SLIDES: PackagingSlide[] = [
  {
    id: 'glass-plastic',
    title: "Why don't we use glass or plastic packaging?",
    summary: 'Safer handling and less contamination compared to glass and single-use plastic.',
    paragraphs: [
      'Glass bottles cannot be sterilized with hot water and are prone to breakage which may cause harm to the person handling it.',
      'We are against the usage of single use plastic which is becoming a serious hazard to the mother earth. Plastic bottles are also the main sources of contamination and spoilage because of the less possibility of proper cleaning.',
    ],
    icon: 'avoid',
  },
  {
    id: 'steel-bottles',
    title: 'Why do we use steel bottles for milk packaging?',
    summary: 'Steel bottles can be sterilized to keep milk fresh and safe.',
    paragraphs: [
      'Steel bottles can be sterilized therefore eliminating the chances of contamination and spoilage.',
    ],
    icon: 'steel',
  },
  {
    id: 'earthen-pots',
    title: 'Why do we use earthen pots for packaging other milk products?',
    summary: 'Eco-friendly, biodegradable pots that support a greener planet.',
    paragraphs: [
      'Biodegradable: With the growing concern for the environment, we feel that it is our duty and responsibility to reduce the use of single use plastic which is the major source of pollution. So, we have taken an initiative to go green and the main reason being, that the earthen pots are eco-friendly and biodegradable.',
      'They can be easily decomposed into the soil whenever and however it is disposed off and they can also be easily recycled. The recyclability rate of clay is 95%.',
    ],
    icon: 'earthen',
  },
];

function SlideIcon({ type }: { type: PackagingSlide['icon'] }) {
  if (type === 'steel') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <rect x="8" y="3" width="8" height="3" rx="1" fill="currentColor" opacity="0.85" />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          d="M9 6h6v13a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z"
        />
        <path fill="none" stroke="currentColor" strokeWidth="1.5" d="M10 10h4M10 14h4" />
      </svg>
    );
  }

  if (type === 'earthen') {
    return (
      <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          d="M7 10c0-3 2-5 5-5s5 2 5 5v1H7v-1z"
        />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          d="M6 11h12l-1.5 9H7.5L6 11z"
        />
        <path fill="currentColor" d="M4 18c1.5-1 3-1.5 4.5-1.5h7c1.5 0 3 .5 4.5 1.5" opacity="0.5" />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden>
      <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.75" />
      <path fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" d="M8 8l8 8M16 8l-8 8" />
    </svg>
  );
}

function iconTheme(type: PackagingSlide['icon']) {
  if (type === 'steel') return { bg: '#eef4ff', color: '#2d5016' };
  if (type === 'earthen') return { bg: '#f3ebe3', color: '#8b5e3c' };
  return { bg: '#fef2f2', color: '#b45309' };
}

function PackagingInfoPopup({
  slide,
  onClose,
}: {
  slide: PackagingSlide | null;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!slide) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [slide, onClose]);

  if (!slide) return null;

  const theme = iconTheme(slide.icon);

  return (
    <div className="auth-popup-backdrop" onClick={onClose} role="presentation">
      <div
        className="auth-popup packaging-info-popup"
        role="dialog"
        aria-modal="true"
        aria-labelledby="packaging-popup-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="packaging-info-popup-head">
          <div
            className="packaging-info-popup-icon"
            style={{ background: theme.bg, color: theme.color }}
            aria-hidden
          >
            <SlideIcon type={slide.icon} />
          </div>
          <button type="button" className="packaging-info-popup-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <h3 id="packaging-popup-title" className="auth-popup-title packaging-info-popup-title">
          {slide.title}
        </h3>

        <div className="packaging-info-popup-body">
          {slide.paragraphs.map((paragraph) => (
            <p key={paragraph.slice(0, 24)} className="auth-popup-message packaging-info-popup-text">
              {paragraph}
            </p>
          ))}
        </div>

        <button
          type="button"
          className="btn btn-outline-success rounded-pill packaging-info-popup-btn"
          onClick={onClose}
        >
          Got it
        </button>
      </div>
    </div>
  );
}

export default function PackagingSlider({ embedded = false }: { embedded?: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [popupSlide, setPopupSlide] = useState<PackagingSlide | null>(null);

  const goTo = useCallback((index: number) => {
    setActiveIndex((index + SLIDES.length) % SLIDES.length);
  }, []);

  const sliderContent = (
    <>
      <div className="packaging-slider">
        <div className={`packaging-slider-frame${embedded ? ' packaging-slider-frame--embedded' : ''}`}>
          <div className="packaging-slider-viewport">
            <div
              className="packaging-slider-track"
              style={{ transform: `translateX(-${activeIndex * 100}%)` }}
            >
              {SLIDES.map((slide, index) => {
                const theme = iconTheme(slide.icon);
                return (
                  <article
                    key={slide.id}
                    className={`packaging-slider-slide${index === activeIndex ? ' is-active' : ''}`}
                  >
                    <div className="packaging-slider-card">
                      <div className="packaging-slider-card-head">
                        <span
                          className="packaging-slider-card-icon"
                          style={{ background: theme.bg, color: theme.color }}
                          aria-hidden
                        >
                          <SlideIcon type={slide.icon} />
                        </span>
                        <div className="packaging-slider-card-body">
                          <h3 className="packaging-slider-card-title">{slide.title}</h3>
                          <p className="packaging-slider-card-summary">{slide.summary}</p>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success rounded-pill packaging-slider-read-more"
                            onClick={() => setPopupSlide(slide)}
                          >
                            Read more
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            <button
              type="button"
              className="packaging-slider-nav packaging-slider-nav-prev"
              onClick={() => goTo(activeIndex - 1)}
              aria-label="Previous slide"
            >
              ‹
            </button>
            <button
              type="button"
              className="packaging-slider-nav packaging-slider-nav-next"
              onClick={() => goTo(activeIndex + 1)}
              aria-label="Next slide"
            >
              ›
            </button>
          </div>
        </div>
      </div>

      <div className="packaging-slider-dots" role="tablist" aria-label="Packaging slides">
        {SLIDES.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            className={`packaging-slider-dot${index === activeIndex ? ' active' : ''}`}
            aria-selected={index === activeIndex}
            aria-label={`Slide ${index + 1}: ${slide.title}`}
            onClick={() => goTo(index)}
          />
        ))}
      </div>
    </>
  );

  return (
    <section
      className={embedded ? 'packaging-slider-section packaging-slider-section--embedded' : 'packaging-slider-section'}
      aria-label="Packaging information"
    >
      {embedded ? (
        <div className="packaging-slider-col-card">
          <h2 className="category-grid-heading packaging-slider-col-title">Our Packaging Promise</h2>
          {sliderContent}
        </div>
      ) : (
        <>
          <h2 className="category-grid-heading text-center mb-3">Our Packaging Promise</h2>
          {sliderContent}
        </>
      )}

      <PackagingInfoPopup slide={popupSlide} onClose={() => setPopupSlide(null)} />
    </section>
  );
}
