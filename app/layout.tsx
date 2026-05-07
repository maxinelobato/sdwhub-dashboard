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
    default: 'SDW.hub 2026 | Dashboard Real Time',
    template: '%s | SDW.hub 2026',
  },
  description:
    'Painel em tempo real dos leads do Typebot do SDW.hub 2026: total do dia, comparativo, meta e CPL.',
  robots: { index: false, follow: false },
  keywords: [
    'SDW.hub',
    'Santos Digital Week',
    'evento de negócios',
    'inovação',
    'tecnologia',
    'Baixada Santista',
    'networking empresarial',
    'SDW Club',
    'empreendedorismo',
    'dashboard real time',
  ],
  authors: [{ name: 'SDW Labs' }],
  creator: 'SDW Labs',
  publisher: 'SDW.hub',
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/images/sdw-logo-purple.png', type: 'image/png' },
    ],
    apple: '/images/sdw-logo-purple.png',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: siteUrl,
    siteName: 'SDW.hub 2026',
    title: 'SDW.hub 2026 | Dashboard Real Time — Santos Digital Week',
    description:
      'O maior evento de negócios, inovação e tecnologia da Baixada Santista.',
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
    title: 'SDW.hub 2026 | Dashboard Real Time',
    description:
      'O maior evento de negócios, inovação e tecnologia da Baixada Santista.',
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
    <html lang="pt-BR" className={poppins.variable}>
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
