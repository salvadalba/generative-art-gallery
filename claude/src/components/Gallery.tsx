import { useState, useEffect } from 'react';
import { Grid, Image as ImageIcon, ExternalLink } from 'lucide-react';

export interface GalleryItem {
  id: string;
  seed: number;
  colorA: string;
  colorB: string;
  ipfsHash: string;
  ipfsUrl: string;
  timestamp: number;
  tokenId?: number;
  owner?: string;
  imageData?: string;
  txHash?: string;
}

interface GalleryProps {
  items: GalleryItem[];
  onItemSelect?: (item: GalleryItem) => void;
  selectedItem?: GalleryItem | null;
}

export default function Gallery({ items, onItemSelect, selectedItem }: GalleryProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filter, setFilter] = useState<'all' | 'minted' | 'local'>('all');

  const filteredItems = items.filter(item => {
    if (filter === 'minted') return item.tokenId !== undefined;
    if (filter === 'local') return item.tokenId === undefined;
    return true;
  });

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (items.length === 0) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <ImageIcon className="w-16 h-16 mx-auto mb-4 text-gray-600" />
        <h3 className="text-lg font-medium mb-2">No artworks yet</h3>
        <p className="text-gray-400">
          Generate some art to see your creations here
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Art Gallery</h2>
        
        <div className="flex items-center gap-4">
          {/* Filter */}
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value as 'all' | 'minted' | 'local')}
            className="px-3 py-1 bg-gray-700 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Items</option>
            <option value="minted">Minted NFTs</option>
            <option value="local">Local Art</option>
          </select>

          {/* View Mode */}
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded ${
                viewMode === 'list'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onItemSelect?.(item)}
              className={`bg-gray-700 rounded-lg p-4 cursor-pointer transition-all hover:bg-gray-600 ${
                selectedItem?.id === item.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="aspect-square bg-gradient-to-br rounded-lg mb-3"
                   style={{
                     background: `linear-gradient(135deg, ${item.colorA}, ${item.colorB})`
                   }}
              />
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Seed #{item.seed}</span>
                  {item.tokenId && (
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                      NFT #{item.tokenId}
                    </span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: item.colorA }} />
                  <div className="w-4 h-4 rounded" style={{ backgroundColor: item.colorB }} />
                </div>
                
                <div className="text-xs text-gray-400">
                  {formatDate(item.timestamp)}
                </div>
                
                {item.owner && (
                  <div className="text-xs text-gray-400">
                    Owner: {formatAddress(item.owner)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => onItemSelect?.(item)}
              className={`flex items-center gap-4 p-4 bg-gray-700 rounded-lg cursor-pointer transition-all hover:bg-gray-600 ${
                selectedItem?.id === item.id ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="w-16 h-16 rounded-lg flex-shrink-0"
                   style={{
                     background: `linear-gradient(135deg, ${item.colorA}, ${item.colorB})`
                   }}
              />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-medium">Seed #{item.seed}</h3>
                  {item.tokenId && (
                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded">
                      NFT
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <div className="flex gap-1">
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: item.colorA }} />
                    <div className="w-3 h-3 rounded" style={{ backgroundColor: item.colorB }} />
                  </div>
                  <span>{formatDate(item.timestamp)}</span>
                  {item.owner && (
                    <span>Owner: {formatAddress(item.owner)}</span>
                  )}
                </div>
              </div>
              
              <ExternalLink className="w-4 h-4 text-gray-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}