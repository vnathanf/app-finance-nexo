import type {Metadata, Viewport} from 'next';
import { Inter, JetBrains_Mono, Geist } from 'next/font/google';
import './globals.css'; // Global styles
import PWARegister from '@/components/common/PWARegister';
import { cn } from "@/lib/utils";
import { AppProviders } from '@/components/providers/AppProviders';

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  title: 'Nexo Finance - Gestão de Patrimônio & Finanças Conectadas',
  description: 'Gestão de patrimônio, projetos financeiros e transações de forma intuitiva, moderna e conectada.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Nexo Finance',
  },
  icons: {
    icon: [
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-96x96.png', sizes: '96x96', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#006b47',
    'msapplication-TileImage': '/icons/icon-144x144.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#006b47',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={cn(jetbrainsMono.variable, "font-sans", geist.variable)}>
      <head>
        {/* iOS splash screen (opcional — adicione imagens reais em /public/splash/) */}
        <link
          rel="apple-touch-startup-image"
          media="(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)"
          href="/icons/icon-512x512.png"
        />
      </head>
      <body suppressHydrationWarning className="bg-[#faf8ff] text-[#151b29] font-sans antialiased">
        <PWARegister />
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
