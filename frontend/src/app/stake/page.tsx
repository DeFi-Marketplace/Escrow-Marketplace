'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

const DEMO_POOLS = [
  { id: 1, token: 'XLM-USDC LP', reward: 'DEFI', staked: '500,000', apr: '45%', totalStaked: '2,500,000' },
  { id: 2, token: 'XLM-DEFI LP', reward: 'DEFI', staked: '250,000', apr: '32%', totalStaked: '1,200,000' },
  { id: 3, token: 'USDC-YLD LP', reward: 'YLD', staked: '180,000', apr: '28%', totalStaked: '900,000' },
  { id: 4, token: 'DEFI Single', reward: 'DEFI', staked: '1,000,000', apr: '18%', totalStaked: '5,000,000' },
];

export default function StakePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Staking & Yield Farming</h1>
      <p className="text-muted-foreground">Stake LP tokens or single assets to earn rewards</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-muted-foreground">Active Pools</h2>
          {DEMO_POOLS.map((pool) => (
            <Card key={pool.id} hover>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-defi-green to-emerald-500 flex items-center justify-center text-sm font-bold">
                    {pool.token[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{pool.token}</p>
                    <p className="text-xs text-muted-foreground">Reward: {pool.reward}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-defi-green font-bold">{pool.apr}</p>
                  <p className="text-xs text-muted-foreground">APR</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-defi-border grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Staked</p>
                  <p className="font-mono">{pool.totalStaked}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Your Stake</p>
                  <p className="font-mono">0</p>
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Stake</CardTitle>
              <CardDescription>Deposit tokens to start earning</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input label="Select Pool" placeholder="Search pools..." />
              <Input label="Amount" placeholder="0.0" />
              <Button className="w-full">Stake</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Your Rewards</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Pending Rewards</span>
                <span className="text-xl font-bold">0 DEFI</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Total Staked</span>
                <span className="font-semibold">0 LP Tokens</span>
              </div>
              <Button className="w-full" variant="secondary">Claim Rewards</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
