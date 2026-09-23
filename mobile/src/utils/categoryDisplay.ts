const SLUG_ICONS: Record<string, string> = {
  milk: '🥛',
  curd: '🫙',
  ghee: '🫒',
  paneer: '🧀',
  butter: '🧈',
  eggs: '🥚',
  other: '🛒',
};

export interface CategoryDisplayItem {
  slug: string;
  name: string;
  icon: string;
  image?: string | null;
}

export function toCategoryDisplayItems(apiCategories: any[]): CategoryDisplayItem[] {
  return apiCategories.map((c) => {
    const slug = c.slug || c.name.toLowerCase().replace(/\s+/g, '-');
    return {
      slug,
      name: c.name,
      icon: SLUG_ICONS[slug] ?? '📦',
      image: c.image ?? null,
    };
  });
}

export function filterProductsByCategory<T extends { category: string }>(products: T[], slug: string): T[] {
  if (!slug) return products;
  return products.filter((p) => p.category === slug);
}
