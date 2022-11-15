# Installation
```
npm install --save-dev hardhat
npx hardhat
```

# How to use
```
npx hardhat node

npx hardhat test


// set api key in .env
API_KEY = xxxxxx

// run script
npx hardhat test test/flashloan

```

# Run Test with Gas Report
```
REPORT_GAS=true npx hardhat test test/mintAndRedeem.js
```
