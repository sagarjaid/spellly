// import '../styles/globals.css';
import './globals.css';
import { Analytics } from '@vercel/analytics/next';

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Spellly - Spelling Game',
  description: 'Learn to spell English words with audio',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en'>
      <body className={inter.className}>{children}</body>
      <Analytics />
    </html>
  );
}
