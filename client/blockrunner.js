const utils = require("./utils")
const mempool = require('./mempool.js')
var Heap = require("heap");
const fs = require('fs');
const fetch = require('node-fetch');
const trader = require('./trader.js')
const ethers = require("ethers");
const config = require('./config.js');
var eutils = require("ethereumjs-util");


function write(array, fname) {
    fs.writeFileSync(fname, JSON.stringify(array, null, "\t"));
}


function toHex(val){
    if (typeof val == "string") {
      if (val.indexOf("0x") == 0) {
        return val;
      } else {
        val = new eutils.BN(val);
      }
    }

    if (typeof val == "number") {
      val = eutils.intToHex(val);
    }

    if (typeof val == "object") {
      val = val.toString("hex");
      if (val == "") {
        val = "0";
      }
    }

    return eutils.addHexPrefix(val);
}

function sort(txns) {
    var sortedByNonce = {};
    for (idx in txns){
      var tx = txns[idx]
      if (!sortedByNonce[toHex(tx.from)]){
        sortedByNonce[toHex(tx.from)] = [tx];
      } else {
        Array.prototype.push.apply(sortedByNonce[toHex(tx.from)], [tx]);
      }
    }
    var priceSort = function(a,b){
      return parseInt(toHex(b.gasPrice),16)-parseInt(toHex(a.gasPrice),16);
    }
    var nonceSort = function(a,b){
      return parseInt(toHex(a.nonce),16) - parseInt(toHex(b.nonce),16)
    }
  
    // Now sort each address by nonce
    for (address in sortedByNonce){
      Array.prototype.sort.apply(sortedByNonce[address], [nonceSort])
    }
  
    // Initialise a heap, sorted by price, for the head transaction from each account.
    var heap = new Heap(priceSort);
    for (address in sortedByNonce){
        if(typeof(sortedByNonce[address][0].gasPrice)=='object'){
            sortedByNonce[address][0].gasPrice = sortedByNonce[address][0].gasPrice.toNumber()
        }
        heap.push(sortedByNonce[address][0]);
        //Remove the transaction from sortedByNonce
        sortedByNonce[address].splice(0,1);
    }
    // Now reorder our transactions. Compare the next transactions from each account, and choose
    // the one with the highest gas price.
    sorted_transactions = [];
    while (heap.size()>0){
      best = heap.pop();
      if (sortedByNonce[toHex(best.from)].length>0){
        //Push on the next transaction from this account
        heap.push(sortedByNonce[toHex(best.from)][0]);
        sortedByNonce[toHex(best.from)].splice(0,1);
      }
      Array.prototype.push.apply(sorted_transactions, [best]);
    }
    txns = sorted_transactions;
    // for(x=0;x<txns.length;x++){
    //     console.log(txns[x].hash)
    // }
    return txns
}


module.exports = class BlockRunner {

    constructor(trader, bloxroute){
        this.trader = trader
        this.m = new mempool(bloxroute)
        this.m.run() //start the mempool cache
        this.fname = "default.txt"
        this.ARCRefreshIDs = {}
        this.indexing = {}
    }

    getIndex(tokenAddress){
      tokenAddress = tokenAddress.toLowerCase()
      if(tokenAddress in this.indexing){
        var index = this.indexing[tokenAddress]
        this.indexing[tokenAddress] += 1;
      }
      else{
        this.indexing[tokenAddress] = 0;
        var index = 0;
      }
      return index;
    }

    filter(tx){
        if(!('gas' in tx))
            tx['gas'] = tx['gasLimit']

        if(!('input' in tx))
            tx['input'] = tx['data']            

        return {
            'from': tx['from'],
            'gas': "0x"+Number(tx['gas'].toString()).toString(16),
            'gasPrice': "0x"+Number(tx['gasPrice'].toString()).toString(16),
            'data': tx['input'],
            'to': tx['to'],
            'value': "0x"+Number(tx['value'].toString()).toString(16),
            // 'nonce': tx['nonce']
        }
    }

    async sendRequestMulti(txns, blockNum){
        var txns = txns.map(this.filter)
        let body = {
            "jsonrpc":"2.0", 
            "method":"debug_traceMultiCall", 
            "params":[
                txns, 
                blockNum,
                {"disableStack": true, "disableMemory": true, "disableStorage": true},
                // {"tracer": this.customTracer}
                // {"tracer": "callTracer"}
            ], 
            "id":1
        }
        return fetch(config.nodeHTTP, {
            method: 'POST',
            body: JSON.stringify(body),
            headers: { 'Content-Type': 'application/json' }
        })
    }    
  
    async testMulti(txns, blockNum){
        return this.sendRequestMulti(txns, blockNum).then(
            traceObj => traceObj.json()
        )
    }

    async simulate(txns, blockNum="latest"){
        var callRes = await this.testMulti(txns, blockNum)
        callRes = callRes['result']
        return callRes
    }

    async run(tokenAddress, pairAddress, value, amountOutMin, targetAddress, mintargetBalance, gasPrice, gasLimit){
        // this will check if the sandwich will succeed or not through the blockrunner
        var t1 = Date.now()

        if(!gasLimit)
            gasLimit = 2000000

        var upperBread = this.trader.upperBread1(pairAddress, value, amountOutMin, targetAddress, mintargetBalance, gasPrice, gasLimit);
        var lowerBread = this.trader.lowerBread1(tokenAddress, pairAddress);
        // await new Promise(resolve => setTimeout(resolve, 100));


        // var successTxn = this.trader.getBuyTxn("BF", pairAddress, value, amountOutMin.mul(50).div(100), targetAddress, mintargetBalance, gasPrice, gasLimit);
        // var lowerBread = this.trader.getSellTxn(tokenAddress, pairAddress);

        var _mid = this.m.snapshot()
        var mid = []

        //remove own txns:
  
        _mid.forEach((element, index, _) => {
          if(!element['to'])
            mid.push(element)
          else if(element['to'].toLowerCase() != config.traderContractAddress.toLowerCase())
            mid.push(element)
        });
        
        var sandwich = mid

        sandwich.push(upperBread)
        // sandwich.push(successTxn)
        sandwich = sort(sandwich)
        sandwich.push(lowerBread)
        utils.log("[br] Sandwich length: "+sandwich.length)
        var tp = Date.now()
        try{
          var res = await this.simulate(sandwich)
          utils.log("[br] simulation error...")
        }
        catch{
          return true;
        }
        var tq = Date.now()
        utils.log("[br] Simulate time: " + (tq-tp)/1000)

        this.fname = tokenAddress+"_"+this.getIndex(tokenAddress)+".txt"
        var t2 = Date.now()
        utils.log("[br] block runner time: " + (t2-t1)/1000)
        console.log("br run: ", res.failed)
        if(!Boolean(res.failed))
            write(sandwich, "blocks/"+this.fname)            
        // write(sandwich, "blocks/"+this.fname)            
            
        return Boolean(res.failed)
    }

    async runInParts(targetHash, tokenAddress, pairAddress, value, amountOutMin, targetAddress, mintargetBalance, gasPrice, gasLimit){
      var t1 = Date.now()

      if(!gasLimit)
          gasLimit = 2000000

      var upperBread = this.trader.upperBread1(pairAddress, value, amountOutMin, targetAddress, mintargetBalance, gasPrice, gasLimit);
      var lowerBread = this.trader.lowerBread1(tokenAddress, pairAddress);

      var _mid = this.m.snapshot()
      console.log(_mid.length)
      var mid = []
      var targetTxn = false;


      _mid.forEach((element, index, _) => {
        
        if(element.hash.toLowerCase() == targetHash.toLowerCase())
          targetTxn = element

        if(!element['to'])
          mid.push(element)

        else if(element.hash.toLowerCase() != targetHash.toLowerCase() && element['to'].toLowerCase() != config.traderContractAddress.toLowerCase())
          mid.push(element)
      });

      console.log(mid.length)


      if(!targetTxn){
        utils.log("wtf no target given??")
        targetTxn = mid[0];
      }

      var tp = Date.now()
      var l = mid.length;
      var pl = 200;
      var nparts = parseInt(l/pl) + 1
      var promises = []
      for(var i=0; i<nparts; i++){
        var newMid = mid.slice(pl*i, pl*(i+1))
        newMid.push(targetTxn)
        var sandwich = [upperBread, ...sort(newMid), lowerBread]        
        promises.push(this.simulate(sandwich))
      }
      var failed;
      try{
        failed = false;
        var x = await Promise.all(promises)
        for(var i=0; i<x.length; i++){
          if(Boolean(x.failed))
            failed = true;
        }
      }
      catch{
        utils.log("[br] simulation error...")
        return true;
      }
      var tq = Date.now()
      utils.log("[br] Simulate time: " + (tq-tp)/1000)

      this.fname = tokenAddress+"_"+this.getIndex(tokenAddress)+".txt"
      var t2 = Date.now()
      utils.log("[br] block runner time: " + (t2-t1)/1000)
      console.log("br run: ", failed)
      if(!failed)
          write(sandwich, "blocks/"+this.fname)            
          
      return failed
  }    

    async launchARC(tokenAddress, pairAddress, gasPrice){
      //ARC -- Active Rug Combat
      //After buy, keep checking if rug
      utils.log("[br] Launching ARC for: "+tokenAddress);
      var i = 0;
      var refreshIntervalId = setInterval(async () => {
        this.ARCRefreshIDs[tokenAddress] = refreshIntervalId
        i += 1
        if(i>29){ //run ARC for 2.9 seconds.
          this.stopARC(tokenAddress)
          return
        }
        let failed = await this.rugCheck(tokenAddress, pairAddress) 
        if(failed){
          utils.log("\n\n[br] ARC SCAM DETECTION!!! \n\n");
          utils.log("[br] Launching blacklist...");
          utils.log("[br] Stopping ARC for: "+tokenAddress);
          this.stopARC(tokenAddress)
          this.trader.blackList(gasPrice.add(ethers.utils.parseUnits(config.blackListGasBumpGwei, "gwei")))   
        }

      }, 100)      
    }

    async stopARC(tokenAddress){
      utils.log("[br] Stopping ARC for: "+tokenAddress);
      clearInterval(this.ARCRefreshIDs[tokenAddress]);
    }

    async rugCheck(tokenAddress, pairAddress){
      //this will check if the token got rugged or not
      //call this again and again after buying somerhing until bought
      var gasPrice = ethers.utils.parseUnits("5", "gwei")
      var gasLimit = config.gasLimit
      var value = ethers.utils.parseUnits(config.rugCheckEth, "ether")

      var upperBread = this.trader.upperBread2(value, tokenAddress, pairAddress, gasPrice, gasLimit);
      var lowerBread = this.trader.lowerBread2(tokenAddress, pairAddress);

      var _mid = this.m.snapshot()
      var mid = []

      _mid.forEach((element, index, _) => {
        if(!element['to'])
          mid.push(element)
        else if(element['to'].toLowerCase() != config.traderContractAddress.toLowerCase())
          mid.push(element)
      });

      var sandwich = [upperBread, ...sort(mid), lowerBread]
      var res = await this.simulate(sandwich)

      if(Boolean(res.failed)){
        let fname = "rugs/"+tokenAddress+"_"+this.getIndex(tokenAddress)+"_RUGGED.txt"
        write(sandwich, fname)
      }
          
      return Boolean(res.failed)
    }
}