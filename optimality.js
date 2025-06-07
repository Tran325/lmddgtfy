const config = require('./config.js');
const { ethers } = require("ethers");
var Web3 = require('web3');
var utils = require("./utils")

const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"
const PCSFactoryAddress = "0xcA143Ce32Fe78f1f7019d7d551a6402fC5350c73"

class LF {
    constructor(){
        this.provider = new Web3.providers.WebsocketProvider(config.nodeWSS)
        this.web3 = new Web3(this.provider)
        this.factory_abi = utils.readJson('./abi/factory_abi.json');
        this.pair_abi = utils.readJson('./abi/pair_abi.json');
        this.pcs_factory = new this.web3.eth.Contract(this.factory_abi, PCSFactoryAddress);
    }

    async getPairAddress(token){
        let pair_address = await this.pcs_factory.methods.getPair(
            WBNB,
            token
        ).call()
        return pair_address;
    }

    async fetchLiquidity(token){
        let reference = WBNB
        let pairAddress = await this.getPairAddress(token)

        if (!pairAddress)
            return false;

        let pair = new this.web3.eth.Contract(this.pair_abi, pairAddress);
        let out = await pair.methods.getReserves().call()
        let reserve0 = out._reserve0
        let reserve1 = out._reserve1
        let token0 = await pair.methods.token0().call()
        let token1 = await pair.methods.token1().call() //??
        let BNBReserve = 0
        let tokenReserve = 0
        if (token0.toLowerCase() == reference.toLowerCase()){
            BNBReserve = reserve0
            tokenReserve = reserve1
        }
        else{
            BNBReserve = reserve1
            tokenReserve = reserve0
        }
        return {
            "BNBReserve":BNBReserve,
            "tokenReserve":tokenReserve,
            "pairAddress": pairAddress,
        }
    }
}

class OptimalBuy {
    constructor(){
        this.lf = new LF()
    }

    async getPairAddress(tokenAddress){
        var pairAddress = await this.lf.getPairAddress(tokenAddress);
        return pairAddress;
    }

    getAmountsOut(amountIn, reserveIn, reserveOut){
        let amountInWithFee = amountIn.mul(9975)
        let numerator = amountInWithFee.mul(reserveOut)
        let denominator = reserveIn.mul(10000).add(amountInWithFee)
        let amountOut = numerator.div(denominator)
        return amountOut
    }

    computeProfit(attackIn, attackOut, targetIn, targetOut, liquidity){
        // let afterReserveIn = ethers.BigNumber.from(liquidity['token_liq']).sub(targetOut).sub(attackOut)
        // let afterReserveOut = ethers.BigNumber.from(liquidity['bnb_liq']).add(targetIn).add(attackIn)

        let afterReserveIn = ethers.BigNumber.from(liquidity['tokenReserve']).sub(targetOut)
        let afterReserveOut = ethers.BigNumber.from(liquidity['BNBReserve']).add(targetIn)

        let attackFinalOut = this.getAmountsOut(attackOut, afterReserveIn, afterReserveOut)
        let profit = attackFinalOut.sub(attackIn)
        return profit
    }

    async run(tokenAddress, targetIn, minTargetOut){
        try{
            var liquidity = await this.lf.fetchLiquidity(tokenAddress);
        }
        catch{
            utils.log("[optimality] Can't fetch liquidity for: "+tokenAddress)
            return [false, false]
        }
        // console.log("Liquidity: ", liquidity)
        var reserveIn = ethers.BigNumber.from(liquidity['BNBReserve']);
        var reserveOut = ethers.BigNumber.from(liquidity['tokenReserve']);
        var pairAddress = ethers.BigNumber.from(liquidity['pairAddress']);

        let MIN_BUY_AMT = 0.005;
        var LOW = 0
        var HIGH = Number(config.maxAttackEth)
        var ntries = config.nSearchSteps
        let i = 0;
        let optimalAttackIn = -1;
        let optimalAttackOut = -1;
        var doPGA = false;

        //binary search for optimal buy amount
        while(i<ntries){
            let curAttackIn = (LOW + HIGH) / 2;
            if (curAttackIn < MIN_BUY_AMT){
                console.log("[Optimality] Stopping: ", curAttackIn, " | ", MIN_BUY_AMT);
                optimalAttackIn = -1;
                break;
            }
            var attackIn = ethers.utils.parseUnits(curAttackIn.toString(), "ether");
            var attackOut = this.getAmountsOut(attackIn, reserveIn, reserveOut);
            var targetOut = this.getAmountsOut(targetIn, reserveIn.add(attackIn), reserveOut.sub(attackOut));
            if(targetOut.gt(minTargetOut)){
                // console.log("Can buy for: ", curAttackIn);
                optimalAttackIn = attackIn;
                optimalAttackOut = attackOut;
                LOW = curAttackIn;
            }
            else{
                HIGH = curAttackIn;
                doPGA = true;
            }
            i += 1;
        }
        if(optimalAttackIn==-1)
            return [false, false, false, false, false, false, false]

        var profit = this.computeProfit(optimalAttackIn, attackOut, targetIn, targetOut, liquidity);
        return [optimalAttackIn, profit, reserveIn, reserveOut, pairAddress, doPGA, optimalAttackOut];
    }

}

// async function test(){
//     let tokenAddress = ""
//     let targetIn = ethers.utils.parseUnits("5.02", "ether")
//     let minTargetOut = ethers.utils.parseUnits("84321040807852313099", "wei")
//     var ob = new OptimalBuy()
//     var t1 = Date.now()
//     var out = await ob.run(tokenAddress, targetIn, minTargetOut)
//     console.log("Time taken: ", (Date.now()-t1)/1000)
//     console.log("Out: ", out)
//     console.log("AttackEth: ", out[0].toString()/10**18)
//     console.log("Out: ", out[1].toString()/10**18)
// }

// test()

module.exports = OptimalBuy