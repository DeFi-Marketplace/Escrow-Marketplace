import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'DeFi Market - Stellar DeFi Platform',
  description: 'Decentralized Finance Platform on Stellar Network - Swap, Lend, Borrow, Stake, and Trade NFTs',
  keywords: ['defi', 'stellar', 'crypto', 'nft', 'marketplace', 'lending', 'staking'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
