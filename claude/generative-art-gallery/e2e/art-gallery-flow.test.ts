import { test, expect, Page } from '@playwright/test';
import { ethers } from 'ethers';

// Mock MetaMask provider
class MockProvider extends ethers.providers.JsonRpcProvider {
  constructor() {
    super('http://localhost:8545');
  }
  
  async getNetwork() {
    return { chainId: 1337, name: 'localhost' };
  }
}

// Mock wallet
const mockWallet = {
  address: '0x1234567890123456789012345678901234567890',
  provider: new MockProvider(),
  getBalance: async () => ethers.BigNumber.from('1000000000000000000'),
  getChainId: async () => 1337,
};

test.describe('Generative Art Gallery E2E Flow', () => {
  let page: Page;
  
  test.beforeEach(async ({ page: testPage }) => {
    page = testPage;
    
    // Mock MetaMask
    await page.addInitScript(() => {
      (window as any).ethereum = {
        request: async ({ method }: { method: string }) => {
          if (method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (method === 'eth_chainId') {
            return '0x539'; // 1337
          }
          if (method === 'net_version') {
            return '1337';
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });
    
    // Start from the home page
    await page.goto('http://localhost:5173');
    await page.waitForLoadState('networkidle');
  });

  test('should complete full art generation and gallery flow', async () => {
    // Step 1: Connect wallet
    await test.step('Connect wallet', async () => {
      const connectButton = page.getByRole('button', { name: /connect/i });
      await expect(connectButton).toBeVisible();
      await connectButton.click();
      
      // Wait for wallet to be connected
      await expect(page.getByText(/connected/i)).toBeVisible();
    });

    // Step 2: Generate art with custom parameters
    await test.step('Generate art with custom parameters', async () => {
      // Set seed value
      const seedInput = page.getByLabel(/seed/i);
      await seedInput.fill('12345');
      
      // Set colors
      const colorAInput = page.getByLabel(/color a/i);
      await colorAInput.fill('#ff0000');
      
      const colorBInput = page.getByLabel(/color b/i);
      await colorBInput.fill('#00ff00');
      
      // Click generate button
      const generateButton = page.getByRole('button', { name: /generate/i });
      await generateButton.click();
      
      // Wait for art to be generated
      await expect(page.locator('canvas')).toBeVisible();
      
      // Verify parameters are reflected in UI
      await expect(page.getByText(/seed: 12345/i)).toBeVisible();
    });

    // Step 3: Export art to gallery
    await test.step('Export art to gallery', async () => {
      const exportButton = page.getByRole('button', { name: /export/i });
      await exportButton.click();
      
      // Wait for success notification
      await expect(page.getByText(/saved to gallery/i)).toBeVisible();
      
      // Navigate to gallery
      const galleryTab = page.getByRole('link', { name: /gallery/i });
      await galleryTab.click();
      
      // Verify art is in gallery
      await expect(page.locator('.gallery-item')).toHaveCount(1);
      await expect(page.getByText(/seed: 12345/i)).toBeVisible();
    });

    // Step 4: Generate multiple artworks
    await test.step('Generate multiple artworks', async () => {
      // Go back to home
      const homeTab = page.getByRole('link', { name: /home/i });
      await homeTab.click();
      
      // Generate second artwork with different parameters
      const seedInput = page.getByLabel(/seed/i);
      await seedInput.fill('67890');
      
      const colorAInput = page.getByLabel(/color a/i);
      await colorAInput.fill('#0000ff');
      
      const colorBInput = page.getByLabel(/color b/i);
      await colorBInput.fill('#ffff00');
      
      const generateButton = page.getByRole('button', { name: /generate/i });
      await generateButton.click();
      
      await expect(page.locator('canvas')).toBeVisible();
      
      // Export second artwork
      const exportButton = page.getByRole('button', { name: /export/i });
      await exportButton.click();
      
      await expect(page.getByText(/saved to gallery/i)).toBeVisible();
    });

    // Step 5: Verify gallery has multiple items
    await test.step('Verify gallery has multiple items', async () => {
      const galleryTab = page.getByRole('link', { name: /gallery/i });
      await galleryTab.click();
      
      // Should have 2 items now
      await expect(page.locator('.gallery-item')).toHaveCount(2);
      
      // Verify both artworks are displayed with correct parameters
      await expect(page.getByText(/seed: 12345/i)).toBeVisible();
      await expect(page.getByText(/seed: 67890/i)).toBeVisible();
    });
  });

  test('should handle wallet disconnection and reconnection', async () => {
    // Connect wallet first
    await page.getByRole('button', { name: /connect/i }).click();
    await expect(page.getByText(/connected/i)).toBeVisible();
    
    // Disconnect wallet
    const disconnectButton = page.getByRole('button', { name: /disconnect/i });
    await disconnectButton.click();
    
    // Should show connect button again
    await expect(page.getByRole('button', { name: /connect/i })).toBeVisible();
    
    // Reconnect wallet
    await page.getByRole('button', { name: /connect/i }).click();
    await expect(page.getByText(/connected/i)).toBeVisible();
  });

  test('should handle parameter validation', async () => {
    // Connect wallet
    await page.getByRole('button', { name: /connect/i }).click();
    
    // Try to generate with empty seed
    const seedInput = page.getByLabel(/seed/i);
    await seedInput.fill('');
    
    const generateButton = page.getByRole('button', { name: /generate/i });
    await generateButton.click();
    
    // Should show validation error
    await expect(page.getByText(/please enter a valid seed/i)).toBeVisible();
    
    // Try with invalid color
    await seedInput.fill('12345');
    const colorAInput = page.getByLabel(/color a/i);
    await colorAInput.fill('invalid-color');
    
    await generateButton.click();
    await expect(page.getByText(/please enter a valid color/i)).toBeVisible();
  });

  test('should handle network switching', async () => {
    // Connect wallet
    await page.getByRole('button', { name: /connect/i }).click();
    
    // Mock network change
    await page.addInitScript(() => {
      (window as any).ethereum.request = async ({ method }: { method: string }) => {
        if (method === 'eth_chainId') {
          return '0x1'; // Ethereum mainnet
        }
        return null;
      };
    });
    
    // Trigger network change event
    await page.evaluate(() => {
      (window as any).ethereum.emit('chainChanged', '0x1');
    });
    
    // Should show network change notification
    await expect(page.getByText(/network changed/i)).toBeVisible();
  });

  test('should handle gallery item interactions', async () => {
    // Generate and save artwork
    await page.getByRole('button', { name: /connect/i }).click();
    await page.getByLabel(/seed/i).fill('12345');
    await page.getByRole('button', { name: /generate/i }).click();
    await expect(page.locator('canvas')).toBeVisible();
    await page.getByRole('button', { name: /export/i }).click();
    
    // Go to gallery
    await page.getByRole('link', { name: /gallery/i }).click();
    
    // Click on gallery item
    const galleryItem = page.locator('.gallery-item').first();
    await galleryItem.click();
    
    // Should show enlarged view
    await expect(page.locator('.modal')).toBeVisible();
    await expect(page.getByText(/seed: 12345/i)).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: /close/i }).click();
    await expect(page.locator('.modal')).not.toBeVisible();
  });

  test('should handle export functionality', async () => {
    // Connect wallet and generate art
    await page.getByRole('button', { name: /connect/i }).click();
    await page.getByLabel(/seed/i).fill('12345');
    await page.getByRole('button', { name: /generate/i }).click();
    await expect(page.locator('canvas')).toBeVisible();
    
    // Test export functionality
    const exportButton = page.getByRole('button', { name: /export/i });
    await exportButton.click();
    
    // Verify success message
    await expect(page.getByText(/saved to gallery/i)).toBeVisible();
    
    // Check that localStorage was updated
    const galleryItems = await page.evaluate(() => {
      return localStorage.getItem('generative-art-gallery');
    });
    
    expect(galleryItems).toBeTruthy();
    const items = JSON.parse(galleryItems!);
    expect(items).toHaveLength(1);
    expect(items[0].seed).toBe(12345);
    expect(items[0].imageData).toMatch(/^data:image\/png;base64,/);
  });

  test('should handle error states gracefully', async () => {
    // Mock failed generation
    await page.route('**/api/generate', route => {
      route.abort('failed');
    });
    
    // Connect wallet
    await page.getByRole('button', { name: /connect/i }).click();
    
    // Try to generate art
    await page.getByLabel(/seed/i).fill('12345');
    await page.getByRole('button', { name: /generate/i }).click();
    
    // Should show error message
    await expect(page.getByText(/failed to generate artwork/i)).toBeVisible();
    
    // Should not show canvas
    await expect(page.locator('canvas')).not.toBeVisible();
  });

  test('should persist gallery items across page reloads', async () => {
    // Generate and save artwork
    await page.getByRole('button', { name: /connect/i }).click();
    await page.getByLabel(/seed/i).fill('12345');
    await page.getByRole('button', { name: /generate/i }).click();
    await expect(page.locator('canvas')).toBeVisible();
    await page.getByRole('button', { name: /export/i }).click();
    
    // Reload page
    await page.reload();
    
    // Go to gallery
    await page.getByRole('link', { name: /gallery/i }).click();
    
    // Should still have the saved item
    await expect(page.locator('.gallery-item')).toHaveCount(1);
    await expect(page.getByText(/seed: 12345/i)).toBeVisible();
  });
});

test.describe('NFT Minting Flow', () => {
  test('should complete NFT minting process', async ({ page }) => {
    // Mock contract interactions
    await page.addInitScript(() => {
      (window as any).ethereum = {
        request: async ({ method, params }: { method: string; params?: any[] }) => {
          if (method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (method === 'eth_chainId') {
            return '0x539';
          }
          if (method === 'eth_sendTransaction') {
            return '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
          }
          if (method === 'eth_call') {
            return '0x0000000000000000000000000000000000000000000000000000000000000001';
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });
    
    // Generate art
    await page.goto('http://localhost:5173');
    await page.getByRole('button', { name: /connect/i }).click();
    await page.getByLabel(/seed/i).fill('12345');
    await page.getByRole('button', { name: /generate/i }).click();
    await expect(page.locator('canvas')).toBeVisible();
    
    // Mock IPFS upload
    await page.route('**/api/upload-to-ipfs', route => {
      route.fulfill({
        json: {
          success: true,
          ipfsHash: 'QmTest123456789',
          uri: 'ipfs://QmTest123456789/metadata.json'
        }
      });
    });
    
    // Mock contract mint
    await page.route('**/api/mint-nft', route => {
      route.fulfill({
        json: {
          success: true,
          transactionHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          tokenId: '1'
        }
      });
    });
    
    // Click mint button
    const mintButton = page.getByRole('button', { name: /mint nft/i });
    await mintButton.click();
    
    // Should show minting modal
    await expect(page.getByText(/minting nft/i)).toBeVisible();
    
    // Wait for success
    await expect(page.getByText(/nft minted successfully/i)).toBeVisible();
    await expect(page.getByText(/token id: 1/i)).toBeVisible();
    
    // Close modal
    await page.getByRole('button', { name: /close/i }).click();
  });

  test('should handle minting errors gracefully', async ({ page }) => {
    // Mock failed minting
    await page.addInitScript(() => {
      (window as any).ethereum = {
        request: async ({ method }: { method: string }) => {
          if (method === 'eth_requestAccounts') {
            return ['0x1234567890123456789012345678901234567890'];
          }
          if (method === 'eth_chainId') {
            return '0x539';
          }
          if (method === 'eth_sendTransaction') {
            throw new Error('User rejected transaction');
          }
          return null;
        },
        on: () => {},
        removeListener: () => {},
      };
    });
    
    // Generate art
    await page.goto('http://localhost:5173');
    await page.getByRole('button', { name: /connect/i }).click();
    await page.getByLabel(/seed/i).fill('12345');
    await page.getByRole('button', { name: /generate/i }).click();
    await expect(page.locator('canvas')).toBeVisible();
    
    // Try to mint
    const mintButton = page.getByRole('button', { name: /mint nft/i });
    await mintButton.click();
    
    // Should show error message
    await expect(page.getByText(/transaction rejected/i)).toBeVisible();
  });
});