const { expect } = require('chai')
const { ethers } = require('hardhat')

describe("==== Compound ====", function(){
    let erc20, cErc20, owner

    before(async () => {
        [owner, user1, user2] = await ethers.getSigners()

        // Deploy Comptroller
        const ComptrollerFactory = await ethers.getContractFactory("Comptroller")
        const Comptroller = await ComptrollerFactory.deploy()
        await Comptroller.deployed()

        // Deploy SimplePriceOracle
        const SimplePriceOracleFactory = await ethers.getContractFactory("SimplePriceOracle")
        const SimplePriceOracle = await SimplePriceOracleFactory.deploy()
        await SimplePriceOracle.deployed()

        // Setup SimplePriceOracle to Comptroller
        await Comptroller._setPriceOracle(SimplePriceOracle.address)

        // Deploy MyERC20 contract (underlying token)
        const ERC20Factory = await ethers.getContractFactory("MyERC20")
        erc20 = await ERC20Factory.deploy(ethers.utils.parseUnits("6000000", 18))
        await erc20.deployed()

        // Deploy Interest Rate
        const InterestRateFactory = await ethers.getContractFactory("WhitePaperInterestRateModel")
        const InterestRate = await InterestRateFactory.deploy(0, 0)
        await InterestRate.deployed()

        // Deploy cErc20
        /**
            * @notice Initialize the new money market
            * @param underlying_ The address of the underlying asset
            * @param comptroller_ The address of the Comptroller
            * @param interestRateModel_ The address of the interest rate model
            * @param initialExchangeRateMantissa_ The initial exchange rate, scaled by 1e18
            * @param name_ ERC-20 name of this token
            * @param symbol_ ERC-20 symbol of this token
            * @param decimals_ ERC-20 decimal precision of this token
        */
       // CErc20Immutable: Immutable 多一個將 admin = payable(msg.sender)
        const CErc20Factory = await ethers.getContractFactory("CErc20Immutable")
        cErc20 = await CErc20Factory.deploy(
            erc20.address,
            Comptroller.address,
            InterestRate.address,
            ethers.utils.parseUnits("1", 18),
            "My Token",
            "mtoken",
            18,
            owner.address,
        )
        await cErc20.deployed()

        await Comptroller._supportMarket(cErc20.address)
    })

    describe("1. Mint and Redeem", async () => {
        // User1 使用 100 顆（100 * 10^18） ERC20 去 mint 出 100 CErc20 token
        // 再用 100 CErc20 token redeem 回 100 顆 ERC20

        it ("Mint to 100 CErc20", async function(){ 
            let mintAmount = 100
            // myERC20 100 轉給 cMyERC20 contract
            await erc20.approve(cErc20.address, mintAmount)
            // mint cERC20 100
            await cErc20.mint(100)
        
            expect(await cErc20.balanceOf(owner.address)).to.equal(mintAmount)
        })

        it ("Redeem to 100 ERC20", async function() {
            let mintAmount = 100
            await cErc20.redeem(mintAmount)
            
            expect(await cErc20.balanceOf(owner.address)).to.equal(0)
        })
        it ("test", async function () {
            await erc20.transfer(
                user1.address,
                ethers.utils.parseUnits("1000", 18)
            )
        })
    })
})
