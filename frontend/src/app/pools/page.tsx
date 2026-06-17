'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const DEMO_POOLS = [
  { id: 1, tokenA: 'XLM', tokenB: 'USDC', reserveA: '1250000', reserveB: '2500000', fee: '0.30%', apr: '12.5%', tvl: '$3,750,000' },
  { id: 2, tokenA: 'XLM', tokenB: 'DEFI', reserveA: '500000', reserveB: '1000000', fee: '0.30%', apr: '8.2%', tvl: '$1,500,000' },
  { id: 3, tokenA: 'USDC', tokenB: 'YLD', reserveA: '750000', reserveB: '1500000', fee: '0.30%', apr: '15.1%', tvl: '$2,250,000' },
  { id: 4, tokenA: 'XLM', tokenB: 'YLD', reserveA: '300000', reserveB: '600000', fee: '0.30%', apr: '6.8%', tvl: '$900,000' },
];

export default function PoolsPage() {
  const [activeTab, setActiveTab] = useState<'pools' | 'add' | 'remove'>('pools');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Liquidity Pools</h1>
        <div className="flex rounded-xl bg-defi-card p-1">
          {(['pools', 'add', 'remove'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-defi-blue text-white' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab === 'pools' ? 'All Pools' : tab === 'add' ? 'Add Liquidity' : 'Remove Liquidity'}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'pools' && (
        <div className="space-y-4">
          {DEMO_POOLS.map((pool) => (
            <Card key={pool.id} hover>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-defi-blue to-defi-cyan flex items-center justify-center text-sm font-bold border-2 border-defi-dark">
                      {pool.tokenA[0]}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-defi-purple to-defi-pink flex items-center justify-center text-sm font-bold border-2 border-defi-dark">
                      {pool.tokenB[0]}
                    </div>
                  </div>
                  <div>
                    <p className="font-semibold">{pool.tokenA}/{pool.tokenB}</p>
                    <p className="text-sm text-muted-foreground">Fee: {pool.fee}</p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-8 text-right">
                  <div>
                    <p className="text-sm text-muted-foreground">TVL</p>
                    <p className="font-semibold">{pool.tvl}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Volume 24h</p>
                    <p className="font-semibold">$124,500</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">APR</p>
                    <p className="font-semibold text-defi-green">{pool.apr}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {activeTab === 'add' && (
        <Card>
          <CardHeader>
            <CardTitle>Add Liquidity</CardTitle>
            <CardDescription>Deposit two tokens to earn trading fees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="Token A" placeholder="Select token and enter amount" />
            <div className="text-center text-muted-foreground">+</div>
            <Input label="Token B" placeholder="Select token and enter amount" />
            <Button className="w-full">Add Liquidity</Button>
          </CardContent>
        </Card>
      )}

      {activeTab === 'remove' && (
        <Card>
          <CardHeader>
            <CardTitle>Remove Liquidity</CardTitle>
            <CardDescription>Withdraw your tokens from a pool</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input label="LP Token Amount" placeholder="0.0" />
            <Button className="w-full" variant="danger">Remove Liquidity</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
