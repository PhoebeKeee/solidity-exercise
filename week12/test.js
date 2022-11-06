const { expect } = require('chai')
const { ethers } = require('hardhat')


describe(" ==== Compound Test - Week12 ====", function(){
    let owner
    let user1
    let user2

    let tokenA
    let tokenB
    let myTokenSupplement = ethers.utils.parseUnits("6000000", 18)
    let tokenNameA = "tokenA"
    let tokenNameB = "tokenB"
    let tokenSymbolA = "symbolA"
    let tokenSymbolB = "symbolB"
    let tokenAPrice =  ethers.utils.parseUnits("1", 18)
    let tokenBPrice =  ethers.utils.parseUnits("100", 18)

    let cTokenA
    let cTokenB
    let cTokenNameA = "cTokenA"
    let cTokenNameB = "cTokenB"
    let cTokenSymbolA = "cSymbolA"
    let cTokenSymbolB = "cSymbolB"
    let cTokenChangeRateA = ethers.utils.parseUnits("1", 18)
    let cTokenChangeRateB = ethers.utils.parseUnits("1", 18)
    let cTokenDecimal = 18
    let collateralFactorA = BigInt(0.9 * 1e18)
    let collateralFactorB = BigInt(0.5 * 1e18)

    let closeFactor = BigInt(0.5 * 1e18)
    let liquidationIncentive = BigInt(1.08 * 1e18)

    let comptroller
    let interestRate
    let oracle

    before(async () => {
        [owner, user1, user2] = await ethers.getSigners()

        // Deploy MyERC20 contract (underlying token)
        const ERC20Factory = await ethers.getContractFactory("MyERC20")
        tokenA = await ERC20Factory.deploy(myTokenSupplement, tokenNameA, tokenSymbolA)
        await tokenA.deployed()
        tokenB = await ERC20Factory.deploy(myTokenSupplement, tokenNameB, tokenSymbolB)
        await tokenB.deployed()

        // Deploy Comptroller
        const ComptrollerFactory = await ethers.getContractFactory("Comptroller")
        comptroller = await ComptrollerFactory.deploy()
        await comptroller.deployed()

        // Deploy SimplePriceOracle
        const SimplePriceOracleFactory = await ethers.getContractFactory("SimplePriceOracle")
        oracle = await SimplePriceOracleFactory.deploy()
        await oracle.deployed()

        // Deploy Interest Rate
        const InterestRateFactory = await ethers.getContractFactory("WhitePaperInterestRateModel")
        const InterestRate = await InterestRateFactory.deploy(0, 0)
        await InterestRate.deployed()

        const CErc20Factory = await ethers.getContractFactory("CErc20Immutable")
        cTokenA = await CErc20Factory.deploy(
            tokenA.address,
            comptroller.address,
            interestRate.address,
            cTokenChangeRateA,
            cTokenNameA,
            cTokenSymbolA,
            cTokenDecimal,
            owner.address,
        )
        await cTokenA.deployed()

        cTokenB = await CErc20Factory.deploy(
            tokenB.address,
            comptroller.address,
            interestRate.address,
            cTokenChangeRateB,
            cTokenNameB,
            cTokenSymbolB,
            cTokenDecimal,
            owner.address,
        )
        await cTokenB.deployed()

        await oracle.setUnderlyingPrice(cTokenA.address, tokenAPrice)
        await oracle.setUnderlyingPrice(cTokenB.address, tokenBPrice)
        await comptroller._setPriceOracle(oracle.address)
        // support market
        await comptroller._supportMarket(cTokenA.address)
        await comptroller._supportMarket(cTokenB.address)
        // set collateral
        await comptroller._setCollateralFactor(cTokenA.address, collateralFactorA)
        await comptroller._setCollateralFactor(cTokenB.address, collateralFactorB)
        // set close factor
        await comptroller._setCloseFactor(closeFactor)
        // set liquidation incentive
        await comptroller._setLiquidationIncentive(liquidationIncentive)
    })
    /*
    User1 使用 1 顆 token B 來 mint cToken
    User1 使用 token B 作為抵押品來借出 50 顆 token A
    */
    describe("Scenario: User1 uses 1 tokenB to mint cTokenB, then borrow 50 tokenA", async () => {
        it("Borrow test", async function() {
            // 先給 user1 1000 TokenB, user2 2000 TokenA
            // user2 存 100 TokenA 到池子, and get 100 CTokenA
            await tokenB.transfer(user1.address, ethers.utils.parseUnits("1000", 18))
            await tokenA.transfer(user2.address, ethers.utils.parseUnits("2000", 18))

            await tokenA.connect(user2).approve(cTokenA.address, ethers.utils.parseUnits("100", 18))
            await cTokenA.connect(user2).mint(ethers.utils.parseUnits("100", 18))
            
            //user1 存 1 TokenB, and get 1 cTokenB
            await tokenB.connect(user1).approve(cTokenB.address, ethers.utils.parseUnits("1", 18))
            await cTokenB.connect(user1).mint(ethers.utils.parseUnits("1", 18))

            // user1 抵押品為 1 TokenB($100)，collateral factor 50% => 可借出 $50 等值 tokenA($1)，也就是 50 顆 tokenA
            await cTokenA.connect(user1).borrow(ethers.utils.parseUnits("50", 18))
        })
        
        it("RepayBorrow test", async function() {
            await tokenA.connect(user1).approve(cTokenA.address, ethers.utils.parseUnits("50", 18))
            await cTokenA.connect(user1).repayBorrow(ethers.utils.parseUnits("50", 18))
        })

        /*
        延續 (3.) 的借貸場景，調整 token B 的 collateral factor，讓 user1 被 owner 清算
        */
        it("modify the collateral factor to 0.1", async function () {
            // owner 協助償還借貸，執行liquidateBorrow
            // 第一個參數為被清算人，第二為協助清算資產數量，第三個為抵押資產的cToken地址
            await comptroller._setCollateralFactor(cTokenB.address, ethers.utils.parseUnits("0.1", 18))
            await cTokenA.connect(user2).liquidateBorrow(user1.address, ethers.utils.parseUnits("25", 18), cTokenB.address)
        })

        /*
        延續 (3.) 的借貸場景，調整 oracle 中的 token B 的價格，讓 user1 被 user2 清算
        */
        let newTokenAPrice = BigInt(1.5 * 1e18)
        it("change tokenA oracle price", async () => {
            await oracle.setUnderlyingPrice(cTokenA.address, newTokenAPrice)
        })
        it("owner liquidity should = 0 && short fall should > 0", async () => {
            let result = await comptroller.getAccountLiquidity(user1.address)
            expect(result[1]).to.eq(0)
            expect(result[2]).to.gt(0)
        })
        it("liquidate by owner", async () => {
            let borrowBalance = await cTokenA.connect(user1).callStatic.borrowBalanceCurrent(
                user1.address
            )

            let repayAmount = (BigInt(borrowBalance) * closeFactor) / BigInt(1e18)

            // owner 協助償還借貸，執行liquidateBorrow
            // 第一個參數為被清算人，第二為協助清算資產數量，第三個為抵押資產的cToken地址
            await tokenA.approve(cTokenA.address, repayAmount)
            await cTokenA.liquidateBorrow(user1.address, repayAmount, cTokenB.address)
        })
        
    })
})
