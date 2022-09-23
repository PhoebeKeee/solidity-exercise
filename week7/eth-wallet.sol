// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract EtherWallet {
    address payable public owner;
    constructor () {
        owner = payable(msg.sender);
    }
    
    receive() external payable {}

    function withdraw(uint _amount) external {
        require(msg.sender == owner, "caller is not owner");
        payable(msg.sender).transfer(_amount);

        // (bool sent,) = msg.sender.call{value: _amount}("");
        // require(sent, "Failed to send Ether!");
    }

    function getBalance() external view returns (uint) {
        return address(this).balance;
    }
}
