// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract BynomoTreasury {
    address public owner;

    event Received(address from, uint256 amount);
    event Withdrawn(address to, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    receive() external payable {
        emit Received(msg.sender, msg.value);
    }

    function withdraw(address payable to, uint256 amount) external onlyOwner {
        require(address(this).balance >= amount, "Insufficient balance");
        to.transfer(amount);
        emit Withdrawn(to, amount);
    }
}
