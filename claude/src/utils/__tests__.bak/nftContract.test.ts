import { describe, it, expect } from 'vitest';
import { generateChecksum, formatTokenURI, NFTContract } from '../utils/nftContract';
import { ethers } from 'ethers';

describe('NFT Contract Utils', () => {
  describe('generateChecksum', () => {
    it('generates consistent checksum for same input', () => {
      const data = 'test image data';
      const checksum1 = generateChecksum(data);
      const checksum2 = generateChecksum(data);
      
      expect(checksum1).toBe(checksum2);
    });

    it('generates different checksum for different inputs', () => {
      const data1 = 'test image data 1';
      const data2 = 'test image data 2';
      
      const checksum1 = generateChecksum(data1);
      const checksum2 = generateChecksum(data2);
      
      expect(checksum1).not.toBe(checksum2);
    });

    it('generates valid hex string', () => {
      const data = 'test image data';
      const checksum = generateChecksum(data);
      
      expect(checksum).toMatch(/^[0-9a-f]{16}$/);
    });
  });

  describe('formatTokenURI', () => {
    it('formats IPFS hash as token URI', () => {
      const ipfsHash = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
      const tokenURI = formatTokenURI(ipfsHash);
      
      expect(tokenURI).toBe('ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco');
    });
  });

  describe('NFTContract', () => {
    it('creates contract instance with correct ABI', () => {
      const mockProvider = {} as ethers.Provider;
      const address = '0x1234567890123456789012345678901234567890';
      
      const contract = NFTContract.generativeArtNFT(address, mockProvider);
      
      expect(contract.address).toBe(address);
      expect(contract).toBeDefined();
    });

    it('creates contract with royalties', () => {
      const mockProvider = {} as ethers.Provider;
      const address = '0x1234567890123456789012345678901234567890';
      
      const contract = NFTContract.generativeArtNFTWithRoyalties(address, mockProvider);
      
      expect(contract.address).toBe(address);
      expect(contract).toBeDefined();
    });
  });
});