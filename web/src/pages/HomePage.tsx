import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Container, Row, Col, Card } from 'react-bootstrap';
import BannerSlider from '../components/BannerSlider';
import CategoryGrid from '../components/CategoryGrid';
import PackagingSupportSection from '../components/PackagingSupportSection';
import ProductGridCard from '../components/ProductGridCard';
import LoadingSpinner from '../components/LoadingSpinner';
import { getProducts, getCategories } from '../services/api';
import { toCategoryDisplayItems } from '../config/categoryDisplay';
import type { CategoryDisplayItem } from '../config/categoryDisplay';
import type { Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { shopBrowseBase } from '../utils/authRedirect';

const testimonials = [
  { name: 'Priya S.', text: 'The milk tastes so fresh! My family loves the daily delivery.', rating: 5 },
  { name: 'Rahul M.', text: 'Reliable service and great quality curd. Highly recommended.', rating: 5 },
  { name: 'Anita K.', text: 'Easy subscription management and skip options make it perfect for us.', rating: 5 },
];

const features = [
  { icon: '🥛', title: 'Farm Fresh', desc: 'Direct from our farm, no middlemen' },
  { icon: '🚚', title: 'Daily Delivery', desc: 'Before 7 AM at your doorstep' },
  { icon: '✅', title: 'Quality Assured', desc: 'Tested and certified dairy products' },
  { icon: '📱', title: 'Easy Management', desc: 'Pause, skip, or modify anytime' },
];

export default function HomePage() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const shopPath = shopBrowseBase(isAuthenticated);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryDisplayItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getProducts(), getCategories()])
      .then(([productList, apiCategories]) => {
        setProducts(productList);
        setCategories(toCategoryDisplayItems(apiCategories));
      })
      .catch(() => {
        setProducts([]);
        setCategories([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (location.hash !== '#support-form') return;

    const scrollToForm = () => {
      document.getElementById('support-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    };

    scrollToForm();
    const timer = window.setTimeout(scrollToForm, 150);

    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  const subscriptionProducts = products.filter((p) => p.monthly_subscription === 1);
  const featuredProducts = products.filter((p) => p.monthly_subscription !== 1).slice(0, 8);

  return (
    <div className="page-container">
      <Container>
        <BannerSlider />

        <CategoryGrid categories={categories} title="Categories" />

        <section className="category-grid-section mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="category-grid-heading mb-0">Active Subscriptions</h2>
            <Link to={shopPath} className="btn btn-sm btn-accent">
              Subscribe Now
            </Link>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : subscriptionProducts.length > 0 ? (
            <div className="product-grid">
              {subscriptionProducts.slice(0, 8).map((p) => (
                <ProductGridCard key={p.id} product={p} />
              ))}
            </div>
          ) : (
            <Card className="card-brand p-4 text-center">
              <p className="mb-3">Start your daily fresh milk subscription today!</p>
              <Link to="/subscriptions/create" className="btn btn-accent">
                Create Subscription
              </Link>
            </Card>
          )}
        </section>

        <section className="category-grid-section mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h2 className="category-grid-heading mb-0">Featured Products</h2>
            <Link to={shopPath} className="btn btn-sm btn-outline-success">
              View All
            </Link>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <div className="product-grid">
              {(featuredProducts.length > 0 ? featuredProducts : products.slice(0, 8)).map((p) => (
                <ProductGridCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

        <section className="mb-5">
          <h4 className="section-title text-center">Why Choose Us</h4>
          <Row xs={2} md={4} className="g-3">
            {features.map((f) => (
              <Col key={f.title}>
                <div className="text-center p-3">
                  <div className="feature-icon mx-auto">{f.icon}</div>
                  <h6 className="fw-semibold">{f.title}</h6>
                  <p className="text-muted small mb-0">{f.desc}</p>
                </div>
              </Col>
            ))}
          </Row>
        </section>

        <section className="mb-5">
          <h4 className="section-title text-center">What Our Customers Say</h4>
          <Row xs={1} md={3} className="g-3">
            {testimonials.map((t) => (
              <Col key={t.name}>
                <div className="testimonial-card">
                  <div className="mb-2">{'⭐'.repeat(t.rating)}</div>
                  <p className="small mb-2">&ldquo;{t.text}&rdquo;</p>
                  <strong className="small" style={{ color: 'var(--accent)' }}>
                    — {t.name}
                  </strong>
                </div>
              </Col>
            ))}
          </Row>
        </section>

        <section className="hero-section text-center">
          <h5 className="fw-semibold mb-2" style={{ color: 'var(--accent)' }}>
            Need Help?
          </h5>
          <p className="mb-3 small">Our support team is here for you</p>
          <Link to="/support" className="btn btn-accent">
            Contact Support
          </Link>
        </section>

        <PackagingSupportSection />
      </Container>
    </div>
  );
}
