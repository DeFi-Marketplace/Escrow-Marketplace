'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { TokenInput } from '@/components/ui/TokenInput';
import { Button } from '@/components/ui/Button';

interface Token {
  address: string;
  symbol: string;
  name: string;
  balance?: string;
}

const DEMO_TOKENS: Token[] = [
  { address: 'native', symbol: 'XLM', name: 'Stellar Lumens', balance: '1000' },
  { address: 'usdc', symbol: 'USDC', name: 'USD Coin', balance: '5000' },
  { address: 'defi', symbol: 'DEFI', name: 'DeFi Token', balance: '10000' },
  { address: 'yield', symbol: 'YLD', name: 'Yield Token', balance: '2500' },
];

export default function SwapPage() {
  const [sellToken, setSellToken] = useState<Token>(DEMO_TOKENS[0]);
  const [buyToken, setBuyToken] = useState<Token>(DEMO_TOKENS[1]);
  const [sellAmount, setSellAmount] = useState('');
  const [buyAmount, setBuyAmount] = useState('');

  const handleSellAmountChange = (value: string) => {
    setSellAmount(value);
    if (value && !isNaN(parseFloat(value))) {
      const simulated = (parseFloat(value) * 1.95).toFixed(6);
      setBuyAmount(simulated);
    } else {
      setBuyAmount('');
    }
  };

  const handleSellTokenSelect = (token: Token) => {
    setSellToken(token);
  };

  const handleBuyTokenSelect = (token: Token) => {
    setBuyToken(token);
  };

  const handleSwapTokens = () => {
    const temp = sellToken;
    setSellToken(buyToken);
    setBuyToken(temp);
    setSellAmount(buyAmount);
    setBuyAmount(sellAmount);
  };

  return (
    <div className="max-w-md mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Swap Tokens</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <TokenInput
            label="You sell"
            tokens={DEMO_TOKENS}
            selectedToken={sellToken}
            onTokenSelect={handleSellTokenSelect}
            value={sellAmount}
            onChange={handleSellAmountChange}
            showMaxButton
            usdValue={sellAmount ? (parseFloat(sellAmount) * 1.2).toFixed(2) : undefined}
          />

          <div className="flex justify-center">
            <button
              onClick={handleSwapTokens}
              className="w-10 h-10 rounded-full bg-defi-card border border-defi-border flex items-center justify-center hover:bg-defi-border/50 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
            </button>
          </div>

          <TokenInput
            label="You buy"
            tokens={DEMO_TOKENS}
            selectedToken={buyToken}
            onTokenSelect={handleBuyTokenSelect}
            value={buyAmount}
            onChange={setBuyAmount}
            usdValue={buyAmount ? (parseFloat(buyAmount) * 1.1).toFixed(2) : undefined}
          />

          <div className="glass-card p-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Rate</span>
              <span>1 {sellToken.symbol} ≈ 1.95 {buyToken.symbol}</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Fee</span>
              <span>0.30%</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Price Impact</span>
              <span className="text-defi-green">&lt; 0.01%</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>Slippage</span>
              <span>0.50%</span>
            </div>
          </div>

          <Button className="w-full" size="lg" disabled={!sellAmount || parseFloat(sellAmount) <= 0}>
            {!sellAmount || parseFloat(sellAmount) <= 0 ? 'Enter an amount' : 'Swap'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}