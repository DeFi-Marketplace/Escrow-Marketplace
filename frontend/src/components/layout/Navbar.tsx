'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWallet } from '@/context/WalletContext';
import { truncateAddress } from '@/lib/utils';

const navItems = [
  { href: '/swap', label: 'Swap', icon: '↔' },
  { href: '/pools', label: 'Pools', icon: '■' },
  { href: '/lend', label: 'Lend', icon: '◆' },
  { href: '/stake', label: 'Stake', icon: '▲' },
  { href: '/nfts', label: 'NFTs', icon: '◆' },
  { href: '/launchpad', label: 'Launchpad', icon: '●' },
  { href: '/portfolio', label: 'Portfolio', icon: '○' },
];

export function Navbar() {
  const pathname = usePathname();
  const { address, isConnected, connect, disconnect, isConnecting } = useWallet();

  return (
    <nav className="sticky top-0 z-50 border-b border-defi-border bg-defi-dark/95 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2">
              <span className="text-2xl font-bold gradient-text">DeFi</span>
              <span className="text-xl font-semibold text-foreground/80">Market</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = pathname?.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-defi-blue/20 text-defi-blue'
                        : 'text-muted-foreground hover:text-foreground hover:bg-defi-card'
                    }`}
                  >
                    <span>{item.icon}</span>
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isConnected && address ? (
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-defi-green animate-pulse" />
                <span className="text-sm text-muted-foreground font-mono">
                  {truncateAddress(address)}
                </span>
                <button onClick={disconnect} className="btn-secondary text-sm py-2 px-3">
                  Disconnect
                </button>
              </div>
            ) : (
              <button
                onClick={connect}
                disabled={isConnecting}
                className="btn-primary text-sm py-2 px-4"
              >
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
