const { ethers, upgrades } = require("hardhat");

const PROXY = "0xeb9B9E4B40e337aC5109490B064E1F48fcaFad7C";

async function main() {
 const AppWorksV2 = await ethers.getContractFactory("AppWorks_V2");
 console.log("Upgrading AppWorks...");
 await upgrades.upgradeProxy(PROXY, AppWorksV2);
 console.log("AppWorks upgraded successfully");
}

main();