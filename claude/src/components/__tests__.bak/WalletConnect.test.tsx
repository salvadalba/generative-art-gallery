import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WalletConnect } from '../components/WalletConnect';
import { walletManager } from '../utils/wallet';

// Mock wallet manager
vi.mock('../utils/wallet', () => ({
  walletManager: {
    getState: vi.fn(() => ({
      isConnected: false,
      address: null,
      balance: null,
      chainId: null,
      provider: null,
      signer: null
    })),
    connect: vi.fn(),
    disconnect: vi.fn(),
    switchNetwork: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  }
}));

describe('WalletConnect', () => {
  it('renders connect button when not connected', () => {
    render(<WalletConnect />);
    
    expect(screen.getByText('Connect Wallet')).toBeInTheDocument();
    expect(screen.getByText('Connect your wallet to mint NFTs')).toBeInTheDocument();
  });

  it('handles connect button click', async () => {
    const mockConnect = vi.fn();
    vi.mocked(walletManager.connect).mockImplementation(mockConnect);
    
    render(<WalletConnect />);
    
    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(mockConnect).toHaveBeenCalled();
    });
  });

  it('displays connected state', () => {
    vi.mocked(walletManager.getState).mockReturnValue({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      balance: '1.5',
      chainId: 1,
      provider: null,
      signer: null
    });

    render(<WalletConnect />);
    
    expect(screen.getByText('Wallet Connected')).toBeInTheDocument();
    expect(screen.getByText('0x1234...7890')).toBeInTheDocument();
    expect(screen.getByText('1.5000 ETH')).toBeInTheDocument();
  });

  it('handles disconnect', async () => {
    const mockDisconnect = vi.fn();
    vi.mocked(walletManager.disconnect).mockImplementation(mockDisconnect);
    
    vi.mocked(walletManager.getState).mockReturnValue({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      balance: '1.5',
      chainId: 1,
      provider: null,
      signer: null
    });

    render(<WalletConnect />);
    
    const disconnectButton = screen.getByText('Disconnect');
    fireEvent.click(disconnectButton);
    
    await waitFor(() => {
      expect(mockDisconnect).toHaveBeenCalled();
    });
  });

  it('handles network switch', async () => {
    const mockSwitchNetwork = vi.fn();
    vi.mocked(walletManager.switchNetwork).mockImplementation(mockSwitchNetwork);
    
    vi.mocked(walletManager.getState).mockReturnValue({
      isConnected: true,
      address: '0x1234567890123456789012345678901234567890',
      balance: '1.5',
      chainId: 1,
      provider: null,
      signer: null
    });

    render(<WalletConnect />);
    
    const polygonButton = screen.getByText('Polygon');
    fireEvent.click(polygonButton);
    
    await waitFor(() => {
      expect(mockSwitchNetwork).toHaveBeenCalledWith(137);
    });
  });

  it('displays error message on connection failure', async () => {
    const mockConnect = vi.fn().mockRejectedValue(new Error('Connection failed'));
    vi.mocked(walletManager.connect).mockImplementation(mockConnect);
    
    render(<WalletConnect />);
    
    const connectButton = screen.getByText('Connect');
    fireEvent.click(connectButton);
    
    await waitFor(() => {
      expect(screen.getByText('Connection failed')).toBeInTheDocument();
    });
  });
});