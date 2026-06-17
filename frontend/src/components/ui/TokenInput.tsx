'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { TokenSelect } from './TokenSelect';

interface Token {
  address: string;
  symbol: string;
  name: string;
  balance?: string;
}

interface TokenInputProps {
  label: string;
  tokens: Token[];
  selectedToken?: Token;
  onTokenSelect: (token: Token) => void;
  value: string;
  onChange: (value: string) => void;
  usdValue?: string;
  showMaxButton?: boolean;
  onMax?: () => void;
  error?: string;
  disabled?: boolean;
}

export function TokenInput({
  label,
  tokens,
  selectedToken,
  onTokenSelect,
  value,
  onChange,
  usdValue,
  showMaxButton = false,
  onMax,
  error,
  disabled = false,
}: TokenInputProps) {
  return (
    <div className={cn('glass-card p-4 space-y-2', error && 'border-defi-red/50')}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        {selectedToken?.balance && (
          <span className="text-xs text-muted-foreground">
            Balance: {selectedToken.balance}
          </span>
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1">
          <input
            type="text"
            inputMode="decimal"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="0.0"
            disabled={disabled}
            className="w-full bg-transparent text-2xl font-mono font-bold outline-none placeholder:text-muted-foreground/50 disabled:opacity-50"
          />
        </div>
        <TokenSelect tokens={tokens} selected={selectedToken} onSelect={onTokenSelect} />
      </div>

      <div className="flex items-center justify-between">
        {usdValue && <span className="text-xs text-muted-foreground">~${usdValue}</span>}
        <div className="flex-1" />
        {showMaxButton && onMax && (
          <button
            type="button"
            onClick={onMax}
            className="text-xs font-medium text-defi-blue hover:text-defi-blue/80"
          >
            MAX
          </button>
        )}
      </div>

      {error && <p className="text-xs text-defi-red">{error}</p>}
    </div>
  );
}
