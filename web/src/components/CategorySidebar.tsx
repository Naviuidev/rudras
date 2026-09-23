import type { CategoryDisplayItem } from '../config/categoryDisplay';

interface CategorySidebarProps {
  categories: CategoryDisplayItem[];
  selectedSlug: string;
  onSelect: (slug: string) => void;
}

export default function CategorySidebar({ categories, selectedSlug, onSelect }: CategorySidebarProps) {
  if (categories.length === 0) return null;

  return (
    <aside className="category-sidebar" aria-label="Product categories">
      <nav className="category-sidebar-nav">
        {categories.map((cat) => {
          const isActive = selectedSlug === cat.slug;
          return (
            <button
              key={cat.slug}
              type="button"
              className={`category-sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => onSelect(cat.slug)}
              aria-current={isActive ? 'true' : undefined}
            >
              <span className="category-sidebar-thumb">
                {cat.image ? (
                  <img src={cat.image} alt="" />
                ) : (
                  <span className="category-sidebar-icon" aria-hidden>
                    {cat.icon}
                  </span>
                )}
              </span>
              <span className="category-sidebar-label">{cat.name}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
