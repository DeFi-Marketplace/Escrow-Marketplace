'use client';

import React from 'react';
import { useWallet } from '@/context/WalletContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { truncateAddress } from '@/lib/utils';

const DEMO_ASSETS = [
  { name: 'Stellar Lumens', symbol: 'XLM', balance: '1,250.50', usdValue: '$312.63', change: '+2.3%' },
  { name: 'USD Coin', symbol: 'USDC', balance: '5,000.00', usdValue: '$5,000.00', change: '0.0%' },
  { name: 'DeFi Token', symbol: 'DEFI', balance: '10,000.00', usdValue: '$850.00', change: '+5.1%' },
  { name: 'Yield Token', symbol: 'YLD', balance: '2,500.00', usdValue: '$175.00', change: '-1.2%' },
];

export default function PortfolioPage() {
  const { address, isConnected, connect, isConnecting } = useWallet();

  if (!isConnected) {
    return (
      <div className="text-center py-24">
        <p className="text-4xl mb-4">🔒</p>
        <h2 className="text-2xl font-semibold mb-2">Connect Your Wallet</h2>
        <p className="text-muted-foreground mb-6">View your portfolio, balances, and positions</p>
        <Button onClick={connect} loading={isConnecting}>Connect Wallet</Button>
      </div>
    );
  }

  const totalValue = DEMO_ASSETS.reduce((sum, a) => sum + parseFloat(a.usdValue.replace(/[^0-9.-]/g, '')), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Portfolio</h1>
          <p className="text-sm text-muted-foreground font-mono">{truncateAddress(address || '', 8)}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-3xl font-bold">${totalValue.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Net Worth</CardTitle>
            <p className="text-2xl font-bold">${totalValue.toFixed(2)}</p>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm text-defi-green">
              <span>▲</span>
              <span>+$32.50 (1.2%) today</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Assets</CardTitle>
            <p className="text-2xl font-bold">{DEMO_ASSETS.length}</p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Across {DEMO_ASSETS.length} tokens</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Positions</CardTitle>
            <p className="text-2xl font-bold">3</p>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 text-xs">
              <span className="text-defi-green">1 Lending</span>
              <span className="text-defi-yellow">1 Staking</span>
              <span className="text-defi-blue">1 Pool LP</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tokens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <div className="grid grid-cols-4 gap-4 text-sm text-muted-foreground pb-3 border-b border-defi-border">
              <span>Asset</span>
              <span className="text-right">Balance</span>
              <span className="text-right">Value</span>
              <span className="text-right">24h</span>
            </div>
            {DEMO_ASSETS.map((asset) => (
              <div key={asset.symbol} className="grid grid-cols-4 gap-4 items-center py-3 border-b border-defi-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-defi-blue to-defi-cyan flex items-center justify-center text-xs font-bold">
                    {asset.symbol[0]}
                  </div>
                  <div>
                    <p className="font-medium text-sm">{asset.symbol}</p>
                    <p className="text-xs text-muted-foreground">{asset.name}</p>
                  </div>
                </div>
                <p className="text-right font-mono text-sm">{asset.balance}</p>
                <p className="text-right font-mono text-sm">{asset.usdValue}</p>
                <p className={`text-right text-sm font-medium ${
                  asset.change.startsWith('+') ? 'text-defi-green' : asset.change === '0.0%' ? '' : 'text-defi-red'
                }`}>
                  {asset.change}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
