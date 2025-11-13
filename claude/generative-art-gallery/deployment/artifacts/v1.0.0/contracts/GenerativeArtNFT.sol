// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title GenerativeArtNFT
 * @dev ERC-721 contract for minting generative art as NFTs
 */
contract GenerativeArtNFT is ERC721, ERC721Enumerable, ERC721URIStorage, Ownable, Pausable, ERC721Burnable {
    using Counters for Counters.Counter;
    
    Counters.Counter private _tokenIdCounter;
    
    // Base URI for token metadata
    string private _baseTokenURI;
    
    // Mapping from token ID to generation parameters
    mapping(uint256 => GenerationParams) private _generationParams;
    
    // Mapping from checksum to token ID (prevents duplicate mints)
    mapping(string => uint256) private _checksumToTokenId;
    
    struct GenerationParams {
        uint256 seed;
        string colorA;
        string colorB;
        uint256 timestamp;
        string ipfsHash;
    }
    
    // Events
    event ArtworkMinted(
        uint256 indexed tokenId,
        address indexed artist,
        uint256 seed,
        string colorA,
        string colorB,
        string ipfsHash
    );
    
    event BaseURIUpdated(string newBaseURI);
    
    constructor(string memory name, string memory symbol, string memory baseURI) 
        ERC721(name, symbol) 
        Ownable()
    {
        _baseTokenURI = baseURI;
    }
    
    /**
     * @dev Mint a new generative art NFT
     * @param to Address to mint the NFT to
     * @param tokenURI Metadata URI for the token
     * @param seed Generation seed
     * @param colorA Primary color
     * @param colorB Secondary color
     * @param ipfsHash IPFS hash of the generated image
     * @param checksum Checksum of the generated image (prevents duplicates)
     */
    function mintWithURI(
        address to,
        string memory tokenURI,
        uint256 seed,
        string memory colorA,
        string memory colorB,
        string memory ipfsHash,
        string memory checksum
    ) public whenNotPaused returns (uint256) {
        require(to != address(0), "GenerativeArtNFT: mint to zero address");
        require(bytes(tokenURI).length > 0, "GenerativeArtNFT: empty token URI");
        require(bytes(checksum).length > 0, "GenerativeArtNFT: empty checksum");
        require(_checksumToTokenId[checksum] == 0, "GenerativeArtNFT: artwork already minted");
        
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, tokenURI);
        
        // Store generation parameters
        _generationParams[tokenId] = GenerationParams({
            seed: seed,
            colorA: colorA,
            colorB: colorB,
            timestamp: block.timestamp,
            ipfsHash: ipfsHash
        });
        
        // Store checksum mapping
        _checksumToTokenId[checksum] = tokenId;
        
        emit ArtworkMinted(tokenId, to, seed, colorA, colorB, ipfsHash);
        
        return tokenId;
    }
    
    /**
     * @dev Get generation parameters for a token
     */
    function getGenerationParams(uint256 tokenId) 
        public 
        view 
        returns (GenerationParams memory) 
    {
        require(_exists(tokenId), "GenerativeArtNFT: query for nonexistent token");
        return _generationParams[tokenId];
    }
    
    /**
     * @dev Check if an artwork with given checksum exists
     */
    function artworkExists(string memory checksum) public view returns (bool) {
        return _checksumToTokenId[checksum] != 0;
    }
    
    /**
     * @dev Get token ID by checksum
     */
    function getTokenIdByChecksum(string memory checksum) public view returns (uint256) {
        return _checksumToTokenId[checksum];
    }
    
    /**
     * @dev Set base URI for all tokens
     */
    function setBaseURI(string memory baseURI) public onlyOwner {
        _baseTokenURI = baseURI;
        emit BaseURIUpdated(baseURI);
    }
    
    /**
     * @dev Get base URI
     */
    function baseURI() public view returns (string memory) {
        return _baseTokenURI;
    }
    
    /**
     * @dev Pause all token transfers
     */
    function pause() public onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause all token transfers
     */
    function unpause() public onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Override supportsInterface
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
    
    /**
     * @dev Override _beforeTokenTransfer for enumerable and pausable
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId,
        uint256 batchSize
    ) internal override(ERC721, ERC721Enumerable) whenNotPaused {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }
    
    /**
     * @dev Override _burn for URI storage
     */
    function _burn(uint256 tokenId) internal override(ERC721, ERC721URIStorage) {
        super._burn(tokenId);
    }
    
    /**
     * @dev Override tokenURI
     */
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
    
    /**
     * @dev Override _baseURI
     */
    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }
}