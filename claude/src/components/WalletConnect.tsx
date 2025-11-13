import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { walletManager, WalletState, SUPPORTED_NETWORKS } from '../utils/wallet';
import { Wallet, AlertCircle, Link } from 'lucide-react';

interface WalletConnectProps {
  onConnect?: (state: WalletState) => void;
  onDisconnect?: () => void;
  onNetworkChange?: (chainId: number) => void;
}

export default function WalletConnect({ onConnect, onDisconnect, onNetworkChange }: WalletConnectProps) {
  const [walletState, setWalletState] = useState<WalletState>(walletManager.getState());
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleWalletUpdate = (state: WalletState) => {
      setWalletState(state);
      if (state.isConnected && onConnect) {
        onConnect(state);
      }
    };

    const handleDisconnect = () => {
      setWalletState(walletManager.getState());
      if (onDisconnect) {
        onDisconnect();
      }
    };

    const handleNetworkChange = (state: WalletState) => {
      if (onNetworkChange && state.chainId) {
        onNetworkChange(state.chainId);
      }
    };

    walletManager.on('connected', handleWalletUpdate);
    walletManager.on('disconnected', handleDisconnect);
    walletManager.on('chainChanged', handleNetworkChange);
    walletManager.on('accountsChanged', handleWalletUpdate);

    return () => {
      walletManager.off('connected', handleWalletUpdate);
      walletManager.off('disconnected', handleDisconnect);
      walletManager.off('chainChanged', handleNetworkChange);
      walletManager.off('accountsChanged', handleWalletUpdate);
    };
  }, [onConnect, onDisconnect, onNetworkChange]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      await walletManager.connect();
    } catch (err: any) {
      setError(err.message || 'Failed to connect wallet');
      console.error('Wallet connection error:', err);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    walletManager.disconnect();
  };

  const handleNetworkSwitch = async (chainId: number) => {
    try {
      await walletManager.switchNetwork(chainId);
    } catch (err: any) {
      setError(err.message || 'Failed to switch network');
      console.error('Network switch error:', err);
    }
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatBalance = (balance: string) => {
    const num = parseFloat(balance);
    if (isNaN(num)) return '0.00';
    return num.toFixed(4);
  };

  const getCurrentNetwork = () => {
    return SUPPORTED_NETWORKS.find(n => n.chainId === walletState.chainId);
  };

  if (!walletState.isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="w-6 h-6 text-gray-400" />
            <div>
              <h3 className="font-medium">Connect Wallet</h3>
              <p className="text-sm text-gray-400">Connect your wallet to mint NFTs</p>
            </div>
          </div>
          <button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
          >
            <Link className="w-4 h-4" />
            {isConnecting ? 'Connecting...' : 'Connect'}
          </button>
        </div>
        
        {error && (
          <div className="mt-3 flex items-center gap-2 text-sm text-red-400">
            <AlertCircle className="w-4 h-4" />
            {error}
          </div>
        )}
      </div>
    );
  }

  const currentNetwork = getCurrentNetwork();

  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Wallet className="w-6 h-6 text-green-400" />
          <div>
            <h3 className="font-medium">Wallet Connected</h3>
            <p className="text-sm text-gray-400">{formatAddress(walletState.address!)}</p>
          </div>
        </div>
        <button
          onClick={handleDisconnect}
          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 rounded transition-colors"
        >
          Disconnect
        </button>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Balance:</span>
          <span className="text-sm font-medium">
            {formatBalance(walletState.balance!)} {currentNetwork?.currency || 'ETH'}
          </span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-400">Network:</span>
          <span className="text-sm font-medium">
            {currentNetwork?.name || `Chain ID: ${walletState.chainId}`}
          </span>
        </div>

        <div className="pt-2 border-t border-gray-700">
          <p className="text-sm text-gray-400 mb-2">Switch Network:</p>
          <div className="grid grid-cols-2 gap-2">
            {SUPPORTED_NETWORKS.map((network) => (
              <button
                key={network.chainId}
                onClick={() => handleNetworkSwitch(network.chainId)}
                className={`text-xs px-2 py-1 rounded transition-colors ${
                  walletState.chainId === network.chainId
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {network.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}