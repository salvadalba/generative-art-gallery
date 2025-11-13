import { ethers, Contract } from 'ethers';

// Contract ABIs (these should be imported from your contract artifacts)
const GENERATIVE_ART_NFT_ABI = [
  "function mintWithURI(address to, string tokenURI, uint256 seed, string colorA, string colorB, string ipfsHash, string checksum) public returns (uint256)",
  "function getGenerationParams(uint256 tokenId) public view returns (uint256 seed, string colorA, string colorB, uint256 timestamp, string ipfsHash)",
  "function artworkExists(string checksum) public view returns (bool)",
  "function getTokenIdByChecksum(string checksum) public view returns (uint256)",
  "function tokenURI(uint256 tokenId) public view returns (string)",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "event ArtworkMinted(uint256 indexed tokenId, address indexed artist, uint256 seed, string colorA, string colorB, string ipfsHash)"
];

const GENERATIVE_ART_NFT_WITH_ROYALTIES_ABI = [
  ...GENERATIVE_ART_NFT_ABI,
  "function mintWithRoyalties(address to, string tokenURI, uint256 seed, string colorA, string colorB, string ipfsHash, string checksum, address royaltyReceiver, uint96 royaltyFraction) public returns (uint256)",
  "function royaltyInfo(uint256 tokenId, uint256 salePrice) external view returns (address receiver, uint256 royaltyAmount)"
];

export interface MintParams {
  to: string;
  tokenURI: string;
  seed: number;
  colorA: string;
  colorB: string;
  ipfsHash: string;
  checksum: string;
}

export interface MintWithRoyaltiesParams extends MintParams {
  royaltyReceiver: string;
  royaltyFraction: number; // Basis points (10000 = 100%)
}

export class NFTContract {
  private contract: Contract;
  private signer: any;

  constructor(address: string, abi: string[], provider: any) {
    this.contract = new Contract(address, abi, provider);
    this.signer = this.contract.runner;
  }

  static generativeArtNFT(address: string, provider: any) {
    return new NFTContract(address, GENERATIVE_ART_NFT_ABI, provider);
  }

  static generativeArtNFTWithRoyalties(address: string, provider: any) {
    return new NFTContract(address, GENERATIVE_ART_NFT_WITH_ROYALTIES_ABI, provider);
  }

  async mint(params: MintParams): Promise<any> {
    if (!this.signer) {
      throw new Error('Signer required for minting');
    }

    const connectedContract = this.contract.connect(this.signer);
    const tx = await (connectedContract as any).mintWithURI(
      params.to,
      params.tokenURI,
      params.seed,
      params.colorA,
      params.colorB,
      params.ipfsHash,
      params.checksum
    );

    return tx;
  }

  async mintWithRoyalties(params: MintWithRoyaltiesParams): Promise<any> {
    if (!this.signer) {
      throw new Error('Signer required for minting');
    }

    const connectedContract = this.contract.connect(this.signer);
    const tx = await (connectedContract as any).mintWithRoyalties(
      params.to,
      params.tokenURI,
      params.seed,
      params.colorA,
      params.colorB,
      params.ipfsHash,
      params.checksum,
      params.royaltyReceiver,
      params.royaltyFraction
    );

    return tx;
  }

  async getGenerationParams(tokenId: number): Promise<any> {
    return await this.contract.getGenerationParams(tokenId);
  }

  async artworkExists(checksum: string): Promise<boolean> {
    return await this.contract.artworkExists(checksum);
  }

  async getTokenIdByChecksum(checksum: string): Promise<number> {
    const tokenId = await this.contract.getTokenIdByChecksum(checksum);
    return tokenId.toNumber();
  }

  async tokenURI(tokenId: number): Promise<string> {
    return await this.contract.tokenURI(tokenId);
  }

  async ownerOf(tokenId: number): Promise<string> {
    return await this.contract.ownerOf(tokenId);
  }

  async royaltyInfo(tokenId: number, salePrice: any): Promise<[string, any]> {
    return await this.contract.royaltyInfo(tokenId, salePrice);
  }

  get address(): string {
    return this.contract.target as string;
  }
}

export function generateChecksum(imageData: string): string {
  // Simple checksum generation (replace with proper hash function)
  return ethers.keccak256(ethers.toUtf8Bytes(imageData)).slice(2, 18);
}

export function formatTokenURI(ipfsHash: string): string {
  return `ipfs://${ipfsHash}`;
}