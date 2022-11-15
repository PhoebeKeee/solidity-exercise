// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @title myERC20Token
 * @dev Create a myERC20Token standard token
 */
contract myERC20Token is ERC20 {
    constructor(uint tokenSupply, string memory tokenName, string memory tokenSymbol) ERC20(tokenName, tokenSymbol) {
        _mint(msg.sender, tokenSupply);
    }
}