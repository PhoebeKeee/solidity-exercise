require("@nomicfoundation/hardhat-toolbox");
require('@openzeppelin/hardhat-upgrades')

const ALCHEMY_API_KEY = "VjMtD2ZGqnHm8VEEoGQ84fbfkW_aJOJC"
const GOERLI_PRIVATE_KEY = "75f7f9edfd0af8d61148cb24e85a94a9eefe81bd467591db9f07414d616d9b43"

require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: `https://eth-goerli.alchemyapi.io/v2/${ALCHEMY_API_KEY}`,
      accounts: [GOERLI_PRIVATE_KEY]
    }
  },
  etherscan: {
    apiKey: 'C8D3BHTJFWBU6GAZWR8SMAW3QS6ZGEX4DE',
  },
};
