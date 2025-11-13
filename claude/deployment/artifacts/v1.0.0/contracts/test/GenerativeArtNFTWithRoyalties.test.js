const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GenerativeArtNFTWithRoyalties", function () {
  let nft;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    const GenerativeArtNFTWithRoyalties = await ethers.getContractFactory("GenerativeArtNFTWithRoyalties");
    [owner, addr1, addr2] = await ethers.getSigners();
    
    nft = await GenerativeArtNFTWithRoyalties.deploy(
      "Generative Art Gallery",
      "GART",
      "https://api.generativeart.gallery/metadata/",
      addr1.address, // default royalty receiver
      250 // 2.5% royalty (250 basis points)
    );
    await nft.deployed();
  });

  describe("Deployment", function () {
    it("Should set default royalty", async function () {
      const salePrice = ethers.utils.parseEther("1.0");
      const [receiver, royaltyAmount] = await nft.royaltyInfo(0, salePrice);
      
      expect(receiver).to.equal(addr1.address);
      expect(royaltyAmount).to.equal(salePrice.mul(250).div(10000)); // 2.5%
    });
  });

  describe("Minting with Royalties", function () {
    it("Should mint with custom royalties", async function () {
      const tokenURI = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const seed = 12345;
      const colorA = "#FF0000";
      const colorB = "#00FF00";
      const ipfsHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const checksum = "abc123def456";
      const customRoyaltyReceiver = addr2.address;
      const customRoyaltyFraction = 500; // 5%

      await nft.mintWithRoyalties(
        addr1.address,
        tokenURI,
        seed,
        colorA,
        colorB,
        ipfsHash,
        checksum,
        customRoyaltyReceiver,
        customRoyaltyFraction
      );

      const salePrice = ethers.utils.parseEther("1.0");
      const [receiver, royaltyAmount] = await nft.royaltyInfo(0, salePrice);
      
      expect(receiver).to.equal(customRoyaltyReceiver);
      expect(royaltyAmount).to.equal(salePrice.mul(customRoyaltyFraction).div(10000)); // 5%
    });

    it("Should use default royalty if not specified", async function () {
      const tokenURI = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const seed = 12345;
      const colorA = "#FF0000";
      const colorB = "#00FF00";
      const ipfsHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const checksum = "abc123def456";

      // Mint without custom royalties
      await nft.mintWithURI(
        addr1.address,
        tokenURI,
        seed,
        colorA,
        colorB,
        ipfsHash,
        checksum
      );

      const salePrice = ethers.utils.parseEther("1.0");
      const [receiver, royaltyAmount] = await nft.royaltyInfo(0, salePrice);
      
      expect(receiver).to.equal(addr1.address); // default receiver
      expect(royaltyAmount).to.equal(salePrice.mul(250).div(10000)); // 2.5%
    });

    it("Should enforce royalty limits", async function () {
      const tokenURI = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const seed = 12345;
      const colorA = "#FF0000";
      const colorB = "#00FF00";
      const ipfsHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const checksum = "abc123def456";

      await expect(
        nft.mintWithRoyalties(
          addr1.address,
          tokenURI,
          seed,
          colorA,
          colorB,
          ipfsHash,
          checksum,
          addr2.address,
          1001 // > 10%
        )
      ).to.be.revertedWith("Royalty too high");
    });

    it("Should allow owner to update default royalty", async function () {
      const newReceiver = addr2.address;
      const newRoyalty = 300; // 3%

      await nft.setDefaultRoyalty(newReceiver, newRoyalty);

      const salePrice = ethers.utils.parseEther("1.0");
      const [receiver, royaltyAmount] = await nft.royaltyInfo(0, salePrice);
      
      expect(receiver).to.equal(newReceiver);
      expect(royaltyAmount).to.equal(salePrice.mul(newRoyalty).div(10000)); // 3%
    });
  });

  describe("ERC-2981 Support", function () {
    it("Should support ERC-2981 interface", async function () {
      const ERC2981_INTERFACE_ID = "0x2a55205a";
      expect(await nft.supportsInterface(ERC2981_INTERFACE_ID)).to.be.true;
    });
  });
});