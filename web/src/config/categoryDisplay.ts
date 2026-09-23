import type { Category } from '../types';

export interface CategoryDisplayItem {
  slug: string;
  name: string;
  icon: string;
  image?: string | null;
}

/** Emoji fallback when admin has not uploaded a category image. */
const SLUG_ICONS: Record<string, string> = {
  milk: '🥛',
  curd: '🫙',
  ghee: '🫒',
  paneer: '🧀',
  butter: '🧈',
  eggs: '🥚',
  other: '🛒',
};

/** Preferred category order for shop browsing (milk first). */
const CATEGORY_ORDER = ['milk', 'curd', 'ghee', 'paneer', 'butter', 'eggs', 'groceries', 'meat', 'other'];

export function toCategoryDisplayItems(apiCategories: Category[]): CategoryDisplayItem[] {
  const items = apiCategories.map((c) => {
    const slug = c.slug || c.name.toLowerCase().replace(/\s+/g, '-');
    return {
      slug,
      name: c.name,
      icon: SLUG_ICONS[slug] ?? '📦',
      image: c.image ?? null,
    };
  });

  return items.sort((a, b) => {
    const aIndex = CATEGORY_ORDER.indexOf(a.slug);
    const bIndex = CATEGORY_ORDER.indexOf(b.slug);
    const aRank = aIndex === -1 ? CATEGORY_ORDER.length : aIndex;
    const bRank = bIndex === -1 ? CATEGORY_ORDER.length : bIndex;
    if (aRank !== bRank) return aRank - bRank;
    return a.name.localeCompare(b.name);
  });
}

/** Filter products by admin category slug stored on the product. */
export function filterProductsByCategory<T extends { category: string }>(
  products: T[],
  slug: string
): T[] {
  if (!slug) return products;
  return products.filter((p) => p.category === slug);
}
