const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("GenerativeArtNFT", function () {
  let GenerativeArtNFT;
  let nft;
  let owner;
  let addr1;
  let addr2;
  let addrs;

  beforeEach(async function () {
    GenerativeArtNFT = await ethers.getContractFactory("GenerativeArtNFT");
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();
    
    nft = await GenerativeArtNFT.deploy(
      "Generative Art Gallery",
      "GART",
      "https://api.generativeart.gallery/metadata/"
    );
    await nft.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right name and symbol", async function () {
      expect(await nft.name()).to.equal("Generative Art Gallery");
      expect(await nft.symbol()).to.equal("GART");
    });

    it("Should set the right owner", async function () {
      expect(await nft.owner()).to.equal(owner.address);
    });

    it("Should set the base URI", async function () {
      expect(await nft.baseURI()).to.equal("https://api.generativeart.gallery/metadata/");
    });
  });

  describe("Minting", function () {
    it("Should mint a new token", async function () {
      const tokenURI = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const seed = 12345;
      const colorA = "#FF0000";
      const colorB = "#00FF00";
      const ipfsHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const checksum = "abc123def456";

      await expect(
        nft.mintWithURI(
          addr1.address,
          tokenURI,
          seed,
          colorA,
          colorB,
          ipfsHash,
          checksum
        )
      ).to.emit(nft, "ArtworkMinted")
       .withArgs(0, addr1.address, seed, colorA, colorB, ipfsHash);

      expect(await nft.ownerOf(0)).to.equal(addr1.address);
      expect(await nft.tokenURI(0)).to.equal(tokenURI);
    });

    it("Should prevent duplicate minting", async function () {
      const tokenURI = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const seed = 12345;
      const colorA = "#FF0000";
      const colorB = "#00FF00";
      const ipfsHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const checksum = "abc123def456";

      // Mint first token
      await nft.mintWithURI(
        addr1.address,
        tokenURI,
        seed,
        colorA,
        colorB,
        ipfsHash,
        checksum
      );

      // Try to mint with same checksum
      await expect(
        nft.mintWithURI(
          addr2.address,
          tokenURI,
          seed + 1, // Different seed
          colorA,
          colorB,
          ipfsHash,
          checksum // Same checksum
        )
      ).to.be.revertedWith("GenerativeArtNFT: artwork already minted");
    });

    it("Should store generation parameters", async function () {
      const tokenURI = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const seed = 12345;
      const colorA = "#FF0000";
      const colorB = "#00FF00";
      const ipfsHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const checksum = "abc123def456";

      await nft.mintWithURI(
        addr1.address,
        tokenURI,
        seed,
        colorA,
        colorB,
        ipfsHash,
        checksum
      );

      const params = await nft.getGenerationParams(0);
      expect(params.seed).to.equal(seed);
      expect(params.colorA).to.equal(colorA);
      expect(params.colorB).to.equal(colorB);
      expect(params.ipfsHash).to.equal(ipfsHash);
      expect(params.timestamp).to.be.gt(0);
    });

    it("Should check artwork existence", async function () {
      const tokenURI = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const seed = 12345;
      const colorA = "#FF0000";
      const colorB = "#00FF00";
      const ipfsHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const checksum = "abc123def456";

      expect(await nft.artworkExists(checksum)).to.be.false;

      await nft.mintWithURI(
        addr1.address,
        tokenURI,
        seed,
        colorA,
        colorB,
        ipfsHash,
        checksum
      );

      expect(await nft.artworkExists(checksum)).to.be.true;
      expect(await nft.getTokenIdByChecksum(checksum)).to.equal(0);
    });
  });

  describe("Access Control", function () {
    it("Should allow only owner to pause", async function () {
      await nft.pause();
      expect(await nft.paused()).to.be.true;

      await nft.unpause();
      expect(await nft.paused()).to.be.false;
    });

    it("Should prevent minting when paused", async function () {
      await nft.pause();

      const tokenURI = "ipfs://QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const seed = 12345;
      const colorA = "#FF0000";
      const colorB = "#00FF00";
      const ipfsHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
      const checksum = "abc123def456";

      await expect(
        nft.mintWithURI(
          addr1.address,
          tokenURI,
          seed,
          colorA,
          colorB,
          ipfsHash,
          checksum
        )
      ).to.be.revertedWith("Pausable: paused");
    });

    it("Should allow only owner to set base URI", async function () {
      const newBaseURI = "https://new-api.generativeart.gallery/metadata/";
      await nft.setBaseURI(newBaseURI);
      expect(await nft.baseURI()).to.equal(newBaseURI);
    });
  });
});