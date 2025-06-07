const bloxRoute = require("./bloxroute.js")
const Web3 = require("web3");
const ethers = require("ethers");
const config = require('./config.js');
const optimality = require("./optimality.js");
const utils = require("./utils")



class DexEvents {
  constructor(web3){
    this.web3 = web3;
    this.ob = new optimality();
    this.bloxroute = new bloxRoute()
  }
  
  // async startProcessing1() {
  //   console.log("Starting dexevents...")
  //   var c = 0
  //   this.web3.eth.subscribe("pendingTransactions", (error, txhash) => {
  //       this.web3.eth.getTransaction(txhash, async (error, tx) => {
  //           c += 1
  //           // console.log(tx)
  //           console.log("NODE: ", c)
  //       });
  //   })
  // }

  async startProcessing2() {
    var c = 0;
    const stream = await this.bloxroute.subscribe()
    stream.on('message', (streamObj) => {
        streamObj = JSON.parse(streamObj)
        if(!streamObj.params)
            return
        var txn = streamObj.params.result.txContents
        console.log(txn)
        c += 1
        console.log("BLOXROUTE: ", c)
    })

    stream.on('error', function (event) {
      console.log('WebSocket error: ', event);
    }); 
  }
  
  // async startProcessing3() {
  //   const stream = await this.bloxroute.subscribeBlocks()
  //   stream.on('message', (streamObj) => {
  //       streamObj = JSON.parse(streamObj)
  //       if(!streamObj.params)
  //           return        
  //       var txns = streamObj.params.result.transactions
  //       var hashes = txns.map(function(t) { 
  //         return t.hash;
  //       })
  //       console.log(hashes.length)
  //   })
  // }  
}


var web3 = new Web3(new Web3.providers.WebsocketProvider(config.nodeWSS));

var d = new DexEvents(web3);
// d.startProcessing1()
d.startProcessing2()
// d.startProcessing3()
