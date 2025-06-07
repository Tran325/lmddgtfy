// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "src/Mommy.sol";


contract ContractTest is Test {
    Mommy m;
    function setUp() public {
        m = new Mommy();
    }

    function testCreate() public{
        bytes memory code = hex"";
        m.create(code, 0, 255);
    }
}