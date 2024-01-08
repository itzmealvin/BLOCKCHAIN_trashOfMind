//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.9;

contract TrashOfMind {
    // declare the owner of this contract
    address payable public owner;

    // self-define data structure to store the Thought
    struct Thought {
        string mind;
        uint256 timestamp;
    }

    // storage to store all thrown thoughts
    Thought[] private allThoughts;

    // mapping to check if thoughts are initialized, last action, number of thought of an address and the owner of a thought
    mapping(uint256 => bool) private isInitialized;
    mapping(address => uint256) private totalOwn;
    mapping(uint256 => address) private thoughtOwner;
    mapping(address => uint256) private lastAction;

    // create this event for our React.app to use
    event throwMind(uint256 _nonce);

    // set deployer address as the owner
    constructor() {
        owner = payable(msg.sender);
    }

    // check if only the address of the owner
    modifier onlyOwner() {
        require(msg.sender == owner, "You are not the owner");
        _;
    }

    // make a break to prevent spamming each 1 minutes
    modifier isInBreak() {
        require(
            lastAction[msg.sender] + 1 minutes < block.timestamp,
            "Please wait up to 1 minute before throwing again"
        );
        _;
    }

    // check if only the nonce points to an existing thought
    modifier thoughtExist(uint256 _nonce) {
        require(isInitialized[_nonce] == true, "Thought not existed!");
        _;
    }

    // throw new mind to the blockchain
    function throwNewMind(string memory _message) public isInBreak {
        Thought memory tempMind = Thought(_message, block.timestamp);

        isInitialized[allThoughts.length] = true;
        totalOwn[msg.sender] += 1;
        thoughtOwner[allThoughts.length] = msg.sender;
        allThoughts.push(tempMind);
        lastAction[msg.sender] = block.timestamp;
        emit throwMind(allThoughts.length);
    }

    // delete thrown mind from the blockchain
    function deleteOldMind(uint256 _nonce) public thoughtExist(_nonce) {
        uint256 lastIndex = allThoughts.length - 1;
        require(
            thoughtOwner[_nonce] == msg.sender,
            "You are not the owner of this thought!"
        );
        require(
            _nonce < allThoughts.length,
            "Please wait for at least 2 thoughts available!"
        );
        totalOwn[msg.sender]--;
        thoughtOwner[_nonce] = thoughtOwner[lastIndex];
        allThoughts[_nonce] = allThoughts[lastIndex];
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

    // return the nonce of thought from a specific address
    function viewAllNoncesOfAddress() public view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](totalOwn[msg.sender]);
        uint counter = 0;
        for (uint i = 0; i < allThoughts.length; i++) {
            if (thoughtOwner[i] == msg.sender) {
                result[counter] = i;
                counter++;
            }
        }
        return result;
    }

    // transfer the ownership to null address
    function renounceOwnership() public onlyOwner {
        owner = payable(address(0));
    }

    function close() public onlyOwner {
        selfdestruct(owner);
    }
}
