import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { walletManager, WalletState } from '../utils/wallet';
import { NFTContract, generateChecksum, formatTokenURI } from '../utils/nftContract';
import { generateMetadata, uploadMetadataToIPFS } from '../utils/ipfs';
import { CheckCircle, XCircle, Loader, ExternalLink } from 'lucide-react';

interface MintFlowProps {
  generationParams: {
    seed: number;
    colorA: string;
    colorB: string;
  };
  imageData: string; // Base64 image data
  onMintComplete?: (tokenId: number, txHash: string) => void;
  onClose?: () => void;
}

interface MintState {
  status: 'idle' | 'uploading' | 'minting' | 'success' | 'error';
  error?: string;
  tokenId?: number;
  txHash?: string;
  ipfsHash?: string;
  metadataHash?: string;
}

export default function MintFlow({ generationParams, imageData, onMintComplete, onClose }: MintFlowProps) {
  const [walletState, setWalletState] = useState<WalletState>(walletManager.getState());
  const [mintState, setMintState] = useState<MintState>({ status: 'idle' });
  const [contractAddress, setContractAddress] = useState<string>('');

  useEffect(() => {
    const handleWalletUpdate = (state: WalletState) => {
      setWalletState(state);
    };

    walletManager.on('connected', handleWalletUpdate);
    walletManager.on('disconnected', handleWalletUpdate);
    walletManager.on('accountsChanged', handleWalletUpdate);

    return () => {
      walletManager.off('connected', handleWalletUpdate);
      walletManager.off('disconnected', handleWalletUpdate);
      walletManager.off('accountsChanged', handleWalletUpdate);
    };
  }, []);

  const handleMint = async () => {
    if (!walletState.isConnected || !walletState.signer) {
      alert('Please connect your wallet first');
      return;
    }

    if (!contractAddress) {
      alert('Please enter the NFT contract address');
      return;
    }

    try {
      setMintState({ status: 'uploading' });

      // Step 1: Generate checksum
      const checksum = generateChecksum(imageData);

      // Step 2: Check if artwork already exists
      const nftContract = NFTContract.generativeArtNFT(contractAddress, walletState.signer);
      const exists = await nftContract.artworkExists(checksum);
      
      if (exists) {
        const existingTokenId = await nftContract.getTokenIdByChecksum(checksum);
        setMintState({
          status: 'error',
          error: `This artwork has already been minted as NFT #${existingTokenId}`
        });
        return;
      }

      // Step 3: Upload image to IPFS (mock implementation)
      const ipfsHash = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco'; // Mock IPFS hash
      const tokenURI = formatTokenURI(ipfsHash);

      // Step 4: Upload metadata to IPFS
      setMintState({ status: 'uploading', ipfsHash });
      
      const metadata = generateMetadata(
        {
          seed: generationParams.seed,
          colorA: generationParams.colorA,
          colorB: generationParams.colorB,
          timestamp: Date.now(),
          ipfsHash
        },
        `https://ipfs.io/ipfs/${ipfsHash}`
      );

      const metadataHash = await uploadMetadataToIPFS(metadata);
      const metadataURI = formatTokenURI(metadataHash);

      // Step 5: Mint NFT
      setMintState({ status: 'minting', ipfsHash, metadataHash });

      const tx = await nftContract.mint({
        to: walletState.address!,
        tokenURI: metadataURI,
        seed: generationParams.seed,
        colorA: generationParams.colorA,
        colorB: generationParams.colorB,
        ipfsHash,
        checksum
      });

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Find the ArtworkMinted event
      const mintEvent = receipt?.logs?.find((log: any) => log.event === 'ArtworkMinted');
      const tokenId = mintEvent?.args?.tokenId;

      if (tokenId !== undefined) {
        setMintState({
          status: 'success',
          tokenId,
          txHash: receipt.transactionHash,
          ipfsHash,
          metadataHash
        });

        if (onMintComplete) {
          onMintComplete(tokenId, receipt.transactionHash);
        }
      } else {
        throw new Error('Token ID not found in transaction receipt');
      }

    } catch (error: any) {
      console.error('Mint error:', error);
      setMintState({
        status: 'error',
        error: error.message || 'Minting failed'
      });
    }
  };

  const getExplorerUrl = (txHash: string) => {
    const network = walletState.chainId;
    switch (network) {
      case 1: // Ethereum Mainnet
        return `https://etherscan.io/tx/${txHash}`;
      case 137: // Polygon
        return `https://polygonscan.com/tx/${txHash}`;
      case 11155111: // Sepolia
        return `https://sepolia.etherscan.io/tx/${txHash}`;
      case 80002: // Polygon Amoy
        return `https://amoy.polygonscan.com/tx/${txHash}`;
      default:
        return null;
    }
  };

  if (!walletState.isConnected) {
    return (
      <div className="bg-gray-800 rounded-lg p-6 text-center">
        <h3 className="text-lg font-medium mb-4">Connect Wallet to Mint</h3>
        <p className="text-gray-400 mb-4">
          Please connect your wallet to mint this artwork as an NFT
        </p>
        <button
          onClick={() => walletManager.connect()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium">Mint NFT</h3>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <XCircle className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Contract Address Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-2">
          NFT Contract Address
        </label>
        <input
          type="text"
          value={contractAddress}
          onChange={(e) => setContractAddress(e.target.value)}
          placeholder="0x..."
          className="w-full px-3 py-2 bg-gray-700 rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
        />
      </div>

      {/* Preview */}
      <div className="mb-4 p-4 bg-gray-700 rounded-lg">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-lg flex-shrink-0"
               style={{
                 background: `linear-gradient(135deg, ${generationParams.colorA}, ${generationParams.colorB})`
               }}
          />
          <div className="flex-1">
            <p className="font-medium">Seed #{generationParams.seed}</p>
            <div className="flex gap-1 mt-1">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: generationParams.colorA }} />
              <div className="w-3 h-3 rounded" style={{ backgroundColor: generationParams.colorB }} />
            </div>
          </div>
        </div>
      </div>

      {/* Status */}
      {mintState.status !== 'idle' && (
        <div className="mb-4">
          {mintState.status === 'uploading' && (
            <div className="flex items-center gap-2 text-blue-400">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Uploading to IPFS...</span>
            </div>
          )}
          
          {mintState.status === 'minting' && (
            <div className="flex items-center gap-2 text-yellow-400">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Minting NFT...</span>
            </div>
          )}
          
          {mintState.status === 'success' && (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span>Successfully minted NFT #{mintState.tokenId}</span>
            </div>
          )}
          
          {mintState.status === 'error' && (
            <div className="flex items-center gap-2 text-red-400">
              <XCircle className="w-4 h-4" />
              <span>{mintState.error}</span>
            </div>
          )}
        </div>
      )}

      {/* Transaction Link */}
      {mintState.txHash && (
        <div className="mb-4">
          <a
            href={getExplorerUrl(mintState.txHash) || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300"
          >
            <ExternalLink className="w-4 h-4" />
            View on Block Explorer
          </a>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2">
        {mintState.status === 'idle' && (
          <button
            onClick={handleMint}
            className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
          >
            Mint NFT
          </button>
        )}
        
        {mintState.status === 'success' && (
          <button
            onClick={() => setMintState({ status: 'idle' })}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Mint Another
          </button>
        )}
        
        {mintState.status === 'error' && (
          <button
            onClick={() => setMintState({ status: 'idle' })}
            className="flex-1 px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}