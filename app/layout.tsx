import './globals.css';
import type { Metadata } from 'next';
import { AuthProvider } from '@/lib/auth-context';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthTimeoutProvider } from '@/components/providers/auth-timeout-provider';
import { IncognitoProvider } from '@/components/providers/incognito-provider';

export const metadata: Metadata = {
  metadataBase: new URL('http://localhost:3000'),
  title: 'Smart Save Cooperative',
  description: 'Secure financial growth through collaborative saving',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    images: [
      {
        url: 'https://bolt.new/static/og_default.png',
      },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans">
        <ThemeProvider>
          <AuthProvider>
            <IncognitoProvider>
              <AuthTimeoutProvider>{children}</AuthTimeoutProvider>
            </IncognitoProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
