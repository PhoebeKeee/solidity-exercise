// SPDX-License-Identifier: GPL-3.0
 
pragma solidity >=0.7.0 <0.9.0;
 
contract FunctionSelector {
   function getSelector(string calldata _func) external  pure returns (bytes4) {
       return bytes4(keccak256(bytes(_func)));
   }
}
contract Receiver {
   event Log(bytes data);
 
   function transfer(address _to, uint amount) external {
       emit Log(msg.data);
   }
}
