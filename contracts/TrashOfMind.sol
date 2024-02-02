//SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8;

contract TrashOfMind {
    // create additional stats for contracts
    address payable public owner;
    Mind[] public allMinds;

    // define the Thought structure
    struct Mind {
        uint256 timestamp;
        string message;
    }

    // mapping to check if thoughts are initialized, last action, number of thought of an address and the owner of a thought
    mapping(uint256 => bool) private isInitialized;
    mapping(address => uint256) private totalOwnMinds;
    mapping(uint256 => address) private mindOwnerOf;
    mapping(address => uint256) private lastAction;

    // create this event for our React.app to use
    event throwMind(uint256 _currentIndex);
    event deleteMind();

    // set deployer address as the owner
    constructor() {
        owner = payable(msg.sender);
        throwNewMind("THIS IS THE GENESIS MESSAGE!");
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
            "Please wait up to 1 minute before throwing new mind again"
        );
        _;
    }

    // check if only the nonce points to an existing thought
    modifier checkMind(uint256 _nonce) {
        require(isInitialized[_nonce] == true, "Mind not existed!");
        _;
    }

    // throw new status to the blockchain
    function throwNewMind(string memory _message) public isInBreak {
        Mind memory tempStatus = Mind(block.timestamp, _message);
        isInitialized[allMinds.length] = true;
        totalOwnMinds[msg.sender] += 1;
        mindOwnerOf[allMinds.length] = msg.sender;
        allMinds.push(tempStatus);
        lastAction[msg.sender] = block.timestamp;
        emit throwMind(allMinds.length);
    }

    // delete thrown mind from the blockchain
    function deleteCurrentMind(uint256 _nonce) external checkMind(_nonce) {
        uint256 lastIndex = allMinds.length - 1;
        require(
            mindOwnerOf[_nonce] == msg.sender,
            "You are not the owner of this mind!"
        );
        require(
            _nonce < allMinds.length,
            "Please wait for at least 2 minds available!"
        );
        totalOwnMinds[msg.sender]--;
        mindOwnerOf[_nonce] = mindOwnerOf[lastIndex];
        allMinds[_nonce] = allMinds[lastIndex];
        allMinds.pop();
        emit deleteMind();
    }

    // view specific mind if input a nonce
    function viewMind(
        uint256 _nonce
    ) external view checkMind(_nonce) returns (Mind memory) {
        return allMinds[_nonce];
    }

    // return the nonce of thought from a specific address
    function viewAllNoncesOf() external view returns (uint256[] memory) {
        uint256[] memory result = new uint256[](totalOwnMinds[msg.sender]);
        uint counter = 0;
        for (uint i = 0; i < allMinds.length; i++) {
            if (mindOwnerOf[i] == msg.sender) {
                result[counter] = i;
                counter++;
            }
        }
        return result;
    }

    // return all minds
    function viewAllMinds() external view returns (Mind[] memory) {
        return allMinds;
    }

    // FOR OWNER: transfer to null address
    function renounceOwnership() external onlyOwner {
        owner = payable(address(0));
    }

    // FOR OWNER: self-destruct the contract
    function close() external onlyOwner {
        selfdestruct(owner);
    }
}
