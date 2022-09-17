// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract class36 {
    uint internal  a = 1; // contract class36_2 can't get a => 要透過封裝 getA func

    function external_example(uint x) external {
        a = x;
    }
    function internal_example(uint x) internal  {
        a = x;
    }
    function public_example(uint x) public {
        a = x;
        // external_example(4); // 只提供外部合約call, so is not work.
        this.external_example(4); // 加上this之後代表從外部來call這個合約 so is work, 但不建議在此使用
        internal_example(4);
    }
    function private_example(uint x) private {
        a = x;
    }
    function getA() public view returns (uint) {
        return a;
    }
}

contract class36_2 is class36 {
    function call_internal(uint x) public {
        internal_example(x);
    }
}
