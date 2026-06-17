'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

const DEMO_SALES = [
  { id: 1, token: 'NewToken', symbol: 'NEW', price: '0.50 USDC', supply: '1,000,000', sold: '650,000', start: '2024-06-01', end: '2024-06-15', status: 'Live' },
  { id: 2, token: 'Galaxy Token', symbol: 'GLX', price: '0.25 USDC', supply: '5,000,000', sold: '0', start: '2024-06-20', end: '2024-07-05', status: 'Upcoming' },
  { id: 3, token: 'StellarFarm', symbol: 'FARM', price: '1.20 XLM', supply: '500,000', sold: '500,000', end: '2024-05-30', status: 'Ended' },
];

export default function LaunchpadPage() {
  const [activeTab, setActiveTab] = useState<'sales' | 'create'>('sales');

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Token Launchpad</h1>
        <div className="flex rounded-xl bg-defi-card p-1">
          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'sales' ? 'bg-defi-blue text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Active Sales
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'create' ? 'bg-defi-blue text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Create Sale
          </button>
        </div>
      </div>

      {activeTab === 'sales' && (
        <div className="space-y-4">
          {DEMO_SALES.map((sale) => {
            const progress = (parseInt(sale.sold.replace(/,/g, '')) / parseInt(sale.supply.replace(/,/g, ''))) * 100;
            const isLive = sale.status === 'Live';
            const isEnded = sale.status === 'Ended';

            return (
              <Card key={sale.id}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                      isLive ? 'from-defi-green to-emerald-500' : isEnded ? 'from-gray-500 to-gray-700' : 'from-defi-blue to-defi-cyan'
                    } flex items-center justify-center text-xl font-bold`}>
                      {sale.symbol[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{sale.token}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          isLive ? 'bg-defi-green/10 text-defi-green' : isEnded ? 'bg-gray-500/10 text-gray-400' : 'bg-defi-blue/10 text-defi-blue'
                        }`}>
                          {sale.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Price: {sale.price}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Progress</p>
                    <p className="font-semibold">{progress.toFixed(0)}% ({sale.sold}/{sale.supply})</p>
                  </div>
                </div>
                <div className="mt-3 w-full bg-defi-dark rounded-full h-2 overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${
                    isLive ? 'bg-gradient-to-r from-defi-green to-emerald-500' : isEnded ? 'bg-gray-500' : 'bg-defi-blue'
                  }`} style={{ width: `${progress}%` }} />
                </div>
                <div className="mt-3 flex items-center justify-end">
                  {isLive && <Button size="sm">Buy Tokens</Button>}
                  {isEnded && <Button size="sm" variant="secondary">Claim Tokens</Button>}
                  {!isLive && !isEnded && (
                    <p className="text-sm text-muted-foreground">Starts: {sale.start}</p>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {activeTab === 'create' && (
        <div className="max-w-lg mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Create Token Sale</CardTitle>
              <CardDescription>Launch your own token on Stellar through our launchpad</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Token Address</p>
                <input className="input-field" placeholder="Enter token contract address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Price (USDC)</p>
                  <input className="input-field" placeholder="0.0" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Max Supply</p>
                  <input className="input-field" placeholder="1000000" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Start Time</p>
                  <input className="input-field" type="datetime-local" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">End Time</p>
                  <input className="input-field" type="datetime-local" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Min Per Wallet</p>
                  <input className="input-field" placeholder="1" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Max Per Wallet</p>
                  <input className="input-field" placeholder="10000" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="whitelist" className="rounded border-defi-border" />
                <label htmlFor="whitelist" className="text-sm text-muted-foreground">Whitelist only</label>
              </div>
              <Button className="w-full">Create Sale</Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
