import type { Metadata } from 'next';
import './globals.css';
import ThemeInit from '@/components/ThemeInit';

export const metadata: Metadata = {
  title: 'Info Quest - AI-Powered Information Retrieval',
  description: 'Get comprehensive, accurate information on any topic with AI-powered search',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
