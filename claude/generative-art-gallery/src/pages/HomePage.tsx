import { useState, useEffect } from 'react';
import { Download, Shuffle, Palette, Settings, Wallet, Grid, Image as ImageIcon, XCircle } from 'lucide-react';
import ThreeScene from '../components/ThreeScene';
import WalletConnect from '../components/WalletConnect';
import Gallery from '../components/Gallery';
import MintFlow from '../components/MintFlow';
import { GalleryItem } from '../components/Gallery';
import { WalletState } from '../utils/wallet';

export default function HomePage() {
  const [seed, setSeed] = useState(Math.floor(Math.random() * 1000000));
  const [colorA, setColorA] = useState('#00ffff');
  const [colorB, setColorB] = useState('#ff00ff');
  const [isGenerating, setIsGenerating] = useState(false);
  const [walletState, setWalletState] = useState<WalletState | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [showMintFlow, setShowMintFlow] = useState(false);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [currentImageData, setCurrentImageData] = useState<string>('');

  // Load gallery items from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('generative-art-gallery');
    if (saved) {
      setGalleryItems(JSON.parse(saved));
    }
  }, []);

  // Save gallery items to localStorage when they change
  useEffect(() => {
    localStorage.setItem('generative-art-gallery', JSON.stringify(galleryItems));
  }, [galleryItems]);

  const handleWalletConnect = (state: WalletState) => {
    setWalletState(state);
  };

  const handleWalletDisconnect = () => {
    setWalletState(null);
  };

  const handleExport = () => {
    const canvas = document.querySelector('canvas');
    if (!canvas) return;
    
    canvas.toBlob((blob) => {
      if (!blob) return;
      
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setCurrentImageData(base64data);
        
        // Add to gallery
        const newItem: GalleryItem = {
          id: `local-${Date.now()}`,
          seed,
          colorA,
          colorB,
          ipfsHash: '', // Will be populated when uploaded to IPFS
          ipfsUrl: '',
          timestamp: Date.now(),
          imageData: base64data
        };
        
        setGalleryItems(prev => [newItem, ...prev]);
      };
      reader.readAsDataURL(blob);
      
      // Download the image
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generative-art-${seed}.png`;
      a.click();
      URL.revokeObjectURL(url);
    });
  };

  const handleRandomize = () => {
    setSeed(Math.floor(Math.random() * 1000000));
    setColorA(`#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`);
    setColorB(`#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`);
  };

  const handleMint = () => {
    if (!currentImageData) {
      alert('Please export an image first before minting');
      return;
    }
    setShowMintFlow(true);
  };

  const handleMintComplete = (tokenId: number, txHash: string) => {
    // Update the last gallery item with mint info
    setGalleryItems(prev => {
      const updated = [...prev];
      if (updated.length > 0) {
        updated[0] = {
          ...updated[0],
          tokenId,
          txHash
        };
      }
      return updated;
    });
    setShowMintFlow(false);
  };

  return (
    <div className="relative w-full min-h-screen bg-gray-900 text-white">
      <ThreeScene seed={seed} colorA={colorA} colorB={colorB} />
      
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10">
        <div className="bg-gray-800 bg-opacity-90 rounded-lg p-4 backdrop-blur-sm">
          <h1 className="text-2xl font-bold">Generative Art Gallery</h1>
          <p className="text-sm text-gray-400">Create unique art with Three.js & mint as NFTs</p>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setShowGallery(!showGallery)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              showGallery ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <WalletConnect 
            onConnect={handleWalletConnect}
            onDisconnect={handleWalletDisconnect}
          />
        </div>
      </div>
      
      {/* Control Panel */}
      <div className="absolute top-20 left-4 bg-gray-800 bg-opacity-90 rounded-lg p-4 space-y-4 w-80 backdrop-blur-sm z-10">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Controls</h2>
          <Settings className="w-5 h-5 text-gray-400" />
        </div>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Seed</label>
            <input
              type="number"
              value={seed}
              onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Palette className="w-4 h-4" />
                Color A
              </label>
              <input
                type="color"
                value={colorA}
                onChange={(e) => setColorA(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-1">
                <Palette className="w-4 h-4" />
                Color B
              </label>
              <input
                type="color"
                value={colorB}
                onChange={(e) => setColorB(e.target.value)}
                className="w-full h-10 rounded cursor-pointer"
              />
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={handleRandomize}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
          >
            <Shuffle className="w-4 h-4" />
            Randomize
          </button>
          <button
            onClick={handleExport}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>

        {walletState?.isConnected && (
          <button
            onClick={handleMint}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors"
          >
            Mint as NFT
          </button>
        )}
      </div>
      
      {/* Gallery Panel */}
      {showGallery && (
        <div className="absolute top-4 right-4 w-96 max-h-[calc(100vh-2rem)] bg-gray-800 bg-opacity-90 rounded-lg p-4 backdrop-blur-sm overflow-y-auto z-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Your Gallery</h2>
            <button
              onClick={() => setShowGallery(false)}
              className="text-gray-400 hover:text-white"
            >
              <XCircle className="w-5 h-5" />
            </button>
          </div>
          <Gallery items={galleryItems} />
        </div>
      )}
      
      {/* Mint Flow Modal */}
      {showMintFlow && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <MintFlow
              generationParams={{ seed, colorA, colorB }}
              imageData={currentImageData}
              onMintComplete={handleMintComplete}
              onClose={() => setShowMintFlow(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}