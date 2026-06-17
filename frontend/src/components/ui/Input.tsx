'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  rightElement?: React.ReactNode;
}

export function Input({ className, label, error, rightElement, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-muted-foreground">{label}</label>
      )}
      <div className="relative">
        <input
          className={cn(
            'input-field',
            error && 'border-defi-red focus:ring-defi-red/50 focus:border-defi-red',
            rightElement && 'pr-20',
            className,
          )}
          {...props}
        />
        {rightElement && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightElement}</div>
        )}
      </div>
      {error && <p className="text-xs text-defi-red">{error}</p>}
    </div>
  );
}
