import { describe, it, expect } from 'vitest';
import { generateMetadata, uploadMetadataToIPFS, getIPFSUrl, getIPFSCID } from '../ipfs';

describe('IPFS Utils', () => {
  describe('generateMetadata', () => {
    it('generates correct metadata structure', () => {
      const params = {
        seed: 12345,
        colorA: '#FF0000',
        colorB: '#00FF00',
        timestamp: 1640995200000, // Jan 1, 2022
        ipfsHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco'
      };
      
      const ipfsUrl = 'https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
      const metadata = generateMetadata(params, ipfsUrl);
      
      expect(metadata.name).toBe('Generative Art');
      expect(metadata.description).toContain('seed 12345');
      expect(metadata.image).toBe(ipfsUrl);
      expect(metadata.external_url).toBe('https://generativeart.gallery/artwork/12345');
      expect(metadata.attributes).toHaveLength(4);
      expect(metadata.properties.seed).toBe(12345);
      expect(metadata.properties.colorA).toBe('#FF0000');
      expect(metadata.properties.colorB).toBe('#00FF00');
    });

    it('generates metadata with token ID', () => {
      const params = {
        seed: 12345,
        colorA: '#FF0000',
        colorB: '#00FF00',
        timestamp: 1640995200000,
        ipfsHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco'
      };
      
      const ipfsUrl = 'https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
      const metadata = generateMetadata(params, ipfsUrl, 42);
      
      expect(metadata.name).toBe('Generative Art #42');
    });

    it('includes correct attributes', () => {
      const params = {
        seed: 12345,
        colorA: '#FF0000',
        colorB: '#00FF00',
        timestamp: 1640995200000,
        ipfsHash: 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco'
      };
      
      const ipfsUrl = 'https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
      const metadata = generateMetadata(params, ipfsUrl);
      
      const seedAttr = metadata.attributes.find(attr => attr.trait_type === 'Seed');
      expect(seedAttr?.value).toBe(12345);
      
      const colorAAttr = metadata.attributes.find(attr => attr.trait_type === 'Primary Color');
      expect(colorAAttr?.value).toBe('#FF0000');
      
      const colorBAttr = metadata.attributes.find(attr => attr.trait_type === 'Secondary Color');
      expect(colorBAttr?.value).toBe('#00FF00');
    });
  });

  describe('uploadMetadataToIPFS', () => {
    it('returns mock IPFS hash', async () => {
      const metadata = {
        name: 'Test Art',
        description: 'Test description',
        image: 'https://ipfs.io/ipfs/test',
        external_url: 'https://test.com',
        attributes: [],
        properties: {
          seed: 123,
          colorA: '#FF0000',
          colorB: '#00FF00',
          generationTimestamp: 1640995200000,
          ipfsHash: 'QmTest'
        }
      };
      
      const hash = await uploadMetadataToIPFS(metadata);
      
      expect(hash).toBe('QmMetadataHash123456789');
    });

    it('handles upload delay', async () => {
      const metadata = {
        name: 'Test Art',
        description: 'Test description',
        image: 'https://ipfs.io/ipfs/test',
        external_url: 'https://test.com',
        attributes: [],
        properties: {
          seed: 123,
          colorA: '#FF0000',
          colorB: '#00FF00',
          generationTimestamp: 1640995200000,
          ipfsHash: 'QmTest'
        }
      };
      
      const startTime = Date.now();
      const hash = await uploadMetadataToIPFS(metadata);
      const endTime = Date.now();
      
      expect(hash).toBe('QmMetadataHash123456789');
      expect(endTime - startTime).toBeGreaterThanOrEqual(1000); // Should take at least 1 second
    });
  });

  describe('getIPFSUrl', () => {
    it('formats IPFS hash as gateway URL', () => {
      const ipfsHash = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
      const url = getIPFSUrl(ipfsHash);
      
      expect(url).toBe('https://ipfs.io/ipfs/QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco');
    });
  });

  describe('getIPFSCID', () => {
    it('formats IPFS hash as CID', () => {
      const ipfsHash = 'QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco';
      const cid = getIPFSCID(ipfsHash);
      
      expect(cid).toBe('ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco');
    });
  });
});