// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./GenerativeArtNFT.sol";

/**
 * @title GenerativeArtNFTWithRoyalties
 * @dev ERC-721 with ERC-2981 royalties support
 */
contract GenerativeArtNFTWithRoyalties is GenerativeArtNFT {
    
    struct RoyaltyInfo {
        address receiver;
        uint96 royaltyFraction; // Basis points (10000 = 100%)
    }
    
    // Token ID => Royalty Info
    mapping(uint256 => RoyaltyInfo) private _royalties;
    
    // Default royalty for all tokens
    RoyaltyInfo private _defaultRoyalty;
    
    // Events
    event RoyaltySet(uint256 indexed tokenId, address indexed receiver, uint96 royaltyFraction);
    event DefaultRoyaltySet(address indexed receiver, uint96 royaltyFraction);
    
    constructor(
        string memory name,
        string memory symbol,
        string memory baseURI,
        address defaultRoyaltyReceiver,
        uint96 defaultRoyaltyFraction
    ) GenerativeArtNFT(name, symbol, baseURI) {
        require(defaultRoyaltyReceiver != address(0), "Invalid royalty receiver");
        require(defaultRoyaltyFraction <= 1000, "Royalty too high"); // Max 10%
        
        _defaultRoyalty = RoyaltyInfo({
            receiver: defaultRoyaltyReceiver,
            royaltyFraction: defaultRoyaltyFraction
        });
    }
    
    /**
     * @dev Mint with royalties
     */
    function mintWithRoyalties(
        address to,
        string memory tokenURI,
        uint256 seed,
        string memory colorA,
        string memory colorB,
        string memory ipfsHash,
        string memory checksum,
        address royaltyReceiver,
        uint96 royaltyFraction
    ) public whenNotPaused returns (uint256) {
        uint256 tokenId = mintWithURI(to, tokenURI, seed, colorA, colorB, ipfsHash, checksum);
        
        if (royaltyReceiver != address(0) && royaltyFraction > 0) {
            require(royaltyFraction <= 1000, "Royalty too high"); // Max 10%
            _setTokenRoyalty(tokenId, royaltyReceiver, royaltyFraction);
        }
        
        return tokenId;
    }
    
    /**
     * @dev Set royalty for a specific token
     */
    function _setTokenRoyalty(
        uint256 tokenId,
        address receiver,
        uint96 royaltyFraction
    ) internal {
        require(_exists(tokenId), "Nonexistent token");
        require(receiver != address(0), "Invalid receiver");
        
        _royalties[tokenId] = RoyaltyInfo({
            receiver: receiver,
            royaltyFraction: royaltyFraction
        });
        
        emit RoyaltySet(tokenId, receiver, royaltyFraction);
    }
    
    /**
     * @dev Set default royalty for all tokens
     */
    function setDefaultRoyalty(address receiver, uint96 royaltyFraction) external onlyOwner {
        require(receiver != address(0), "Invalid receiver");
        require(royaltyFraction <= 1000, "Royalty too high"); // Max 10%
        
        _defaultRoyalty = RoyaltyInfo({
            receiver: receiver,
            royaltyFraction: royaltyFraction
        });
        
        emit DefaultRoyaltySet(receiver, royaltyFraction);
    }
    
    /**
     * @dev Get royalty information for a token
     */
    function royaltyInfo(uint256 tokenId, uint256 salePrice)
        external
        view
        returns (address receiver, uint256 royaltyAmount)
    {
        RoyaltyInfo memory royalty = _royalties[tokenId];
        
        if (royalty.receiver == address(0)) {
            royalty = _defaultRoyalty;
        }
        
        uint256 royaltyAmount = (salePrice * royalty.royaltyFraction) / 10000;
        return (royalty.receiver, royaltyAmount);
    }
    
    /**
     * @dev Check if contract supports ERC-2981
     */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override
        returns (bool)
    {
        return interfaceId == 0x2a55205a || // ERC-2981 interface ID
               super.supportsInterface(interfaceId);
    }
}