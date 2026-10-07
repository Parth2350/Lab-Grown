import {
  ChartColumn,
  Boxes,
  CreditCard,
  FolderTree,
  Gem,
  Handshake,
  Inbox,
  Layers,
  LayoutDashboard,
  Package,
  Settings,
  ShoppingBag,
  Sparkles,
  Star,
  TicketPercent,
  Truck,
  Users,
  type LucideIcon,
} from 'lucide-react';

export type NavCountKey = 'orders' | 'reviews' | 'bespoke' | 'partners' | 'messages' | 'inventory';
export type NavCounts = Partial<Record<NavCountKey, number>>;

export type NavItem = { href: string; label: string; icon: LucideIcon; count?: NavCountKey; exact?: boolean };
export type NavGroup = { label: string; items: NavItem[] };

export const ADMIN_NAV: NavGroup[] = [
  {
    label: 'Overview',
    items: [
      { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
      { href: '/admin/analytics', label: 'Analytics', icon: ChartColumn },
    ],
  },
  {
    label: 'Catalog',
    items: [
      { href: '/admin/products', label: 'Products', icon: Package },
      { href: '/admin/categories', label: 'Categories', icon: FolderTree },
      { href: '/admin/collections', label: 'Collections', icon: Layers },
      { href: '/admin/diamonds', label: 'Diamonds', icon: Gem },
      { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
    ],
  },
  {
    label: 'Sales',
    items: [
      { href: '/admin/orders', label: 'Orders', icon: ShoppingBag, count: 'orders' },
      { href: '/admin/payments', label: 'Payments', icon: CreditCard },
      { href: '/admin/shipping', label: 'Shipping', icon: Truck },
      { href: '/admin/coupons', label: 'Coupons', icon: TicketPercent },
    ],
  },
  {
    label: 'Customers',
    items: [
      { href: '/admin/customers', label: 'Customers', icon: Users },
      { href: '/admin/reviews', label: 'Reviews', icon: Star, count: 'reviews' },
      { href: '/admin/bespoke', label: 'Bespoke Requests', icon: Sparkles, count: 'bespoke' },
      { href: '/admin/partners', label: 'Partner Applications', icon: Handshake, count: 'partners' },
      { href: '/admin/messages', label: 'Messages', icon: Inbox, count: 'messages' },
    ],
  },
  {
    label: 'Store',
    items: [{ href: '/admin/settings', label: 'Settings', icon: Settings }],
  },
];

export const COUNT_HINTS: Record<NavCountKey, string> = {
  orders: 'open orders (awaiting payment or fulfilment)',
  reviews: 'reviews awaiting moderation',
  bespoke: 'new bespoke requests',
  partners: 'partner applications to review',
  messages: 'unread messages',
  inventory: 'low-stock variants',
};

export function isActive(pathname: string, item: NavItem) {
  return item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
}

export function currentSection(pathname: string) {
  for (const g of ADMIN_NAV) for (const item of g.items) if (isActive(pathname, item)) return { group: g.label, item };
  return null;
}
