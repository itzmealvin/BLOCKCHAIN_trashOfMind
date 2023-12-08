//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

contract Trash {
    uint256 public totalMinds;

    address public owner;

    struct stateOfMind {
        address sender;
        string mind;
    }

    stateOfMind[] public publicMinds;

    mapping(address => uint256) private lastThrown;
    mapping(address => uint256) public totalOwnMinds;

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    modifier isInBreak() {
        require(
            lastThrown[msg.sender] + 1 hours < block.timestamp,
            "Please wait up to 1 hour before throwing again"
        );
        _;
    }

    modifier hasMinds() {
        require(
            totalOwnMinds[msg.sender] > 0,
            "You don't have any mind to censor"
        );
        _;
    }

    function throwMind(
        string memory _message
    ) public isInBreak returns (uint256) {
        totalMinds += 1;

        stateOfMind memory tempMind = stateOfMind(msg.sender, _message);

        publicMinds.push(tempMind);
        totalOwnMinds[msg.sender] += 1;
        lastThrown[msg.sender] = block.timestamp;

        return totalMinds;
    }

    function viewMinds() public view returns (stateOfMind[] memory) {
        return publicMinds;
    }

    function viewTotalMinds() public view returns (uint256) {
        return totalMinds;
    }

    function censored(uint256 _nonce) public hasMinds {
        stateOfMind storage censorStruct = publicMinds[_nonce];
        require(
            censorStruct.sender == msg.sender,
            "You are not the owner of this mind!"
        );
        bytes32 censoredMind = keccak256(
            abi.encodePacked(censorStruct.mind, block.timestamp)
        );
        censorStruct.mind = string(abi.encodePacked(censoredMind));
    }

    function renounceOwnership() public onlyOwner {
        owner = address(0);
    }
}
