'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { formatAmount } from '@/lib/utils';

const DEMO_NFTS = [
  { id: 1, name: 'Cosmic Horizon #42', creator: '0xABC...', price: '2500', currency: 'USDC', image: '🌌', listed: true },
  { id: 2, name: 'Stellar Dreams #7', creator: '0xDEF...', price: '1500', currency: 'USDC', image: '✨', listed: true },
  { id: 3, name: 'DeFi Genesis #1', creator: '0xGHI...', price: '5000', currency: 'XLM', image: '🔷', listed: true },
  { id: 4, name: 'Soroban Wave #13', creator: '0xJKL...', price: '800', currency: 'USDC', image: '🌊', listed: true },
  { id: 5, name: 'NFT not for sale', creator: '0xMNO...', price: '0', currency: '', image: '🎨', listed: false },
  { id: 6, name: 'Pixel Stellar #9', creator: '0xPQR...', price: '3200', currency: 'XLM', image: '🪐', listed: true },
];

export default function NFTsPage() {
  const [activeTab, setActiveTab] = useState<'browse' | 'mint' | 'owned'>('browse');

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">NFT Marketplace</h1>
        <div className="flex rounded-xl bg-defi-card p-1">
          {(['browse', 'mint', 'owned'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                activeTab === tab ? 'bg-defi-blue text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'browse' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {DEMO_NFTS.filter((n) => n.listed).map((nft) => (
            <Card key={nft.id} hover>
              <div className="aspect-square rounded-xl bg-gradient-to-br from-defi-dark via-defi-card to-defi-dark flex items-center justify-center text-6xl mb-4 border border-defi-border">
                {nft.image}
              </div>
              <CardHeader className="mb-2">
                <CardTitle className="text-base">{nft.name}</CardTitle>
                <CardDescription>Created by {nft.creator}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-bold text-lg">{formatAmount(nft.price)} {nft.currency}</p>
                  </div>
                  <Button size="sm">Buy Now</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'mint' && (
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Mint New NFT</CardTitle>
              <CardDescription>Create and mint your own NFT on Stellar</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">NFT Name</p>
                <input className="input-field" placeholder="My Awesome NFT" />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Description</p>
                <textarea className="input-field min-h-[100px]" placeholder="Describe your NFT..." />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Metadata URI</p>
                <input className="input-field" placeholder="ipfs://..." />
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Royalty %</p>
                <input className="input-field" placeholder="5" type="number" />
              </div>
              <Button className="w-full">Mint NFT</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'owned' && (
        <div className="text-center py-16">
          <p className="text-4xl mb-4">🎨</p>
          <h3 className="text-xl font-semibold mb-2">No NFTs Owned</h3>
          <p className="text-muted-foreground">Browse the marketplace to find your first NFT</p>
        </div>
      )}
    </div>
  );
}
