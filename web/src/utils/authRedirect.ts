/** After login, return user to intended page or dashboard. */
export function getPostLoginPath(from?: string | null): string {
  if (!from || from === '/login' || from === '/verify-otp' || from === '/set-password') {
    return '/dashboard';
  }
  return from;
}

export function shopBrowseBase(inAccountShell = false): string {
  return inAccountShell ? '/shop' : '/products';
}

export function productBrowsePath(productId: number, inAccountShell = false): string {
  return `${shopBrowseBase(inAccountShell)}?product=${productId}`;
}

export function categoryBrowsePath(category: string, inAccountShell = false): string {
  return `${shopBrowseBase(inAccountShell)}?category=${encodeURIComponent(category)}`;
}
