export function getDefaultTabPath(role?: string): string {
  if (role === 'worker') return '/tabs/production';
  if (role === 'admin' || role === 'seller') return '/tabs/dashboard';
  return '/tabs/stock';
}
