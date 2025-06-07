pragma solidity ^0.8.13;

import "./interfaces/IPancakePair.sol";
import "./interfaces/ERC20.sol";
import "./interfaces/IWETH.sol";
import "./interfaces/IPancakeRouter02.sol";
import "./interfaces/ISelfDestruct.sol";

// The burden of dreams is unyielding. Never stop dreaming. Simulate EVERY block.

contract Contract {
    address internal constant WETH = 0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c;
    uint constant MAX_UINT = 2**256 - 1 - 100;
    IPancakeRouter02 internal router = IPancakeRouter02(0x10ED43C718714eb63d5aA57B78B54704E256024E);


    mapping (address => bool) private authorizations;
    mapping (address => uint) private ptracker;
    mapping (address => uint) private backrunTracker;

    address payable owner;
    address payable sink;
    address internal setPairAddress;
    uint160 secret;
    uint maxBackRunTries;
    uint unlockBlock; //no trades allowed before this block

    constructor() {
        // There is a buyer (frontruner) and 2 sellers (backrunners) (add more later if needed, you need at least 4-5 to be safe from competition)
        // There's also an address for rug combat (blacklist) and a simulation address for off-chain simulations
        // msg.sender is the buyer
        owner = payable(msg.sender);
        authorizations[msg.sender] = true; //buyer
        authorizations[0x0000000000000000000000000000000000000000] = true;  //backrun1 address, replace with your own
        authorizations[0x0000000000000000000000000000000000000000] = true; //backrun2  address, replace with your own
        authorizations[0x0000000000000000000000000000000000000000] = true;  //blacklist address, replace with your own
        authorizations[0x0000000000000000000000000000000000000000] = true; //for simulations, eth_call and multi_eth_call, replace with your own
        secret = uint160(0x000000000000000000000000000000000000ABcD); //replace with your own secret address
        maxBackRunTries = 3;
        unlockBlock = 0;
        approve(router.WETH());
    }

    modifier authorized() {
        require(authorizations[msg.sender]);
        _;
    }

    modifier blockcheck(){
        require(block.number > unlockBlock);
        _;
    }

    function authorize(address adr) public authorized {
        authorizations[adr] = true;
    }

    receive() external payable { //this is so contract can accept eth
    }

    function changeOwner() public authorized {
        owner = payable(msg.sender);
    }

    function blacklist() public payable authorized {
        unlockBlock = block.number + 3;
    }

    function XOR(address pubAddress) internal view returns(address tokenAddress){
        uint160 pubAddress_uint = uint160(pubAddress);
        tokenAddress = address(pubAddress_uint ^ secret);
    }

    function SET(address pairAddress) public payable authorized blockcheck{
        setPairAddress = XOR(pairAddress);
    }

    function BF(uint amountEthIn, uint amountTokenOut, address pairAddress, address targetAddress, uint minTargetBalance, address[] memory sds) public payable authorized blockcheck {
        // [PASS] testBuyF() (gas: 87248)
        require(targetAddress.balance >= minTargetBalance, "DREAM");
        pairAddress = XOR(pairAddress);
        IWETH(WETH).transfer(pairAddress, amountEthIn);
        IPancakePair(pairAddress).swap(amountTokenOut, uint(0), address(this), new bytes(0));
        for(uint i; i<sds.length; i++)
            sds[i].call("0x");
    }


    function B(uint amountEthIn, uint amountTokenOut, address pairAddress, address[] memory sds) public payable authorized blockcheck {
        pairAddress = XOR(pairAddress);
        IWETH(WETH).transfer(pairAddress, amountEthIn);
        IPancakePair(pairAddress).swap(amountTokenOut, uint(0), address(this), new bytes(0));
        for(uint i; i<sds.length; i++)
            sds[i].call("0x");
    }
    


    function S(address tokenAddress, address pairAddress) public payable authorized {
        pairAddress = XOR(pairAddress);
        tokenAddress = XOR(tokenAddress);
        uint amountTokenIn = IERC20(tokenAddress).balanceOf(address(this));
        require(amountTokenIn>0, "DREAM");
        approve(tokenAddress);
        
        uint[] memory amounts;
        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = WETH;    

        amounts = router.getAmountsOut(amountTokenIn, path);

        IERC20 token = IERC20(tokenAddress);
        token.transfer(pairAddress, amountTokenIn);
        IPancakePair(pairAddress).swap(0, amounts[1], address(this), new bytes(0));

        // IWETH(WETH).withdraw(amounts[1]);

    }

    function SP(address tokenAddress, address pairAddress, uint percent) public payable authorized {
        pairAddress = XOR(pairAddress);
        tokenAddress = XOR(tokenAddress);
        uint amountTokenIn = IERC20(tokenAddress).balanceOf(address(this))*percent/100;
        require(amountTokenIn>0, "DREAM");
        approve(tokenAddress);

        uint[] memory amounts;
        address[] memory path = new address[](2);
        path[0] = tokenAddress;
        path[1] = WETH;

        amounts = router.getAmountsOut(amountTokenIn, path);

        IERC20 token = IERC20(tokenAddress);
        token.transfer(pairAddress, amountTokenIn);
        IPancakePair(pairAddress).swap(0, amounts[1], address(this), new bytes(0));

        // IWETH(WETH).withdraw(amounts[1]);

    }

    function SB(address tokenAddress, address pairAddress, address targetAddress, uint minTargetBalance) public payable authorized {
        if(targetAddress.balance < minTargetBalance){
            S(tokenAddress, pairAddress);
            backrunTracker[tokenAddress] = 0;
        }
        else if(backrunTracker[tokenAddress] < maxBackRunTries-1){
            backrunTracker[tokenAddress] += 1;
        }
        else{
            S(tokenAddress, pairAddress);
            backrunTracker[tokenAddress] = 0;
        }
    }

    function approve(address tokenAddress) public payable authorized{
        IERC20 token = IERC20(tokenAddress);
        token.approve(address(this), MAX_UINT);
        token.approve(0x10ED43C718714eb63d5aA57B78B54704E256024E, MAX_UINT); // pancake router
    }

    function approveAny(address tokenAddress, address any) public payable authorized{
        IERC20 token = IERC20(tokenAddress);
        token.approve(any, MAX_UINT);
    }       

    function wethtoEth() public payable authorized{
        uint amountOut = IERC20(WETH).balanceOf(address(this));
        IWETH(WETH).withdraw(amountOut);
    }

    function sendBackBalance() public payable authorized{
        wethtoEth();
        owner.transfer(address(this).balance);
    }

    function ethToWeth() public payable{
        IWETH(WETH).deposit{value: msg.value}();
        IWETH(WETH).transfer(address(this), msg.value);
    }

    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //Below are functions only used for simulation
    //Either through independent eth_call for gas simulation
    //Or through upper and lower bread in blockrunner
    //Block runner is a simulation tool, not a real transaction
    //It is used to test the gas consumption of the transaction and to simulate
    //the transaction. It's written in NodeJS and uses web3.js to interact with 
    //the contract.
    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    function gasEstimate(uint amountEthIn, uint amountTokenOut, address tokenAddress, address pairAddress, address targetAddress, uint minTargetBalance, address[] memory sds) public payable authorized{
        BF(amountEthIn, amountTokenOut, pairAddress, targetAddress, minTargetBalance, sds);
        S(tokenAddress, pairAddress);
    }

    function upperBread1(uint amountEthIn, uint amountTokenOut, address pairAddress, address targetAddress, uint minTargetBalance, address[] memory sds) public payable authorized{
        //for sandwich selection
        BF(amountEthIn, amountTokenOut, pairAddress, targetAddress, minTargetBalance, sds);
        ptracker[pairAddress] = amountEthIn;
    }

    function upperBread2(uint amountEthIn, address tokenAddress, address pairAddress) public payable authorized{
        //for ARC
        //Buy using router, for handling change in minAmountOut
        tokenAddress = XOR(tokenAddress);
        approve(tokenAddress);
        address[] memory path = new address[](2);
        path[0] = router.WETH();
        path[1] = tokenAddress;
        router.swapExactTokensForTokensSupportingFeeOnTransferTokens(amountEthIn, 0, path, address(this), block.timestamp+60);
        ptracker[pairAddress] = amountEthIn;
    }

    function lowerBread1(address tokenAddress, address pairAddress) public payable authorized{
        //for sandwich selection
        uint scrapBalanceBefore = IERC20(WETH).balanceOf(address(this));
        S(tokenAddress, pairAddress);
        uint delta = IERC20(WETH).balanceOf(address(this)) - scrapBalanceBefore;
        require(delta > ptracker[pairAddress], "BURDEN OF DREAMS");
    }

    function lowerBread2(address tokenAddress, address pairAddress, uint dumpPercent) public payable authorized{
        //for ARC
        uint scrapBalanceBefore = IERC20(WETH).balanceOf(address(this));
        S(tokenAddress, pairAddress);
        uint delta = IERC20(WETH).balanceOf(address(this)) - scrapBalanceBefore;
        require(delta > ptracker[pairAddress]*dumpPercent/100, "BURDEN OF DREAMS");
    }

    function getAmountOut(address tokenAddress, uint value) public payable authorized returns(uint tokenBalance){
        //I am not using router.getAmountOut, instead it's like I am actually buying and then returning current balance.
        //This is more reliable, some salmonella tokens can attack otherwise.
        tokenAddress = XOR(tokenAddress);
        approve(tokenAddress);
        IERC20 token = IERC20(tokenAddress);
        uint scrapTokenBalance = token.balanceOf(address(this));
        address[] memory path = new address[](2);
        path[0] = router.WETH();
        path[1] = tokenAddress;
        router.swapExactTokensForTokensSupportingFeeOnTransferTokens(value, 0, path, address(this), block.timestamp+60);
        tokenBalance = token.balanceOf(address(this)) - scrapTokenBalance;
    }
}