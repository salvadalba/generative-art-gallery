import { useState } from 'react';
import { Upload, Image as ImageIcon } from 'lucide-react';

interface IPFSUploadProps {
  onUploadComplete: (ipfsHash: string, ipfsUrl: string) => void;
  onError: (error: string) => void;
}

export default function IPFSUpload({ onUploadComplete, onError }: IPFSUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadToIPFS = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate IPFS upload (replace with actual IPFS service)
      // In production, use web3.storage, nft.storage, or Pinata
      
      const formData = new FormData();
      formData.append('file', file);
      
      // Simulate upload progress
      for (let i = 0; i <= 100; i += 10) {
        setUploadProgress(i);
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Mock IPFS hash (in production, get from actual IPFS service)
      const mockIpfsHash = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
      const mockIpfsUrl = `https://ipfs.io/ipfs/${mockIpfsHash}`;
      
      onUploadComplete(mockIpfsHash, mockIpfsUrl);
      
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      onError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      onError('File size must be less than 10MB');
      return;
    }

    uploadToIPFS(file);
  };

  return (
    <div className="w-full">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <ImageIcon className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        
        {isUploading ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">Uploading to IPFS...</p>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500">{uploadProgress}%</p>
          </div>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-2">
              Drop your image here or click to browse
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Supports PNG, JPG, GIF up to 10MB
            </p>
            <label className="cursor-pointer">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                <Upload className="w-4 h-4" />
                Select Image
              </div>
            </label>
          </>
        )}
      </div>
      
      <div className="mt-4 text-xs text-gray-500">
        <p>Note: This is a demo implementation. In production, integrate with:</p>
        <ul className="list-disc list-inside mt-1 space-y-1">
          <li>web3.storage (free IPFS + Filecoin)</li>
          <li>nft.storage (optimized for NFTs)</li>
          <li>Pinata (managed IPFS service)</li>
        </ul>
      </div>
    </div>
  );
}