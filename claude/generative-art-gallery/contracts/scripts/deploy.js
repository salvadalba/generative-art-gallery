const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await deployer.getBalance()).toString());

  // Deploy base NFT contract
  const GenerativeArtNFT = await ethers.getContractFactory("GenerativeArtNFT");
  const nft = await GenerativeArtNFT.deploy(
    "Generative Art Gallery",
    "GART",
    "https://api.generativeart.gallery/metadata/"
  );
  
  await nft.deployed();
  console.log("GenerativeArtNFT deployed to:", nft.address);

  // Deploy NFT contract with royalties
  const GenerativeArtNFTWithRoyalties = await ethers.getContractFactory("GenerativeArtNFTWithRoyalties");
  const nftWithRoyalties = await GenerativeArtNFTWithRoyalties.deploy(
    "Generative Art Gallery (Royalty)",
    "GARTR",
    "https://api.generativeart.gallery/metadata/",
    deployer.address, // default royalty receiver
    250 // 2.5% royalty
  );
  
  await nftWithRoyalties.deployed();
  console.log("GenerativeArtNFTWithRoyalties deployed to:", nftWithRoyalties.address);

  // Save deployment info
  const deploymentInfo = {
    network: network.name,
    chainId: network.config.chainId,
    contracts: {
      GenerativeArtNFT: {
        address: nft.address,
        abi: GenerativeArtNFT.interface.format("json")
      },
      GenerativeArtNFTWithRoyalties: {
        address: nftWithRoyalties.address,
        abi: GenerativeArtNFTWithRoyalties.interface.format("json")
      }
    },
    deployer: deployer.address,
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync(
    `deployment-${network.name}-${Date.now()}.json`,
    JSON.stringify(deploymentInfo, null, 2)
  );

  console.log("Deployment completed successfully!");
  console.log("Deployment info saved to deployment file");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });