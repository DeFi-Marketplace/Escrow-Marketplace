'use client';

import React from 'react';
import { WalletProvider } from '@/context/WalletContext';
import { Navbar } from '@/components/layout/Navbar';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {children}
        </main>
      </div>
    </WalletProvider>
  );
}
