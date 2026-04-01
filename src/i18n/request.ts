import { getRequestConfig } from 'next-intl/server';

const locales = ['en', 'vi'];

export default getRequestConfig(async ({ requestLocale }) => {
  // Await the locale promise (Next.js 15+ requirement)
  const locale = await requestLocale;
  const finalLocale = locale && locales.includes(locale as any) ? locale : 'vi';

  return {
    locale: finalLocale,
    messages: (await import(`../../messages/${finalLocale}.json`)).default
  };
});
