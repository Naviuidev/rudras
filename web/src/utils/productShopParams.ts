export type ShopType = 'subscription' | 'one_time';

export function parseShopType(value: string | null): ShopType {
  return value === 'subscription' ? 'subscription' : 'one_time';
}

export function shopTypeToParam(type: ShopType): string {
  return type === 'subscription' ? 'subscription' : 'one-time';
}

export function buildProductsParams(
  current: URLSearchParams,
  patch: {
    category?: string | null;
    search?: string | null;
    product?: string | null;
    shop?: ShopType;
  } = {}
): Record<string, string> {
  const params: Record<string, string> = {};

  const category =
    patch.category !== undefined ? patch.category : current.get('category');
  const search = patch.search !== undefined ? patch.search : current.get('search');
  const product = patch.product !== undefined ? patch.product : current.get('product');
  const shop =
    patch.shop !== undefined ? patch.shop : parseShopType(current.get('shop'));

  if (category) params.category = category;
  if (search) params.search = search;
  if (product) params.product = product;
  params.shop = shopTypeToParam(shop);

  return params;
}

export function filterProductsByShop<T extends { monthly_subscription?: number }>(
  items: T[],
  shopType: ShopType
): T[] {
  return items.filter((p) =>
    shopType === 'subscription' ? p.monthly_subscription === 1 : p.monthly_subscription !== 1
  );
}
