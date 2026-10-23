import { getSettings } from '@/lib/server/settings';
import { Header } from '@/components/layout/Header';
import { AnnouncementBar } from '@/components/layout/AnnouncementBar';
import { Footer } from '@/components/layout/Footer';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { SearchOverlay } from '@/components/layout/SearchOverlay';
import { Toaster } from '@/components/layout/Toaster';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { QuickView } from '@/components/product/QuickView';
import { SettingsProvider } from '@/components/providers/SettingsProvider';
import { SyncManager } from '@/components/providers/SyncManager';
import { CurrencyProvider } from '@/components/providers/CurrencyProvider';
import { getCurrency } from '@/lib/server/currency';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, currency] = await Promise.all([getSettings(), getCurrency()]);
  return (
    <SettingsProvider value={settings}>
      <CurrencyProvider currency={currency}>
        <Header />
        <AnnouncementBar messages={settings.announcements} />
        <main id="main">{children}</main>
        <Footer />
        <MobileMenu />
        <SearchOverlay popular={settings.popularSearches} />
        <CartDrawer />
        <QuickView />
        <Toaster />
        <SyncManager />
      </CurrencyProvider>
    </SettingsProvider>
  );
}
