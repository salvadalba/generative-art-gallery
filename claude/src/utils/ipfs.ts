export interface GenerationParams {
  seed: number;
  colorA: string;
  colorB: string;
  timestamp: number;
  ipfsHash: string;
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  external_url: string;
  attributes: Array<{
    trait_type: string;
    value: string | number;
  }>;
  properties: {
    seed: number;
    colorA: string;
    colorB: string;
    generationTimestamp: number;
    ipfsHash: string;
  };
}

export function generateMetadata(
  params: GenerationParams,
  ipfsUrl: string,
  tokenId?: number
): NFTMetadata {
  const name = tokenId ? `Generative Art #${tokenId}` : "Generative Art";
  const description = `Unique generative artwork created with seed ${params.seed} and colors ${params.colorA} & ${params.colorB}`;
  
  return {
    name,
    description,
    image: ipfsUrl,
    external_url: `https://generativeart.gallery/artwork/${params.seed}`,
    attributes: [
      {
        trait_type: "Seed",
        value: params.seed
      },
      {
        trait_type: "Primary Color",
        value: params.colorA
      },
      {
        trait_type: "Secondary Color",
        value: params.colorB
      },
      {
        trait_type: "Generation Timestamp",
        value: new Date(params.timestamp).toISOString()
      }
    ],
    properties: {
      seed: params.seed,
      colorA: params.colorA,
      colorB: params.colorB,
      generationTimestamp: params.timestamp,
      ipfsHash: params.ipfsHash
    }
  };
}

export function uploadMetadataToIPFS(metadata: NFTMetadata): Promise<string> {
  // Mock implementation - replace with actual IPFS upload
  return new Promise((resolve) => {
    // Simulate upload delay
    setTimeout(() => {
      // Mock IPFS hash for metadata
      const mockMetadataHash = 'QmMetadataHash123456789';
      resolve(mockMetadataHash);
    }, 1000);
  });
}

export function getIPFSUrl(ipfsHash: string): string {
  return `https://ipfs.io/ipfs/${ipfsHash}`;
}

export function getIPFSCID(ipfsHash: string): string {
  return `ipfs://${ipfsHash}`;
}