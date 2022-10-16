// SPDX-License-Identifier: GPL-3.0

pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/cryptography/MerkleProofUpgradeable.sol";

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";

contract AppWorks is Initializable, UUPSUpgradeable, OwnableUpgradeable, ERC721Upgradeable {
  using StringsUpgradeable for uint256;

  using CountersUpgradeable for CountersUpgradeable.Counter;
  CountersUpgradeable.Counter private _nextTokenId;

  uint256 public price;
  uint256 public constant maxSupply = 100;
 
  bool public mintActive;
  bool public earlyMintActive;
  bool public revealed;
  
  string public baseURI;
  bytes32 public merkleRoot;

  mapping(uint256 => string) private _tokenURIs;
  mapping(address => uint256) public addressMintedBalance;

  //   constructor() ERC721("AppWorks", "AW") {
 
  //   }

  function initialize() public initializer {
    __ERC721_init("AppWorks", "AW");
    __Ownable_init();
    price = 0.01 ether;
  }
  
  // Public mint function - week 8
  function mint(uint256 _mintAmount) public payable {
    //Please make sure you check the following things:
    //Current state is available for Public Mint
    //Check how many NFTs are available to be minted
    //Check user has sufficient funds

    require(mintActive, "current state is not available for public mint.");
    require(_validUserMintAmount(_mintAmount + addressMintedBalance[msg.sender]), "mint per user limit to 10 and owner limit to 20.");
    require(_mintAmount * price <= msg.value, "Your fund is insufficient.");
    require(_mintAmount + totalSupply() <= maxSupply, "run out of supply.");

    for (uint256 i = 0; i < _mintAmount; i++) {
      _safeMint(msg.sender, _nextTokenId._value);
      _nextTokenId.increment();
    }
    addressMintedBalance[msg.sender] += _mintAmount;
  }

  // Set mint per user limit to 10 and owner limit to 20 - Week 8
  function _validUserMintAmount(uint _amount) private view returns(bool) {
    uint limit = msg.sender == owner() ? 20 : 10;
    return _amount <= limit;
  }
  
  // Implement totalSupply() Function to return current total NFT being minted - week 8
  function totalSupply() public view returns (uint256) {
    return _nextTokenId.current();
  }

  // Implement withdrawBalance() Function to withdraw funds from the contract - week 8
  function withdrawBalance() external onlyOwner {
    (bool sent, ) = msg.sender.call{value: address(this).balance}("");
    require(sent, "withdraw failed.");
  }

  // Implement setPrice(price) Function to set the mint price - week 8
  function setPrice(uint256 _price) external onlyOwner {
    price = _price;
  }
 
  // Implement toggleMint() Function to toggle the public mint available or not - week 8
  function toggleMint() external onlyOwner {
    mintActive = !mintActive;
  }

  // Implement toggleReveal() Function to toggle the blind box is revealed - week 9
  function toggleReveal() external onlyOwner {
    revealed = !revealed;
  }

  // ref: 
  // Implement setBaseURI(newBaseURI) Function to set BaseURI - week 9
  function setBaseURI(string memory _newBaseURI) public onlyOwner {
    baseURI = _newBaseURI;
  }

  // Function to return the base URI
  function _baseURI() internal view virtual override returns (string memory) {
    return baseURI;
  }

  // Early mint function for people on the whitelist - week 9
  function earlyMint(bytes32[] calldata _merkleProof, uint256 _mintAmount) public payable {
    //Please make sure you check the following things:
    //Current state is available for Early Mint
    require(earlyMintActive, "current state is not available for early mint.");
    //Check how many NFTs are available to be minted

    // require(_mintAmount + totalSupply() <= maxSupply, "run out of supply.");


    //Check user is in the whitelist - use merkle tree to validate
    bytes32 leaf = keccak256(abi.encodePacked(msg.sender));
    require(MerkleProofUpgradeable.verifyCalldata(_merkleProof, merkleRoot, leaf), "you are not in white list");

    
    //Check user has sufficient funds
    require(_mintAmount * price <= msg.value, "Your fund is insufficient.");

    for (uint256 i = 0; i < _mintAmount; i++) {
      _safeMint(msg.sender, _nextTokenId._value);
      _nextTokenId.increment();
    }
    addressMintedBalance[msg.sender] += _mintAmount;
  }
  
  // Implement toggleEarlyMint() Function to toggle the early mint available or not - week 9
  function toggleEarlyMint() external onlyOwner {
    earlyMintActive = !earlyMintActive;
  }

  // Implement setMerkleRoot(merkleRoot) Function to set new merkle root - week 9
  function setMerkleRoot(bytes32 _root) external onlyOwner {
    merkleRoot = _root;
  }

  // @dev required by the OZ UUPS module
  function _authorizeUpgrade(address) internal override onlyOwner {}
  
  // Let this contract can be upgradable, using openzepplin proxy library - week 10
  // Try to modify blind box images by using proxy
}