// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import "forge-std/Test.sol";
import "src/Contract.sol";
import "src/interfaces/IPancakeFactory.sol";
import "src/interfaces/IPancakeRouter02.sol";


contract ContractTest is Test {
    Contract c;

    address internal pairAdress;
    int internal amontsOut;
    // Constants for bsc
    address internal WETH = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    IPancakeFactory internal factory = IPancakeFactory(0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73);
    IPancakeRouter02 internal router = IPancakeRouter02(0x10ED43C718714eb63d5aA57B78B54704E256024E);
    address internal constant routerAddress = 0x10ED43C718714eb63d5aA57B78B54704E256024E;

    uint internal amountEthIn;
    uint internal amountTokenOut;
    address internal tokenAddress;
    address internal pairAddress;

    address internal targetAddress;
    uint internal minTargetBalance;


    address[] internal sds;

    receive() external payable {
    }

    function XOR(address pubAddress) internal pure returns(address resolvedTokenAddress){
        uint160 pubAddress_uint = uint160(pubAddress);
        uint160 secret = uint160(0x0000000000000000000000000000000000000000); // replace with your own secret address
        resolvedTokenAddress = address(pubAddress_uint ^ secret);
    }

    function setUp() public {
        c = new Contract();

        //Off-Chain Computations
        tokenAddress = 0x000000000000000000000000000000000000dEaD; // replace with random token
        amountEthIn = 100000000000000000;
        pairAddress = factory.getPair(tokenAddress, WETH);
        c.ethToWeth{value:amountEthIn*10}();

        address[] memory path = new address[](2);
        path[0] = WETH;
        path[1] = tokenAddress;
        uint[] memory amounts;
        amounts = router.getAmountsOut(amountEthIn, path);
        amountTokenOut = amounts[1];
        console.log("amountTokenOut1");
        console.log(amountTokenOut);
        // amountTokenOut = c.getAmountOut(tokenAddress, amountEthIn, 0);
        // console.log("amountTokenOut2");
        // console.log(amountTokenOut);

        targetAddress = 0x000000000000000000000000000000000000dEaD; // replace with random target address
        minTargetBalance = 1;


        sds = new address[](1);
        sds[0] = address(sd);


        sds = new address[](0);
        sds = [0x000000000000000000000000000000000000dEaD]; // replace


        tokenAddress = XOR(tokenAddress);
        pairAddress = XOR(pairAddress);
        c.BF(amountEthIn, amountTokenOut, pairAddress, targetAddress, minTargetBalance, sds);

        amounts = router.getAmountsOut(amountEthIn, path);
        amountTokenOut = amounts[1];

        tokenAddress = XOR(tokenAddress);
        pairAddress = XOR(pairAddress);

    }

    function testApprove() public {
        c.approve(XOR(tokenAddress));
    }

    function testBlacklistFail() public{
        c.blacklist();
        c.BF(amountEthIn, amountTokenOut, pairAddress, targetAddress, minTargetBalance, sds);
    }

    function testBlacklistSucceed() public{
        c.blacklist();
        vm.roll(block.number+5);
        c.BF(amountEthIn, amountTokenOut, pairAddress, targetAddress, minTargetBalance, sds);
    }

    function testBuyF() public{
        c.BF(amountEthIn, amountTokenOut, pairAddress, targetAddress, minTargetBalance, sds);
    }

    function testBuy() public{
        c.B(amountEthIn, amountTokenOut, pairAddress, sds);
    }

    function testSell() public{
        c.BF(amountEthIn, amountTokenOut, pairAddress, targetAddress, minTargetBalance, sds);
        c.S(tokenAddress, pairAddress);
    }

    function testGasEstimate() public{
        c.gasEstimate(amountEthIn, amountTokenOut, tokenAddress, pairAddress, targetAddress, minTargetBalance, sds);
    }

    function testSelfDestruct() public{
        SelfDestruct sd = new SelfDestruct();
        sd.die(payable(address(sd)));
    }

    function testSandwich() public{
        c.upperBread1(amountEthIn, amountTokenOut, pairAddress, targetAddress, minTargetBalance, sds);
        c.BF(amountEthIn, amountTokenOut/2, pairAddress, targetAddress, minTargetBalance, sds);
        c.lowerBread1(tokenAddress, pairAddress);
    }

    function testSandwichFail() public{
        c.upperBread1(amountEthIn, amountTokenOut, pairAddress, targetAddress, minTargetBalance, sds);
        c.lowerBread1(tokenAddress, pairAddress);
    }

    function testRug() public{
        c.upperBread2(amountEthIn, tokenAddress, pairAddress);
        c.lowerBread2(tokenAddress, pairAddress, 50);
    }

    function testRugFail() public{
        c.BF(amountEthIn, amountTokenOut, pairAddress, targetAddress, minTargetBalance, sds);
        c.upperBread2(amountEthIn, tokenAddress, pairAddress);
        c.SP(tokenAddress, pairAddress, 99);
        c.lowerBread2(tokenAddress, pairAddress, 99);
    }

    function testDump() public{
        c.upperBread1(amountEthIn, amountTokenOut, pairAddress, targetAddress, minTargetBalance, sds);
        c.lowerBread2(tokenAddress, pairAddress, 90);
    }

    function testBackrun() public{
        c.BF(amountEthIn, amountTokenOut, pairAddress, targetAddress, minTargetBalance, sds);
        c.SB(tokenAddress, pairAddress, targetAddress, minTargetBalance);
        c.SB(tokenAddress, pairAddress, targetAddress, minTargetBalance);
        c.SB(tokenAddress, pairAddress, targetAddress, minTargetBalance);
    }

    function testAmountsOut() public{
        uint out = c.getAmountOut(tokenAddress, amountEthIn);
        console.log("Amount out: ");
        console.log(out);
    }
}
