// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract PiggyBank {
    event Deposit (uint amount);
    event Withdrow (uint amount);

    address public owner = msg.sender;

    receive() external payable {
        emit Deposit(msg.value);
    }

    function withdraw() external {
        require(msg.sender == owner, "not onwer");
        emit Withdrow(address(this).balance);
        selfdestruct(payable(msg.sender));
    }
}
