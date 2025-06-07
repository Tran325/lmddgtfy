pragma solidity ^0.8.13;

contract Mommy {

    address[] internal sds;

    function createOne(bytes memory code, uint256 salt) payable public{
        assembly {
            pop(create2(
                0, 
                add(0x20, code), 
                mload(code), 
                salt
            ))
        }
    }

    function create(bytes memory code, uint saltLow, uint saltHigh) payable public{
        while(saltLow < saltHigh){
            createOne(code, saltLow);
            saltLow++;
        }
    }
}