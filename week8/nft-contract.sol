// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract AppWorks is ERC721, Ownable {
  using Strings for uint256;

  using Counters for Counters.Counter;
  Counters.Counter private _nextTokenId;

  uint256 public price = 0.01 ether;
  uint256 public constant maxSupply = 100;
 
  bool public mintActive = false;
  bool public earlyMintActive = false;
  bool public revealed = false;
  
  string public baseURI;
  bytes32 public merkleRoot;

  mapping(uint256 => string) private _tokenURIs;
  mapping(address => uint256) public addressMintedBalance;

  constructor() ERC721("AppWorks", "AW") {
 
  }
  
  // Public mint function - week 8
  function mint(uint256 _mintAmount) public payable {
    //Please make sure you check the following things:
    //Current state is available for Public Mint
    //Check how many NFTs are available to be minted
    //Check user has sufficient funds

    require(mintActive, "current state is not available for public mint");
    require(_validUserMintAmount(msg.sender, _mintAmount + addressMintedBalance[msg.sender]), "mint per user limit to 10 and owner limit to 20");
    require(_mintAmount * price <= msg.value, "Your fund is insufficient.");

    for (uint256 i = 0; i < _mintAmount; i++) {
      _safeMint(msg.sender, _nextTokenId._value);
      _nextTokenId.increment();
    }
    addressMintedBalance[msg.sender] += _mintAmount;
  }
  
  // Implement totalSupply() Function to return current total NFT being minted - week 8
  function totalSupply() external view returns(uint) {
    return _nextTokenId.current();
  }

  // Implement withdrawBalance() Function to withdraw funds from the contract - week 8
  function withdrawBalance() external onlyOwner {
      (bool sent, ) = msg.sender.call{value: address(this).balance}("");
      require(sent, "withdraw failed");
  }

  // Implement setPrice(price) Function to set the mint price - week 8
  function setPrice(uint _price) external onlyOwner {
      price = _price;
  }
 
  // Implement toggleMint() Function to toggle the public mint available or not - week 8
  function toggleMint() external onlyOwner {
    mintActive = !mintActive;
  }

  // Set mint per user limit to 10 and owner limit to 20 - Week 8
  function _validUserMintAmount(address _address, uint _amount) private view returns(bool) {
    uint limit = _address == owner() ? 20 : 10;
    return _amount <= limit;
  }

  // Implement toggleReveal() Function to toggle the blind box is revealed - week 9

  // Implement setBaseURI(newBaseURI) Function to set BaseURI - week 9

  // Function to return the base URI
  function _baseURI() internal view virtual override returns (string memory) {
    return baseURI;
  }

  // Early mint function for people on the whitelist - week 9
  function earlyMint(bytes32[] calldata _merkleProof, uint256 _mintAmount) public payable {
    //Please make sure you check the following things:
    //Current state is available for Early Mint
    //Check how many NFTs are available to be minted
    //Check user is in the whitelist - use merkle tree to validate
    //Check user has sufficient funds
  }
  
  // Implement toggleEarlyMint() Function to toggle the early mint available or not - week 9

  // Implement setMerkleRoot(merkleRoot) Function to set new merkle root - week 9

  // Let this contract can be upgradable, using openzepplin proxy library - week 10
  // Try to modify blind box images by using proxy
  
}
