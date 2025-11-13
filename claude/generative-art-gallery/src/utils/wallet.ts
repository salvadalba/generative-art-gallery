import { ethers, BrowserProvider, formatEther } from 'ethers';

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: string | null;
  chainId: number | null;
  provider: BrowserProvider | null;
  signer: any | null;
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer: string;
  currency: string;
}

export const SUPPORTED_NETWORKS: NetworkConfig[] = [
  {
    chainId: 1,
    name: 'Ethereum Mainnet',
    rpcUrl: 'https://eth-mainnet.g.alchemy.com/v2/your-api-key',
    blockExplorer: 'https://etherscan.io',
    currency: 'ETH'
  },
  {
    chainId: 137,
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    blockExplorer: 'https://polygonscan.com',
    currency: 'MATIC'
  },
  {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://rpc.sepolia.org',
    blockExplorer: 'https://sepolia.etherscan.io',
    currency: 'ETH'
  },
  {
    chainId: 80002,
    name: 'Polygon Amoy Testnet',
    rpcUrl: 'https://rpc-amoy.polygon.technology',
    blockExplorer: 'https://amoy.polygonscan.com',
    currency: 'MATIC'
  }
];

export class WalletManager {
  private state: WalletState = {
    isConnected: false,
    address: null,
    balance: null,
    chainId: null,
    provider: null,
    signer: null
  };

  private listeners: Map<string, ((state: WalletState) => void)[]> = new Map();

  constructor() {
    this.setupEventListeners();
  }

  private setupEventListeners() {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      (window as any).ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
      (window as any).ethereum.on('chainChanged', this.handleChainChanged.bind(this));
      (window as any).ethereum.on('disconnect', this.handleDisconnect.bind(this));
    }
  }

  private handleAccountsChanged(accounts: string[]) {
    if (accounts.length === 0) {
      this.disconnect();
    } else {
      this.updateAccount(accounts[0]);
    }
  }

  private handleChainChanged(chainId: string) {
    const newChainId = parseInt(chainId, 16);
    this.state.chainId = newChainId;
    this.emit('chainChanged', this.state);
  }

  private handleDisconnect() {
    this.disconnect();
  }

  private async updateAccount(address: string) {
    if (!this.state.provider) return;

    try {
      const balance = await this.state.provider.getBalance(address);
      const formattedBalance = formatEther(balance);
      
      this.state.address = address;
      this.state.balance = formattedBalance;
      this.emit('accountsChanged', this.state);
    } catch (error) {
      console.error('Error updating account:', error);
    }
  }

  async connect(): Promise<WalletState> {
    if (typeof window === 'undefined' || !(window as any).ethereum) {
      throw new Error('No Ethereum provider found. Please install MetaMask.');
    }

    try {
      // Request account access
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts'
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found');
      }

      // Create provider and signer
      const provider = new BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const network = await provider.getNetwork();

      // Get balance
      const balance = await provider.getBalance(accounts[0]);
      const formattedBalance = formatEther(balance);

      this.state = {
        isConnected: true,
        address: accounts[0],
        balance: formattedBalance,
        chainId: Number(network.chainId),
        provider,
        signer
      };

      this.emit('connected', this.state);
      return this.state;

    } catch (error) {
      console.error('Connection error:', error);
      throw error;
    }
  }

  disconnect() {
    this.state = {
      isConnected: false,
      address: null,
      balance: null,
      chainId: null,
      provider: null,
      signer: null
    };
    this.emit('disconnected', this.state);
  }

  async switchNetwork(chainId: number): Promise<void> {
    if (!(window as any).ethereum) {
      throw new Error('No Ethereum provider found');
    }

    const network = SUPPORTED_NETWORKS.find(n => n.chainId === chainId);
    if (!network) {
      throw new Error(`Network with chainId ${chainId} not supported`);
    }

    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: `0x${chainId.toString(16)}` }]
      });
    } catch (error: any) {
      // If the network doesn't exist in MetaMask, add it
      if (error.code === 4902) {
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId: `0x${chainId.toString(16)}`,
            chainName: network.name,
            rpcUrls: [network.rpcUrl],
            blockExplorerUrls: [network.blockExplorer],
            nativeCurrency: {
              name: network.currency,
              symbol: network.currency,
              decimals: 18
            }
          }]
        });
      } else {
        throw error;
      }
    }
  }

  async getGasPrice(): Promise<bigint> {
    if (!this.state.provider) {
      throw new Error('No provider available');
    }
    return await this.state.provider.getFeeData().then(data => data.gasPrice || 0n);
  }

  async estimateGas(transaction: any): Promise<bigint> {
    if (!this.state.provider) {
      throw new Error('No provider available');
    }
    return await this.state.provider.estimateGas(transaction);
  }

  getState(): WalletState {
    return { ...this.state };
  }

  on(event: string, callback: (state: WalletState) => void): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  off(event: string, callback: (state: WalletState) => void): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: string, state: WalletState): void {
    const listeners = this.listeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(state));
    }
  }
}

export const walletManager = new WalletManager();