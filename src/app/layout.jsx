import { Space_Grotesk } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { AuthProvider } from './lib/auth-context';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  weight: ['300', '400', '500', '600', '700'],
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

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={spaceGrotesk.variable} suppressHydrationWarning>
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
