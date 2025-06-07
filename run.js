const bloxRoute = require("./bloxroute.js")
const Web3 = require("web3");
const fs = require("fs");
const ethers = require("ethers");
const Trader = require("./trader.js")
const DexEvents = require("./dexevents.js");
const config = require('./config.js');
const utils = require("./utils.js");

const bloxroute = new bloxRoute()
bloxroute.run()
var web3 = new Web3(new Web3.providers.WebsocketProvider(config.nodeWSS));
const trader = new Trader(bloxroute);
const dexEvents = new DexEvents(web3, trader, bloxroute);


utils.log(config);

function modifyGas(gasPrice){
    return Number(gasPrice) + 5000000000;
}
  
function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

const delay = ms => new Promise(resolve => setTimeout(resolve, ms))  

async function order(tx, tokenAddress, pairAddress, value, amountOutMin, targetAddress, mintargetBalance, gasPrice, gasGears, doPGA){

    // trader.buy(tokenAddress, value, gas, null)
    await trader.buy_frcheck(tokenAddress, pairAddress, value, amountOutMin, targetAddress, mintargetBalance, gasPrice, null, gasGears, doPGA)
    // await sleep(500);
    await trader.sell(tokenAddress, pairAddress, tx.gasPrice, null)
    // utils.log("Waiting 10 seconds...")
    // await delay(10000) //wait 10 seconds
    // utils.log("Done waiting 10 seconds...")
    // run();
}

var debug = true;

function run(){
    dexEvents.startProcessing()
  
    dexEvents.on("target", (transaction, tokenAddress, pairAddress, value, amountOutMin, targetAddress, mintargetBalance, gasPrice, gasGears, doPGA) => {
        // checkAndExecuteOrder(transaction);
        // if(doPGA && debug){
            // debug = false;
            doPGA  = true;
            order(transaction, tokenAddress, pairAddress, value, amountOutMin, targetAddress, mintargetBalance, gasPrice, gasGears, doPGA);
        // }
        // dexEvents.stopProcessing()
    });
}

run()

