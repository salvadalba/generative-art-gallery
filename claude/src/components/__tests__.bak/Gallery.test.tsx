import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Gallery from '../components/Gallery';
import { GalleryItem } from '../components/Gallery';

describe('Gallery', () => {
  const mockItems: GalleryItem[] = [
    {
      id: '1',
      seed: 12345,
      colorA: '#FF0000',
      colorB: '#00FF00',
      ipfsHash: 'QmHash1',
      ipfsUrl: 'https://ipfs.io/ipfs/QmHash1',
      timestamp: Date.now() - 3600000, // 1 hour ago
      tokenId: 1,
      owner: '0x1234567890123456789012345678901234567890'
    },
    {
      id: '2',
      seed: 67890,
      colorA: '#0000FF',
      colorB: '#FFFF00',
      ipfsHash: 'QmHash2',
      ipfsUrl: 'https://ipfs.io/ipfs/QmHash2',
      timestamp: Date.now() - 7200000, // 2 hours ago
      tokenId: undefined, // Not minted yet
      owner: undefined
    }
  ];

  it('renders empty state when no items', () => {
    render(<Gallery items={[]} />);
    
    expect(screen.getByText('No artworks yet')).toBeInTheDocument();
    expect(screen.getByText('Generate some art to see your creations here')).toBeInTheDocument();
  });

  it('renders gallery items in grid view by default', () => {
    render(<Gallery items={mockItems} />);
    
    expect(screen.getByText('Seed #12345')).toBeInTheDocument();
    expect(screen.getByText('Seed #67890')).toBeInTheDocument();
    expect(screen.getByText('NFT #1')).toBeInTheDocument();
  });

  it('filters minted items correctly', () => {
    render(<Gallery items={mockItems} />);
    
    const filterSelect = screen.getByRole('combobox');
    filterSelect.click(); // Open dropdown
    
    const mintedOption = screen.getByText('Minted NFTs');
    mintedOption.click();
    
    expect(screen.getByText('Seed #12345')).toBeInTheDocument();
    expect(screen.queryByText('Seed #67890')).not.toBeInTheDocument();
  });

  it('filters local items correctly', () => {
    render(<Gallery items={mockItems} />);
    
    const filterSelect = screen.getByRole('combobox');
    filterSelect.click(); // Open dropdown
    
    const localOption = screen.getByText('Local Art');
    localOption.click();
    
    expect(screen.queryByText('Seed #12345')).not.toBeInTheDocument();
    expect(screen.getByText('Seed #67890')).toBeInTheDocument();
  });

  it('switches to list view', () => {
    render(<Gallery items={mockItems} />);
    
    const listViewButton = screen.getByRole('button', { name: /list/i });
    listViewButton.click();
    
    // In list view, we should see the ExternalLink icon
    expect(screen.getAllByRole('img', { name: /external link/i })).toHaveLength(2);
  });

  it('calls onItemSelect when item is clicked', () => {
    const mockOnItemSelect = vi.fn();
    render(<Gallery items={mockItems} onItemSelect={mockOnItemSelect} />);
    
    const firstItem = screen.getByText('Seed #12345').closest('div[class*="cursor-pointer"]');
    firstItem?.click();
    
    expect(mockOnItemSelect).toHaveBeenCalledWith(mockItems[0]);
  });

  it('shows selected item with ring', () => {
    render(<Gallery items={mockItems} selectedItem={mockItems[0]} />);
    
    const firstItem = screen.getByText('Seed #12345').closest('div[class*="ring-2"]');
    expect(firstItem).toBeInTheDocument();
  });

  it('formats addresses correctly', () => {
    render(<Gallery items={mockItems} />);
    
    // Should show formatted address for minted item
    expect(screen.getByText(/Owner: 0x1234...7890/)).toBeInTheDocument();
  });

  it('formats dates correctly', () => {
    render(<Gallery items={mockItems} />);
    
    // Should show formatted dates
    const dateElements = screen.getAllByText(/\d{1,2}\/\d{1,2}\/\d{4}/);
    expect(dateElements.length).toBeGreaterThan(0);
  });
});