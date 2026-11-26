import { Playfair_Display, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from './lib/auth-context';

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-jakarta',
  weight: ['400', '500', '600', '700'],
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  weight: ['400', '500', '600'],
  style: ['normal', 'italic'],
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  weight: ['400', '500', '600'],
  display: 'swap',
});

export const metadata = {
  title: 'BrowseAI – Control Your Browser with AI',
  description: 'Describe any task in natural language. The AI plans, navigates Chrome, verifies every action, and completes complex workflows automatically.',
  keywords: 'AI browser automation, web automation, AI agent, browser control, workflow automation',
  openGraph: {
    title: 'BrowseAI – Control Your Browser with AI',
    description: 'Automate any browser task with AI. Simply describe what you want done.',
    type: 'website',
  },
};

export const viewport = {
  themeColor: '#f9f8f6',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${jakarta.variable} ${playfair.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        {/* Autofill extensions stamp `fdprocessedid` on form controls before React
            hydrates, which trips a hydration mismatch. The fix lives in a static
            file: an inline <script> inside a component makes React 19 warn that
            scripts never run on the client. */}
        <Script src="/strip-fdprocessedid.js" strategy="beforeInteractive" />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
