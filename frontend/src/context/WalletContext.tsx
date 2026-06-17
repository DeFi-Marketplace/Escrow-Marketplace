'use client';

import React, { createContext, useContext, useCallback, useState, useEffect } from 'react';

interface WalletContextType {
  address: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  connect: () => Promise<void>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<string>;
  network: string;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnected: false,
  isConnecting: false,
  connect: async () => {},
  disconnect: () => {},
  signMessage: async () => '',
  network: 'testnet',
});

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [network] = useState('testnet');

  useEffect(() => {
    const saved = localStorage.getItem('wallet_address');
    if (saved) {
      setAddress(saved);
    }
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      if (typeof window !== 'undefined' && (window as any).freighter) {
        const freighter = (window as any).freighter;
        const pubKey = await freighter.getPublicKey();
        setAddress(pubKey);
        localStorage.setItem('wallet_address', pubKey);
      } else {
        const demoAddr = 'G' + Math.random().toString(36).substring(2, 10).toUpperCase() + 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.split('').sort(() => Math.random() - 0.5).slice(0, 44).join('');
        setAddress(demoAddr);
        localStorage.setItem('wallet_address', demoAddr);
        console.log('Demo mode: using generated address');
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    localStorage.removeItem('wallet_address');
  }, []);

  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (typeof window !== 'undefined' && (window as any).freighter) {
      const freighter = (window as any).freighter;
      return freighter.signMessage(message);
    }
    return 'demo_signature_' + btoa(message);
  }, []);

  return (
    <WalletContext.Provider
      value={{
        address,
        isConnected: !!address,
        isConnecting,
        connect,
        disconnect,
        signMessage,
        network,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
}
