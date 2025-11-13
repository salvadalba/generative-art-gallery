# Generative Art NFT Contracts

Smart contracts for minting generative art as NFTs with royalty support.

## Contracts

### GenerativeArtNFT.sol
- ERC-721 implementation with metadata storage
- Prevents duplicate minting via checksum validation
- Stores generation parameters (seed, colors, IPFS hash)
- Pausable minting functionality
- Ownable for admin functions

### GenerativeArtNFTWithRoyalties.sol
- Extends GenerativeArtNFT with ERC-2981 royalty support
- Default royalties for all tokens
- Custom royalties per token
- Compatible with NFT marketplaces

## Setup

```bash
cd contracts
npm install
```

## Testing

```bash
npx hardhat test
```

## Deployment

### Local Network
```bash
npx hardhat node
npx hardhat run scripts/deploy.js --network localhost
```

### Testnet (Sepolia)
```bash
export PRIVATE_KEY=your_private_key
export SEPOLIA_RPC_URL=https://rpc.sepolia.org
npx hardhat run scripts/deploy.js --network sepolia
```

### Mainnet (Polygon)
```bash
export PRIVATE_KEY=your_private_key
export POLYGON_RPC_URL=https://polygon-rpc.com
npx hardhat run scripts/deploy.js --network polygon
```

## Environment Variables

- `PRIVATE_KEY`: Deployer wallet private key
- `SEPOLIA_RPC_URL`: Sepolia testnet RPC URL
- `POLYGON_RPC_URL`: Polygon mainnet RPC URL
- `ETHERSCAN_API_KEY`: Etherscan API key for verification
- `POLYGONSCAN_API_KEY`: Polygonscan API key for verification

## Contract Functions

### Minting
```solidity
function mintWithURI(
    address to,
    string memory tokenURI,
    uint256 seed,
    string memory colorA,
    string memory colorB,
    string memory ipfsHash,
    string memory checksum
) public returns (uint256)
```

### Royalty Functions (WithRoyalties contract)
```solidity
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
) public returns (uint256)

function royaltyInfo(uint256 tokenId, uint256 salePrice)
    external view returns (address receiver, uint256 royaltyAmount)
```

### Utility Functions
```solidity
function getGenerationParams(uint256 tokenId) public view returns (GenerationParams memory)
function artworkExists(string memory checksum) public view returns (bool)
function getTokenIdByChecksum(string memory checksum) public view returns (uint256)
```

## Security Features

- Checksum validation prevents duplicate minting
- Pausable functionality for emergency stops
- Ownable pattern for admin controls
- Input validation for all parameters
- Reentrancy protection via OpenZeppelin