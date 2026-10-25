import { getSettings } from '@/lib/server/settings';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { MobileMenu } from '@/components/layout/MobileMenu';
import { SearchOverlay } from '@/components/layout/SearchOverlay';
import { Toaster } from '@/components/layout/Toaster';
import { WelcomeOffer } from '@/components/account/WelcomeOffer';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { QuickView } from '@/components/product/QuickView';
import { SettingsProvider } from '@/components/providers/SettingsProvider';
import { SyncManager } from '@/components/providers/SyncManager';
import { CurrencyProvider } from '@/components/providers/CurrencyProvider';
import { getCurrency } from '@/lib/server/currency';
import { getMainNav } from '@/lib/server/catalog';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, currency, nav] = await Promise.all([getSettings(), getCurrency(), getMainNav()]);
  return (
    <SettingsProvider value={settings}>
      <CurrencyProvider currency={currency}>
        <Header nav={nav} />
        <main id="main">{children}</main>
        <Footer />
        <MobileMenu nav={nav} />
        <SearchOverlay popular={settings.popularSearches} />
        <CartDrawer />
        <QuickView />
        <Toaster />
        <WelcomeOffer />
        <SyncManager />
      </CurrencyProvider>
    </SettingsProvider>
  );
}
