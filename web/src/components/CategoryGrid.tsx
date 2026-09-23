import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { categoryBrowsePath } from '../utils/authRedirect';
import type { CategoryDisplayItem } from '../config/categoryDisplay';

interface CategoryGridProps {
  categories: CategoryDisplayItem[];
  title?: string;
}

export default function CategoryGrid({ categories, title = 'Categories' }: CategoryGridProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (categories.length === 0) return null;

  return (
    <section className="category-grid-section mb-4">
      <h2 className="category-grid-heading">{title}</h2>
      <div className="category-grid">
        {categories.map((cat) => (
          <button
            key={cat.slug}
            type="button"
            className="category-grid-item"
            onClick={() => navigate(categoryBrowsePath(cat.slug, isAuthenticated))}
            aria-label={`Browse ${cat.name}`}
          >
            <span className="category-grid-tile">
              {cat.image ? (
                <img src={cat.image} alt="" className="category-grid-img" />
              ) : (
                <span className="category-grid-icon" aria-hidden>
                  {cat.icon}
                </span>
              )}
            </span>
            <span className="category-grid-label">{cat.name}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
