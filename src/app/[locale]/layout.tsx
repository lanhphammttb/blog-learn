import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "../globals.css";
import Navbar from "@/components/Navbar";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import AchievementToast from "@/components/dashboard/AchievementToast";
import ScrollToTop from "@/components/ScrollToTop";
import GlobalNoteWidget from "@/components/GlobalNoteWidget";
import { ToastProvider } from "@/components/ui/Toast";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getTranslations } from 'next-intl/server';
import { Link } from '@/navigation';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';

const inter = Inter({
  variable: "--font-geist-sans", // Keep CSS variable name the same so Tailwind config doesn't break
  subsets: ["latin", "vietnamese"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin", "latin-ext"],
});

export const metadata: Metadata = {
  title: "Daily English Knowledge - Master English Every Day",
  description: "A personal platform for learning and storing English materials.",
};

export default async function RootLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  
  // Validate that the incoming `locale` is supported
  const locales = ['en', 'vi'];
  if (!locales.includes(locale)) {
    notFound();
  }

  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages({ locale });
  const t = await getTranslations({ locale, namespace: 'Footer' });
  const commonT = await getTranslations({ locale, namespace: 'Common' });

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >

      <body 
        className="min-h-full flex flex-col bg-background text-foreground transition-colors duration-300"
        suppressHydrationWarning
      >
        <div id="theme-provider-wrapper" suppressHydrationWarning>
          <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          <NextIntlClientProvider locale={locale} messages={messages}>
            <AuthProvider>
              <ToastProvider>
                <div className="flex flex-col flex-grow">
                  <Navbar />
                  <AchievementToast />
                  <GlobalNoteWidget />
                  <ScrollToTop />
                  <main className="flex-grow fixed-nav-padding">{children}</main>
                <footer className="border-t border-border py-12 mt-12 bg-muted/20">
                  <div className="mx-auto max-w-7xl px-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
                      <div className="space-y-4">
                        <Link href="/" className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black">E</div>
                          <h3 className="text-lg font-black text-foreground">
                            English<span className="text-blue-600">Hub</span>
                          </h3>
                        </Link>
                        <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
                          {t('description')}
                        </p>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">{t('navigate')}</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                          <li><Link href="/" className="hover:text-blue-500 transition-colors font-medium">{commonT('nav.home')}</Link></li>
                          <li><Link href="/roadmaps" className="hover:text-blue-500 transition-colors font-medium">Roadmaps</Link></li>
                          <li><Link href="/community" className="hover:text-blue-500 transition-colors font-medium">{commonT('nav.community')}</Link></li>
                          <li><Link href="/dashboard" className="hover:text-blue-500 transition-colors font-medium">{commonT('nav.my_learning')}</Link></li>
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground mb-4 uppercase tracking-wider">{t('features.title')}</h4>
                        <ul className="space-y-3 text-sm text-muted-foreground">
                          <li>{t('features.interactive')}</li>
                          <li>{t('features.roadmap')}</li>
                          <li>{t('features.tracking')}</li>
                          <li>{t('features.leaderboard')}</li>
                        </ul>
                      </div>
                    </div>
                    <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
                      <p>&copy; {new Date().getFullYear()} EnglishHub. {t('copyright')}</p>
                      <div className="flex gap-6">
                         {/* Social icons could go here */}
                      </div>
                    </div>
                  </div>
                </footer>
              </div>
            </ToastProvider>
            </AuthProvider>
          </NextIntlClientProvider>
        </ThemeProvider>
        </div>
      </body>
    </html>
  );
}

