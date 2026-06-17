'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const DEMO_MARKETS = [
  { token: 'USDC', totalDeposits: '5,000,000', totalBorrows: '3,200,000', depositApy: '6.2%', borrowApy: '8.5%', utilization: '64%', collateralFactor: '80%' },
  { token: 'XLM', totalDeposits: '12,000,000', totalBorrows: '7,500,000', depositApy: '4.8%', borrowApy: '7.2%', utilization: '62.5%', collateralFactor: '75%' },
  { token: 'DEFI', totalDeposits: '2,500,000', totalBorrows: '1,800,000', depositApy: '9.5%', borrowApy: '14.2%', utilization: '72%', collateralFactor: '60%' },
  { token: 'YLD', totalDeposits: '1,000,000', totalBorrows: '600,000', depositApy: '7.1%', borrowApy: '10.5%', utilization: '60%', collateralFactor: '65%' },
];

export default function LendPage() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'borrow'>('deposit');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <h1 className="text-2xl font-bold">Lending & Borrowing</h1>
        <div className="flex rounded-xl bg-defi-card p-1">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'deposit' ? 'bg-defi-green text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setActiveTab('borrow')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'borrow' ? 'bg-defi-yellow text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Borrow
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Markets</h2>
          {DEMO_MARKETS.map((market) => (
            <Card key={market.token} hover>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-defi-blue to-defi-cyan flex items-center justify-center text-sm font-bold">
                    {market.token[0]}
                  </div>
                  <div>
                    <p className="font-semibold">{market.token}</p>
                    <p className="text-xs text-muted-foreground">CF: {market.collateralFactor}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 text-right text-sm">
                  <div>
                    <p className="text-muted-foreground">Deposit APY</p>
                    <p className="font-semibold text-defi-green">{market.depositApy}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Borrow APY</p>
                    <p className="font-semibold text-defi-yellow">{market.borrowApy}</p>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div>
          {activeTab === 'deposit' ? (
            <Card>
              <CardHeader>
                <CardTitle>Deposit</CardTitle>
                <CardDescription>Supply assets to earn interest</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Select Token</p>
                  <div className="flex gap-2">
                    {['USDC', 'XLM', 'DEFI', 'YLD'].map((t) => (
                      <button key={t} className="px-4 py-2 bg-defi-card border border-defi-border rounded-lg text-sm hover:border-defi-blue/50">
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <input className="input-field" placeholder="0.0" />
                </div>
                <div className="glass-card p-3 text-sm space-y-1">
                  <p className="flex justify-between"><span className="text-muted-foreground">Supply APY</span><span className="text-defi-green">6.2%</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">Wallet Balance</span><span>5,000 USDC</span></p>
                </div>
                <Button className="w-full">Deposit</Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Borrow</CardTitle>
                <CardDescription>Borrow assets against your collateral</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Select Token</p>
                  <div className="flex gap-2">
                    {['USDC', 'XLM', 'DEFI', 'YLD'].map((t) => (
                      <button key={t} className="px-4 py-2 bg-defi-card border border-defi-border rounded-lg text-sm hover:border-defi-blue/50">
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Amount</p>
                  <input className="input-field" placeholder="0.0" />
                </div>
                <div className="glass-card p-3 text-sm space-y-1">
                  <p className="flex justify-between"><span className="text-muted-foreground">Borrow APY</span><span className="text-defi-yellow">8.5%</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">Health Factor</span><span className="text-defi-green">∞</span></p>
                  <p className="flex justify-between"><span className="text-muted-foreground">Max Borrow</span><span>0 USDC</span></p>
                </div>
                <Button className="w-full">Borrow</Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
