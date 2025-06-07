const blockRunner = require('./blockrunner.js');
const ethers = require("ethers");
const EventEmitter = require("events");
const config = require('./config.js');
const abiDecoder = require("abi-decoder");
const optimality = require("./optimality.js");
const utils = require("./utils")
const pancake_abi = require("./abi/pcs_router.json");

abiDecoder.addABI(pancake_abi);

function _prettyGases(gases){
  var s = "| "
  for(var i=0; i<gases.length; i++)
    s += ethers.utils.formatUnits(gases[i], "gwei") + " | "
  return s
}

module.exports = class DexEvents extends EventEmitter {
  constructor(web3, trader, bloxroute){
    super();
    this.web3 = web3;
    this.stop = false;
    this.trader = trader;
    this.br = new blockRunner(trader, bloxroute);
    trader.br = this.br; //such an ugly solution, eww
    this.ob = new optimality();
    this.bloxroute = bloxroute;
  }

  async stopProcessing() {
    console.log("Stopping dexevents...")
    this.stop = true;
  }

  async optimalBuyer(tokenAddress, targetEth, targetAmountOutMin){
    return this.ob.run(tokenAddress, targetEth, targetAmountOutMin)
  }

  async gasGearsEstimate(profit, value, amountOutMin, tokenAddress, pairAddress){
    try{
      var gasLimitEstimate =  await this.trader.estimateGas(value, amountOutMin, tokenAddress, pairAddress)
      var levels = [
        profit.div(gasLimitEstimate),
        profit.div(gasLimitEstimate.sub(ethers.BigNumber.from("31000", "wei"))),
        profit.div(gasLimitEstimate.sub(ethers.BigNumber.from("47000", "wei"))),
        profit.div(gasLimitEstimate.sub(ethers.BigNumber.from("55000", "wei"))),
      ]
    }
    catch (e){
      var gasLimitEstimate = -1
      var levels = [
        ethers.BigNumber.from("0"),
        ethers.BigNumber.from("0"),
        ethers.BigNumber.from("0"),
      ]
    }
    return [levels, gasLimitEstimate];
  }

  async startProcessing() {
    this.stop = false;
    console.log("Starting dexevents...")
    this.bloxroute.streamWs.on('message', async (streamObj) => {

      streamObj = JSON.parse(streamObj)

      if(this.stop || !streamObj.params)
        return

      var tx = streamObj.params.result.txContents
      if(!tx)
        return

      var x1 = Date.now()
      tx.gasPrice = ethers.BigNumber.from(tx.gasPrice).toString()
      var networkGas = ethers.utils.parseUnits(config.networkDefaultGasGwei, "gwei")
      var targetGas =  ethers.utils.parseUnits(tx.gasPrice, "wei")
      if(tx.to && tx.to.toLowerCase()==config.dexRouterAddress.toLowerCase() && targetGas.gte(networkGas)) {
            tx.gas = Number(ethers.BigNumber.from(tx.gas).toString())
            tx.nonce = Number(ethers.BigNumber.from(tx.nonce).toString())
            tx.value = ethers.BigNumber.from(tx.value).toString()
            // tx.gasPrice = ethers.BigNumber.from(tx.gasPrice).toString()

            try
            {
              var decodedInput = abiDecoder.decodeMethod(tx.input);
              tx['dinput'] = decodedInput;
            }
            catch{
              return
            }

            if(!tx.dinput || !tx.dinput.name)
                  return false;

            var targetEthIn = ethers.utils.parseUnits(tx.value.toString(), "wei")
            var minTargetEthIn = ethers.utils.parseUnits(config.minTargetEthIn, "ether")

            if(
              decodedInput.name === "swapExactETHForTokens" &&
              decodedInput.params[1]['value'].length===2 &&
              targetEthIn.gte(minTargetEthIn)
            ){
              var tokenAddress = decodedInput.params[1]['value'][1];
              var targetAmountOutMin = ethers.utils.parseUnits(decodedInput.params[0].value.toString(), "wei")

              var x2 = Date.now()
              var out = await this.optimalBuyer(tokenAddress, targetEthIn, targetAmountOutMin)
              var attackEthIn = out[0]
              var profit = out[1]
              var reserveIn = out[2]
              var reserveOut = out[3]
              var pairAddress = out[4]
              var doPGA = out[5]
              var attackTokenOut = out[6]
              var minprofitEth = ethers.utils.parseUnits(config.minprofitEth.toString(), "ether")
              // utils.log("https://bscscan.com/tx/"+tx.hash)
              // utils.log("Optimal buy checked in: " + ((Date.now()-x2)/1000).toString()+out+"\n")
              // console.log("Optimal buy checked in: " + ((Date.now()-x2)/1000).toString()+out+"\n")
            
              // var _profitFailed = await this.br.checkProfit(tx, tokenAddress, attackEthIn, "0", gasPrice);
              // console.log("Is profit checked in: " + ((Date.now()-x2)/1000).toString()+"\n")

              if(profit && profit.gte(minprofitEth) && attackEthIn){
                let readable_attackEth = attackEthIn.toString()/10**18
                let readable_attackTokenOut = attackTokenOut.toString()/10**18
                let readable_targetEth = targetEthIn.toString()/10**18
                let readable_profit = profit.toString()/10**18
                
                var minTargetBalance = await this.web3.eth.getBalance(tx.from);
                // if(profit.gte(ethers.utils.parseUnits("0.01069", "ether")))
                  // var gasPrice = ethers.utils.parseUnits(tx.gasPrice, "wei").add(ethers.utils.parseUnits("20", "gwei"))
                // else

                var value = attackEthIn
                var amountOutMin = await this.trader.getAmountOutMin(tokenAddress, value, config.slippage)
                if(!amountOutMin){
                  return
                }
                var minGasPrice = ethers.utils.parseUnits(tx.gasPrice, "wei").add(ethers.utils.parseUnits("1", "gwei"))
                var out = await this.gasGearsEstimate(profit, value, amountOutMin, tokenAddress, pairAddress)
                var gasGears = out[0]
                var gasLimitEstimate = out[1]
                var maxGasPrice = gasGears[gasGears.length - 1] //Consider the no self destruct gas as the max for safety

                if(minGasPrice.gte(maxGasPrice))
                  return 
                
                var gasPrice = minGasPrice.mul(config.alpha).div(100).add(maxGasPrice.mul(100-config.alpha).div(100)); //linear interpolation

                if(maxGasPrice.lte(networkGas)) //can't profit or target wont ever confirm
                  return

                if(gasPrice.lte(networkGas))
                  gasPrice = networkGas


                utils.log("\n\n\n>>> Target: " + "https://bscscan.com/tx/"+tx.hash)
                utils.log("Possible profit: " + readable_profit)
                utils.log("GasGears: " + _prettyGases(gasGears))
                utils.log("gasLimitEstimate: " + gasLimitEstimate.toString())
                utils.log("Max Possible gas gwei: " + ethers.utils.formatUnits(maxGasPrice, "gwei"))


                let _brFailed = await this.br.run(tokenAddress, pairAddress, value, amountOutMin, tx.from, minTargetBalance, gasPrice);
                // In parts gets scemmed
                // let _brFailed = await this.br.runInParts(tx.hash, tokenAddress, pairAddress, value, amountOutMin, tx.from, minTargetBalance, gasPrice);
                
                if(!_brFailed){
                  // utils.log(">>> Target: " + "https://bscscan.com/tx/"+tx.hash)
                  utils.log("readable_profit: " + readable_profit)
                  utils.log("readable_attackEth: " + readable_attackEth)
                  utils.log("readable_attackTokenOut: " + readable_attackTokenOut)
                  utils.log("readable_targetEth: " + readable_targetEth)
                  utils.log("readable_reserveIn: " + reserveIn)
                  utils.log("readable_reserveOut: " + reserveOut)
                  utils.log("amountOutMin: " + amountOutMin.toString())
                  utils.log("minTargetBalance: " + minTargetBalance.toString())
                  utils.log("tokenAddress: " + tokenAddress)
                  utils.log("pairAddress: " + pairAddress)
                  utils.log("GasGears: " + gasGears)
                  utils.log("MaxGas: " + ethers.utils.formatUnits(maxGasPrice, "gwei"))
                  utils.log("MinGas: " + ethers.utils.formatUnits(minGasPrice, "gwei"))
                  utils.log("Gas: " + ethers.utils.formatUnits(gasPrice, "gwei"))

                  utils.log("doPGA: " + doPGA)
                  utils.log("BURDENED BY DREAMS")

                  this.emit(
                    "target", 
                    tx, 
                    tokenAddress, 
                    pairAddress, 
                    value, 
                    amountOutMin, 
                    tx.from, 
                    minTargetBalance, 
                    gasPrice, 
                    gasGears, 
                    doPGA,
                  );
                  utils.log("Trade Emitted in: " + ((Date.now()-x1)/1000).toString())
                }
                else
                  utils.log("Blockrunner says fug off~")
              }
            }
          } //end of dex txn
        });
  }
};
