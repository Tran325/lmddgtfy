pragma solidity ^0.8.13;

interface ISelfDestruct {
    function die(address payable self) external;
}