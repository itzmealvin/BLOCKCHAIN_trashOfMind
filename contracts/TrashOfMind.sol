//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

contract TrashOfMind {
    address public owner;

    struct Thought {
        address sender;
        string mind;
        uint256 timestamp;
    }

    Thought[] private allThoughts;

    mapping(uint256 => bool) private isInitialized;
    mapping(address => uint256) private lastThrown;
    mapping(address => uint256) public totalThoughts;

    event throwMind(uint256 _nonce);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    modifier isInBreak() {
        require(
            lastThrown[msg.sender] + 1 minutes < block.timestamp,
            "Please wait up to 1 minute before throwing again"
        );
        _;
    }

    modifier haveMind(uint256 _nonce) {
        require(
            totalThoughts[msg.sender] > 0 && isInitialized[_nonce] == true,
            "You don't have any mind to censor or not created yet!"
        );
        _;
    }

    function throwNewMind(string memory _message) public isInBreak {
        Thought memory tempMind = Thought(
            msg.sender,
            _message,
            block.timestamp
        );

        isInitialized[allThoughts.length] = true;

        allThoughts.push(tempMind);
        lastThrown[msg.sender] = block.timestamp;
        totalThoughts[msg.sender] += 1;
        emit throwMind(allThoughts.length);
    }

    function viewAllThoughts() public view returns (Thought[] memory) {
        return allThoughts;
    }

    function viewLastFiveThoughts() public view returns (Thought[5] memory) {
        Thought[5] memory lastFiveThoughts;
        uint256 total = allThoughts.length;

        // Ensure that we don't go out of bounds
        uint256 start = (total > 5) ? total - 5 : 0;

        for (uint256 i = 0; i < 5 && start + i < total; i++) {
            lastFiveThoughts[i] = allThoughts[start + i];
        }
        return lastFiveThoughts;
    }

    function viewNumberOfThoughts() public view returns (uint256) {
        return allThoughts.length;
    }

    function censored(uint256 _nonce) public haveMind(_nonce) {
        Thought storage censorThought = allThoughts[_nonce];
        require(
            censorThought.sender == msg.sender,
            "You are not the owner of this thought!"
        );
        bytes32 censoredMind = keccak256(
            abi.encodePacked(censorThought.mind, block.timestamp)
        );
        censorThought.mind = string(abi.encodePacked(censoredMind));
    }

    function renounceOwnership() public onlyOwner {
        owner = address(0);
    }
}
