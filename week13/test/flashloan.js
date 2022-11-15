const { expect } = require('chai')
const { loadFixture } = require("@nomicfoundation/hardhat-network-helpers")
const UNI_ABI = require("../abi/uni")
const USDC_ABI = require("../abi/usdc")

/*
  cToken 的 decimals 皆為 18，初始 exchangeRate 為 1:1 (ok)
  Close factor 設定為 50%
  Liquidation incentive 設為 10%（1.1 * 1e18)
  使用 USDC 以及 UNI 代幣來作為 token A 以及 Token B
  在 Oracle 中設定 USDC 的價格為 $1，UNI 的價格為 $10
  設定 UNI 的 collateral factor 為 50%
*/
 
const UNI_ADDRESS = '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984'
const USDC_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const BINANCE_IMPERSONATED_WALLET = '0x28C6c06298d514Db089934071355E5743bf21d60'
const AAVE_LENDING_POOL_ADDRESS = '0x7d2768dE32b0b80b7a3454c06BdAc94A69DDc7A9'
const AAVE_FLASHLOAN_ADDRESS = '0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5'
const SWAP_ADDRESS = '0xE592427A0AEce92De3Edee1F18E0157C05861564'

const CLOSE_FACTOR = ethers.utils.parseUnits("0.5", 18) // Close factor 設定為 50%
const COLLATERAL_FACTOR = ethers.utils.parseUnits("0.5", 18)
const LIQUIDATION_INCENTIVE = ethers.utils.parseUnits("1.1", 18) // Liquidation incentive 設為 10%（1.1 * 1e18)
const USDC_PRICE = ethers.utils.parseUnits("1", 18 + 12)
const UNI_PRICE = ethers.utils.parseUnits("10", 18)
const NEW_UNI_PRICE = ethers.utils.parseUnits("6.2", 18)

const TARGET_DEPOSIT_UNI_AMOUNT = ethers.utils.parseUnits("1000", 18)
const TARGET_BORROW_USDC_AMOUNT = ethers.utils.parseUnits("5000", 6)

describe("=== compound week13 ===", function(){
  async function initContracts(){
    const [owner, user1, user2] = await ethers.getSigners()

    /* Step 0. Deploy compound related contracts */
    const comptrollerFactory = await ethers.getContractFactory("Comptroller")
    const comptroller = await comptrollerFactory.deploy()
    await comptroller.deployed()

    const interestRateModelFactory = await ethers.getContractFactory("WhitePaperInterestRateModel")
    const interestRateModel = await interestRateModelFactory.deploy(ethers.utils.parseUnits("0", 18), ethers.utils.parseUnits("0", 18),)
    await interestRateModel.deployed()

    // deploy cUNI and cUSDC
    const cErc20Factory = await ethers.getContractFactory("CErc20")
    const cUNI = await cErc20Factory.deploy()
    await cUNI.deployed()
    await cUNI["initialize(address,address,address,uint256,string,string,uint8)"](
      UNI_ADDRESS,
      comptroller.address,
      interestRateModel.address,
      ethers.utils.parseUnits("1", 18),
      "compound UNI",
      "cUNI",
      18
    )
    const cUSDC = await cErc20Factory.deploy()
    await cUSDC.deployed()
    await cUSDC["initialize(address,address,address,uint256,string,string,uint8)"](
      USDC_ADDRESS,
      comptroller.address,
      interestRateModel.address,
      ethers.utils.parseUnits('0.000000000001', 18), // 10 ** (6 - 18)
      "compound USDC",
      "cUSDC",
      18
    )

    // set simplePriceOracle as comptroller oracle
    const simplePriceOracleFactory = await ethers.getContractFactory("SimplePriceOracle")
    const simplePriceOracle = await simplePriceOracleFactory.deploy()
    await simplePriceOracle.deployed()
    await comptroller._setPriceOracle(simplePriceOracle.address)

    // set close factor to 50%
    await comptroller._setCloseFactor(CLOSE_FACTOR)

    // set liquidation incentive to 10%
    await comptroller._setLiquidationIncentive(LIQUIDATION_INCENTIVE)

    // set UNI & USDC price
    await simplePriceOracle.setUnderlyingPrice(cUNI.address, UNI_PRICE)
    await simplePriceOracle.setUnderlyingPrice(cUSDC.address, USDC_PRICE)
    
    // support market
    await comptroller._supportMarket(cUNI.address)
    await comptroller._supportMarket(cUSDC.address)
    
    // set UNI's collateral factor to 50%
    await comptroller._setCollateralFactor(cUNI.address, COLLATERAL_FACTOR)

    // get UNI & USDC contract instance
    const uni = await ethers.getContractAt(UNI_ABI, UNI_ADDRESS)
    const usdc = await ethers.getContractAt(USDC_ABI, USDC_ADDRESS)

    /* Step 1. Deploy aave related contracts */
    const lendingPool = await ethers.getContractAt("ILendingPool", AAVE_LENDING_POOL_ADDRESS)

    const flashloanFactory = await ethers.getContractFactory("Flashloan")
    const flashloan = await flashloanFactory.deploy(AAVE_FLASHLOAN_ADDRESS)
    await flashloan.deployed()

    return {
      owner,
      user1,
      user2,
      comptroller,
      interestRateModel,
      simplePriceOracle,
      cUNI,
      cUSDC,
      uni,
      usdc,
      lendingPool,
      flashloan
    }
  }

  describe("Using AAVE's flash loan to liquidate user1", function(){
    /*
      - User1 使用 1000 顆 UNI 作為抵押品借出 5000 顆 USDC
      - 將 UNI 價格改為 $6.2 使 User1 產生 Shortfall，並讓 User2 透過 AAVE 的 Flash loan 來清算 User1
      - 可以自行檢查清算 50% 後是不是大約可以賺 121 USD
      - 在合約中如需將 UNI 換成 USDC 可以使用以下程式碼片段：
    */
    let OWNER, USER_1, USER_2
    let COMPTROLLER, SIMPLE_PRICE_ORACLE
    let UNI, C_UNI, USDC, C_USDC
    let LENDING_POOL, FLASH_LOAN

    before(async () => {
      const { comptroller, simplePriceOracle, uni, cUNI, usdc, cUSDC, lendingPool, flashloan, owner, user1, user2 } = await loadFixture(initContracts)
      const binanceUser = await ethers.getImpersonatedSigner(BINANCE_IMPERSONATED_WALLET)

      const uniAmount = ethers.utils.parseUnits("2000", 18)
      const usdcAmount = ethers.utils.parseUnits("20000", 6)
      
      // Transfer 2000 UNI from binance impersonateAccount to user1
      await expect(uni.connect(binanceUser).transfer(user1.address, uniAmount))
      .to.changeTokenBalances(
        uni,
        [user1.address],
        [uniAmount]
      )

      // Transfer 20000 USDC from binance impersonateAccount to user2
      await expect(usdc.connect(binanceUser).transfer(user2.address, usdcAmount))
      .to.changeTokenBalances(
        usdc,
        [user2.address],
        [usdcAmount]
      )

      // Transfer 20000 USDC from binance impersonateAccount to owner
      await expect(usdc.connect(binanceUser).transfer(owner.address, usdcAmount))
      .to.changeTokenBalances(
        usdc,
        [owner.address],
        [usdcAmount]
      )

      // owner deposits 10000 USDC into market, owner supply/mint 10000 cToken (cUSDC)
      await usdc.approve(cUSDC.address, usdcAmount)
      await cUSDC.mint(ethers.utils.parseUnits("10000", 6))
      expect(await cUSDC.balanceOf(owner.address)).to.eq(ethers.utils.parseUnits("10000", 18))

      OWNER = owner
      USER_1 = user1
      USER_2 = user2
      UNI = uni
      C_UNI = cUNI
      USDC = usdc
      C_USDC = cUSDC
      
      COMPTROLLER = comptroller
      SIMPLE_PRICE_ORACLE = simplePriceOracle
      LENDING_POOL = lendingPool
      FLASH_LOAN = flashloan
    })

    it("0. User1 borrows 5000 USDC with 1000 UNI as collateral", async function() {
      // user1 deposits 1000 UNI, UNI approve cUNI to use and mint it.
      await UNI.connect(USER_1).approve(C_UNI.address, TARGET_DEPOSIT_UNI_AMOUNT)
      await C_UNI.connect(USER_1).mint(TARGET_DEPOSIT_UNI_AMOUNT)
      expect(await C_UNI.balanceOf(USER_1.address)).to.eq(TARGET_DEPOSIT_UNI_AMOUNT)
      
       // In order to supply collateral or borrow in a market, it must be entered first.
      await COMPTROLLER.connect(USER_1).enterMarkets([C_UNI.address])

      // then user1 can borrow 5000 USDC
      await C_USDC.connect(USER_1).borrow(TARGET_BORROW_USDC_AMOUNT)

      // final, check user1's USDC balance
      expect(await USDC.balanceOf(USER_1.address)).to.eq(TARGET_BORROW_USDC_AMOUNT)

      // and user1 can not be liquidated
      let user1AccountLiquidity = await COMPTROLLER.getAccountLiquidity(USER_1.address)
      expect(user1AccountLiquidity[2]).to.eq(0)
    })

    it("1. Set UNI price to 6.2 and user1's liquidity should = 0 && short fall should > 0", async function() {
      // 將 UNI 價格改為 $6.2 使 User1 產生 Shortfall

      // update UNI price
      await SIMPLE_PRICE_ORACLE.setUnderlyingPrice(C_UNI.address, NEW_UNI_PRICE)

      // user1's short fall should > 0 => can be liquidated
      let user1AccountLiquidity = await COMPTROLLER.getAccountLiquidity(USER_1.address)
      expect(user1AccountLiquidity[1]).to.eq(0)
      expect(user1AccountLiquidity[2]).to.gt(0)
    })

    it ("2. User2 liquidates with AAVE's flash loan", async function() {
      // User2 透過 AAVE 的 Flash loan 來清算 User1
      // 可以自行檢查清算 50% 後是不是大約可以賺 121 USD

      const abiCoder = new ethers.utils.AbiCoder()

      await FLASH_LOAN.connect(USER_2).requestFlashloan(
        USDC_ADDRESS, // assets
        TARGET_BORROW_USDC_AMOUNT * 0.5, // amounts
        abiCoder.encode( // encoded params
          ['address', 'address', 'address', 'address', 'address'],
          [C_USDC.address, USER_1.address, C_UNI.address, UNI_ADDRESS, SWAP_ADDRESS],
        ),
      )

      // flashloan profit > 0
      expect(await USDC.balanceOf(FLASH_LOAN.address)).to.gt(0)
    })
  })
})