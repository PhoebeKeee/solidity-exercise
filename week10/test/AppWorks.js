const {
    time,
    loadFixture,
  } = require("@nomicfoundation/hardhat-network-helpers");
  const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
  const { expect } = require("chai");
  const { ethers } = require("hardhat");
  
  describe("AppWorks", function () {
    // We define a fixture to reuse the same setup in every test.
    // We use loadFixture to run this setup once, snapshot that state,
    // and reset Hardhat Network to that snapshot in every test.
    async function deployOneYearLockFixture() {
      const ONE_YEAR_IN_SECS = 60;
      const ONE_GWEI = 1_000_000_000;
  
      const lockedAmount = ONE_GWEI;
      const unlockTime = (await time.latest()) + ONE_YEAR_IN_SECS;
  
      // Contracts are deployed using the first signer/account by default
      const [owner, otherAccount] = await ethers.getSigners();
  
      const AppWorks = await ethers.getContractFactory("AppWorks");
      const appWorks = await AppWorks.deploy();
  
      return { appWorks, unlockTime, lockedAmount, owner, otherAccount };
    }
  
    describe("AppWorks Deployment", function () {
      it("AppWorks init maxSupply should be 0 with upgradeable contract", async function () {
        const { appWorks } = await loadFixture(deployOneYearLockFixture);
  
        expect(await appWorks.maxSupply()).to.equal(0);
      });
    });
  });
  