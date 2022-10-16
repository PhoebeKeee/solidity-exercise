// SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import "./AppWorks.sol";

contract AppWorks_V2 is AppWorks {
  using StringsUpgradeable for uint256;

  string public notRevealedURI;

  function contractVersion() external pure returns (uint256) {
    return 2; // AppWorks_V2
  }

  // tokenURI 拿到 token 的 metadata URI
  function tokenURI(uint256 tokenId) public view override returns (string memory){
    require(_exists(tokenId), "token not exist");

    if (!revealed) {
      return notRevealedURI;
    }

    return bytes(_baseURI()).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
  }

  // Let this contract can be upgradable, using openzepplin proxy library - week 10
  function setNotRevealedURI(string memory _uri) external onlyOwner {
    notRevealedURI = _uri;
  }
}