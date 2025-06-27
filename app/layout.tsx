import React from 'react';
import '../globals.css';
import { Inter } from 'next/font/google';
import TopNav from '../components/organisms/TopNav';
import { Metadata } from 'next';
import { AuthProvider } from '../lib/auth-context';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ASMR Video Generator',
  description: 'Generate beautiful ASMR videos with AI',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full`}>
        <AuthProvider>
          <div className="min-h-full flex flex-col">
            <TopNav />
            <main className="flex-1 flex flex-col">
              {children}
            </main>
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
