export type ShopType = 'subscription' | 'one_time';

export function filterProductsByShop<T extends { monthly_subscription?: number }>(
  items: T[],
  shopType: ShopType
): T[] {
  return items.filter((p) =>
    shopType === 'subscription' ? p.monthly_subscription === 1 : p.monthly_subscription !== 1
  );
}
