'use client';

import React from 'react';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';

const features = [
  {
    title: 'Token Swap',
    description: 'Swap tokens instantly with low fees using our AMM DEX',
    href: '/swap',
    icon: '↔',
    color: 'from-defi-blue to-defi-cyan',
  },
  {
    title: 'Liquidity Pools',
    description: 'Provide liquidity and earn fees from swaps',
    href: '/pools',
    icon: '■',
    color: 'from-defi-purple to-defi-pink',
  },
  {
    title: 'Lending & Borrowing',
    description: 'Lend assets to earn interest or borrow against collateral',
    href: '/lend',
    icon: '◆',
    color: 'from-defi-green to-emerald-500',
  },
  {
    title: 'Staking & Yield',
    description: 'Stake LP tokens and earn yield rewards',
    href: '/stake',
    icon: '▲',
    color: 'from-defi-yellow to-orange-500',
  },
  {
    title: 'NFT Marketplace',
    description: 'Mint, buy, sell, and auction NFTs',
    href: '/nfts',
    icon: '◆',
    color: 'from-defi-cyan to-defi-blue',
  },
  {
    title: 'Token Launchpad',
    description: 'Create and launch new tokens on Stellar',
    href: '/launchpad',
    icon: '●',
    color: 'from-defi-purple to-defi-blue',
  },
];

export default function HomePage() {
  const { isConnected, connect, isConnecting } = useWallet();

  return (
    <div className="space-y-12">
      <section className="text-center py-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-6">
          <span className="gradient-text">DeFi Market</span>
          <br />
          <span className="text-3xl md:text-4xl text-muted-foreground font-normal">
            on Stellar Network
          </span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          A fully decentralized finance platform with swapping, lending, staking,
          NFT marketplace, and token launchpad — all powered by Stellar Soroban smart contracts.
        </p>
        {!isConnected ? (
          <button onClick={connect} disabled={isConnecting} className="btn-primary text-lg px-10 py-4">
            {isConnecting ? 'Connecting...' : 'Connect Wallet to Start'}
          </button>
        ) : (
          <div className="flex items-center justify-center gap-3">
            <div className="w-3 h-3 rounded-full bg-defi-green animate-pulse" />
            <span className="text-lg text-muted-foreground">Wallet connected — explore the features below</span>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-6">Platform Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link key={feature.href} href={feature.href}>
              <div className="glass-card p-6 hover:border-defi-blue/50 hover:shadow-lg hover:shadow-defi-blue/5 transition-all duration-200 cursor-pointer group">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-xl mb-4 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="glass-card p-8 text-center">
        <h2 className="text-2xl font-semibold mb-4">Smart Contracts</h2>
        <p className="text-muted-foreground mb-6">
          All protocols are powered by Rust-based Soroban smart contracts on Stellar
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {['Token', 'AMM DEX', 'Lending', 'Staking', 'NFT', 'Marketplace', 'Launchpad'].map((contract) => (
            <span key={contract} className="px-4 py-2 bg-defi-card border border-defi-border rounded-lg text-sm font-mono text-muted-foreground">
              {contract}
            </span>
          ))}
        </div>
      </section>
    </div>
  );
}
