#!/bin/bash
set -e

echo "Deploying smart contracts..."

# Install dependencies
npm install

# Run tests
npm test

# Deploy to network
echo "Select network:"
echo "1. Localhost"
echo "2. Goerli testnet"
echo "3. Mainnet"
echo -n "Choice: "
read NETWORK_CHOICE

case $NETWORK_CHOICE in
    1)
        NETWORK="localhost"
        ;;
    2)
        NETWORK="goerli"
        ;;
    3)
        NETWORK="mainnet"
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo "Deploying to $NETWORK..."
npx hardhat run scripts/deploy.js --network $NETWORK

echo "Contract deployment completed!"
