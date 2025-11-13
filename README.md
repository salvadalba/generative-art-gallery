# Generative Art Gallery

**Deployment**

[Live Demo](https://traeclaudekq1e.vercel.app)

Production build of the Generative Art Gallery showcasing Three.js rendering, parameter controls, gallery management, and PNG export. The link is kept up to date and reflects the current production deployment; if the deployment changes, this section will be updated accordingly.

A comprehensive web application that creates unique generative art pieces using Three.js and GANs, allows user customization, and mints artworks as NFTs.

## Features

- **Three.js Generative Art**: Real-time procedural art generation with customizable parameters
- **GAN Integration**: AI-powered art generation with deterministic seeding
- **NFT Minting**: Complete ERC-721 implementation with metadata storage
- **Wallet Integration**: MetaMask support with network switching
- **IPFS Storage**: Decentralized storage for artwork images and metadata
- **Gallery System**: Local and on-chain artwork management
- **Export Functionality**: PNG export with high-quality rendering

## Architecture

### Frontend (React + Three.js)
- **Three.js Scene**: WebGL-based 3D rendering with custom shaders
- **Parameter Controls**: Real-time art customization (seed, colors, effects)
- **Wallet Integration**: MetaMask connection and transaction handling
- **Gallery Management**: Local storage and NFT display
- **Export System**: Canvas-to-PNG conversion

### Backend (FastAPI + PyTorch)
- **GAN Service**: AI art generation with StyleGAN architecture
- **Deterministic Seeding**: Reproducible artwork generation
- **REST API**: `/generate` endpoint with queue management
- **GPU Support**: CUDA acceleration with CPU fallback

### Smart Contracts (Solidity)
- **ERC-721 Implementation**: Standard NFT functionality
- **Royalty Support**: ERC-2981 compatible for marketplaces
- **Duplicate Prevention**: Checksum-based artwork validation
- **Metadata Storage**: On-chain generation parameters

## Quick Start

### Prerequisites
- Node.js 18+
- Python 3.10+
- MetaMask browser extension

### Frontend Setup
```bash
cd generative-art-gallery
npm install
npm run dev
```

### Backend Setup
```bash
cd gan-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

### Contract Setup
```bash
cd contracts
npm install
npx hardhat compile
npx hardhat test
```

## Usage

1. **Generate Art**: Adjust parameters (seed, colors) and see real-time updates
2. **Export Image**: Download PNG or add to local gallery
3. **Connect Wallet**: Use MetaMask to connect your wallet
4. **Mint NFT**: Upload to IPFS and mint on supported networks
5. **View Gallery**: Browse local and minted artworks

## Configuration

### Environment Variables
```bash
# Frontend
VITE_GAN_API_URL=http://localhost:8000
VITE_IPFS_GATEWAY=https://ipfs.io/ipfs/

# Backend
GAN_MODEL_PATH=./models/stylegan.pt
MAX_RESOLUTION=1024
RATE_LIMIT=10

# Contracts
PRIVATE_KEY=your_private_key
SEPOLIA_RPC_URL=https://rpc.sepolia.org
POLYGON_RPC_URL=https://polygon-rpc.com
ETHERSCAN_API_KEY=your_api_key
```

### Supported Networks
- Ethereum Mainnet
- Polygon Mainnet
- Sepolia Testnet
- Polygon Amoy Testnet

## API Reference

### GAN Service
```http
POST /generate
Content-Type: application/json

{
  "seed": 12345,
  "resolution": 512,
  "style": "abstract"
}
```

### Contract Functions
```solidity
function mintWithURI(
    address to,
    string tokenURI,
    uint256 seed,
    string colorA,
    string colorB,
    string ipfsHash,
    string checksum
) public returns (uint256)
```

## Development

### Testing
```bash
# Frontend tests
npm run test

# Contract tests
npx hardhat test

# Backend tests
pytest test_main.py
```

### Deployment
```bash
# Frontend
npm run build
npm run preview

# Contracts
npx hardhat run scripts/deploy.js --network sepolia

# Backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Security Features

- **Input Validation**: All parameters validated before processing
- **Checksum Verification**: Prevents duplicate minting
- **Rate Limiting**: API protection against abuse
- **CORS Configuration**: Secure cross-origin requests
- **Contract Security**: OpenZeppelin battle-tested contracts

## Performance

- **60 FPS Rendering**: Optimized Three.js scene
- **GPU Acceleration**: CUDA support for GAN inference
- **Lazy Loading**: Efficient asset management
- **Caching**: IPFS gateway optimization

## Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new features
4. Submit pull request

## License

MIT License - see LICENSE file for details

## Support

- Documentation: `/docs`
- Issues: GitHub Issues
- Discord: [Join our community]
- Email: support@generativeart.gallery
