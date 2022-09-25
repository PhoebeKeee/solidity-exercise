// SPDX-License-Identifier: GPL-3.0

pragma solidity >=0.7.0 <0.9.0;

contract FisherYatesShuffles {
    uint256 constant MAX_POPULATION = 10;
    uint256[] ids = new uint256[](MAX_POPULATION);

    function dirtyRNG() public view returns(uint256) {
        return uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender)));
    }

    function getIds() public view returns (uint256[] memory) {
        return ids; // [0,0,0,0,0,0,0,0,0,0]
    }

    function shuffles() public returns (uint256 id) {
        require(ids.length > 0, "no data here");
        
        // generate random hash and use it to pick a number between 0 and ids.length
        uint256 randomIndex = uint256(keccak256(abi.encodePacked(block.timestamp, msg.sender))) % ids.length;

        id = ids[randomIndex] != 0 ? ids[randomIndex] : randomIndex;

        // fill array position with value
        ids[randomIndex] = ids[ids.length - 1] == 0 ? ids.length - 1 : ids[ids.length - 1];

        // shrink ids array
        ids.pop();
        return id;
    }
}
