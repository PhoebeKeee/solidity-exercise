const { ethers, upgrades } = require("hardhat")

async function main() {
    const AppWorks = await ethers.getContractFactory("AppWorks")
    const appWorks = await upgrades.deployProxy(AppWorks, [], {
        initializer: "initialize",
    });
    await appWorks.deployed()
    console.log("Appworks deployed to:", appWorks.address)
}

main()