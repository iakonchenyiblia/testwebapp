import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { Header } from '@/components/layout/Header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Bookify - Professional Services Booking Platform',
  description: 'Find and book professional services online. Easy scheduling, secure payments.',
  keywords: ['booking', 'services', 'appointment', 'online booking'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <footer className="border-t py-8 mt-auto">
              <div className="container mx-auto px-4 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Bookify. All rights reserved.
              </div>
            </footer>
          </div>
        </Providers>
      </body>
    </html>
  );
}
