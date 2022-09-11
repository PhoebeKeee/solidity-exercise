// SPDX-License-Identifier: GPL-3.0
 
pragma solidity >=0.7.0 <0.9.0;
 
contract addressContract {
   function return_TX_address() public view returns (address) {
       address myAddress = tx.origin;
       return myAddress;
   }
   function return_MSG_address() public view returns (address) {
       address myAddress = msg.sender;
       return myAddress;
   }
}
 
interface targerInterface {
   function return_TX_address() external returns (address);
   function return_MSG_address() external returns (address);
}
 
 
contract Call_Hello {
   targerInterface helloInterface = targerInterface(0xF27374C91BF602603AC5C9DaCC19BE431E3501cb);
  
   function myTX () public returns (address) {
       return helloInterface.return_TX_address();
   }
 
   function myMSG () public returns (address) {
       return helloInterface.return_MSG_address();
   }
 
}
