import type { Metadata, Viewport } from 'next';
import { Poppins } from 'next/font/google';
import Script from 'next/script';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  style: ['normal'],
  variable: '--font-poppins',
  display: 'swap',
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://sdwhub.com.br';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'bh-typebot | Dashboard Em tempo real.',
    template: '%s | bh-typebot',
  },
  description:
    'Painel em tempo real dos leads do bh-typebot: total do dia e comparativo.',
  robots: { index: false, follow: false },
  keywords: [
    'bh-typebot',
    'dashboard real time',
    'dashboard em tempo real',
    'dash tempo real',
  ],
  authors: [{ name: 'SDW Labs' }],
  creator: 'SDW Labs',
  publisher: 'bh-typebot',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-96x96.png', sizes: '96x96', type: 'image/png' },
      {
        url: '/android-chrome-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [{ rel: 'manifest', url: '/site.webmanifest' }],
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: 'bh-typebot',
    title: 'bh-typebot | Dashboard Em tempo real',
    description:
      'Painel em tempo real dos leads do bh-typebot: total do dia e comparativo.',
    images: [
      {
        url: '/images/sdw-logo-purple.png',
        width: 1280,
        height: 640,
        alt: 'SDW.hub 2026',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'bh-typebot | Dashboard Em tempo real',
    description:
      'Painel em tempo real dos leads do bh-typebot: total do dia e comparativo.',
    images: ['/images/sdw-logo-purple.png'],
  },
  alternates: {
    canonical: siteUrl,
  },
};

export const viewport: Viewport = {
  themeColor: '#492b92',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={poppins.variable} suppressHydrationWarning>
      <head>
        {GTM_ID ? (
          <Script id="gtm" strategy="afterInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
              new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
              j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
              'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
              })(window,document,'script','dataLayer','${GTM_ID}');`}
          </Script>
        ) : null}
      </head>
      <body suppressHydrationWarning>
        {GTM_ID ? (
          <noscript>
            <iframe
              src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
              height="0"
              width="0"
              style={{ display: 'none', visibility: 'hidden' }}
            />
          </noscript>
        ) : null}
        {children}
      </body>
    </html>
  );
}
