//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

contract TrashOfMind {
    // declare the owner of this contract
    address public owner;

    // self-define data structure to store the Thought
    struct Thought {
        address sender;
        string mind;
        uint256 timestamp;
    }

    // storage to store all thrown thoughts
    Thought[] private allThoughts;

    // mapping to check if thoughts are initialized, last thrown and own thoughts of an address
    mapping(uint256 => bool) private isInitialized;
    mapping(address => uint256) private lastThrown;
    mapping(address => uint256[]) public ownThoughts;

    // create this event for our React.app to use
    event throwMind(uint256 _nonce);

    // set deployer address as the owner
    constructor() {
        owner = msg.sender;
    }

    // check if only the address of the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    // make a break to prevent spamming each 1 minutes
    modifier isInBreak() {
        require(
            lastThrown[msg.sender] + 1 minutes < block.timestamp,
            "Please wait up to 1 minute before throwing again"
        );
        _;
    }

    // check if only the nonce points to an exisiting thought
    modifier thoughtExist(uint256 _nonce) {
        require(isInitialized[_nonce] == true, "Thought not existed!");
        _;
    }

    // throw new mind to the blockchain
    function throwNewMind(string memory _message) public isInBreak {
        Thought memory tempMind = Thought(
            msg.sender,
            _message,
            block.timestamp
        );

        isInitialized[allThoughts.length] = true;
        ownThoughts[msg.sender].push(allThoughts.length);
        allThoughts.push(tempMind);
        lastThrown[msg.sender] = block.timestamp;
        emit throwMind(allThoughts.length);
    }

    // delete thrown mind from the blockchain
    function deleteOldMind(uint256 _nonce) public thoughtExist(_nonce) {
        Thought storage deleteThought = allThoughts[_nonce];
        require(
            deleteThought.sender == msg.sender,
            "You are not the owner of this thought!"
        );
        allThoughts[_nonce] = allThoughts[allThoughts.length - 1];
        allThoughts[allThoughts.length - 1] = deleteThought;
        allThoughts.pop();
    }

    // return all thoughts from the blockchain as an array
    function viewAllThoughts() public view returns (Thought[] memory) {
        return allThoughts;
    }

    // view specific mind if input a nonce, FUTURE WORK: only allowed address can see use this
    function viewSpecificMind(
        uint256 _nonce
    ) public view thoughtExist(_nonce) returns (Thought memory) {
        return allThoughts[_nonce];
    }

    // return the nonces of thought from a specific address
    function viewAllNoncesOfAddress() public view returns (uint256[] memory) {
        return ownThoughts[msg.sender];
    }

    // transfer the ownership to null address
    function renounceOwnership() public onlyOwner {
        owner = address(0);
    }
}
