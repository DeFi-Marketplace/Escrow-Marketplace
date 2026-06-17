'use client';

import React, { useState } from 'react';
import { cn, formatAmount } from '@/lib/utils';

interface Token {
  address: string;
  symbol: string;
  name: string;
  logo?: string;
  balance?: string;
}

interface TokenSelectProps {
  tokens: Token[];
  selected?: Token;
  onSelect: (token: Token) => void;
  showBalance?: boolean;
}

export function TokenSelect({ tokens, selected, onSelect, showBalance = true }: TokenSelectProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-defi-dark rounded-lg border border-defi-border hover:border-defi-blue/50 transition-colors"
      >
        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-defi-blue to-defi-purple flex items-center justify-center text-xs text-white font-bold">
          {selected?.symbol?.[0] || '?'}
        </div>
        <span className="font-semibold">{selected?.symbol || 'Select'}</span>
        <svg className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-64 bg-defi-card border border-defi-border rounded-xl shadow-2xl z-20 overflow-hidden">
            <div className="p-2 border-b border-defi-border">
              <input
                className="w-full bg-defi-dark border border-defi-border rounded-lg px-3 py-2 text-sm"
                placeholder="Search tokens..."
              />
            </div>
            <div className="max-h-60 overflow-y-auto">
              {tokens.map((token) => (
                <button
                  key={token.address}
                  onClick={() => {
                    onSelect(token);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 hover:bg-defi-dark/50 transition-colors text-left',
                    selected?.address === token.address && 'bg-defi-blue/10',
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-defi-blue to-defi-purple flex items-center justify-center text-sm text-white font-bold">
                    {token.symbol[0]}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-sm">{token.symbol}</p>
                    <p className="text-xs text-muted-foreground">{token.name}</p>
                  </div>
                  {showBalance && token.balance && (
                    <span className="text-sm text-muted-foreground">{formatAmount(token.balance)}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
