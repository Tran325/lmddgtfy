const ethers = require("ethers");
const config = require('./config.js');


module.exports = class Mempool {

  constructor(bloxroute) {
      this.trackerObj = {}
      this.provider = ethers.getDefaultProvider(config.nodeWSS);
      this.bloxroute = bloxroute
      this.latestBlock = []
  }

  async startBlockStreaming(){
    this.bloxroute.blockStreamWs.on('message', (streamObj) => {
        streamObj = JSON.parse(streamObj)
        if(!streamObj.params)
            return        
        var txns = streamObj.params.result.transactions
        if(!txns)
          return
        this.latestBlock = txns.map(function(t) { 
          return t.hash.toLowerCase();
        })
    })
  }

  async run(){
    this.mempoolReader()
    this.mempoolCleaner()
    this.startBlockStreaming()
  }

  async mempoolCleaner() { 
    var refreshId = setInterval(async () => {
      this.routineCleanup()     
    }, 2000) //run the cleaner every 2 second
  }

  async mempoolReader() {
    this.bloxroute.streamWs.on('message', async (streamObj) => {
      streamObj = JSON.parse(streamObj)

      if(!streamObj.params)
        return

      var tx = streamObj.params.result.txContents

      try{
        if(tx){
          tx.gas = Number(ethers.BigNumber.from(tx.gas).toString())
          tx.nonce = Number(ethers.BigNumber.from(tx.nonce).toString())
          tx.value = ethers.BigNumber.from(tx.value).toString()
          tx.gasPrice = ethers.BigNumber.from(tx.gasPrice).toString()
          tx['gasLimit'] = tx.gas
          this.add(tx)
        }
      }
      catch(e){
        console.log("Mempool reader small error: "+e)
      }
    })
  }
  
  // async mempoolReader() {
  //   this.stream.on('message', async (streamObj) => {
  //     streamObj = JSON.parse(streamObj)
  //     if(streamObj.params){
  //       var tx = streamObj.params.result.txContents
  //       if(tx){
  //         tx.gas = Number(ethers.BigNumber.from(tx.gas).toString())
  //         tx.nonce = Number(ethers.BigNumber.from(tx.nonce).toString())
  //         tx.value = ethers.BigNumber.from(tx.value).toString()
  //         tx.gasPrice = ethers.BigNumber.from(tx.gasPrice).toString()
  //         this.add(transaction)
  //       }
  //     }
  //   });
  // }  

  async routineCleanup(){
    var newTrackerObj = {}
    for(var hash in this.trackerObj){
      if(
        (Date.now()-this.trackerObj[hash]['t'])/1000 <= 4 && //take txns within last 4 seconds
        !this.latestBlock.includes(hash.toLowerCase()) //remove any txn that was mined in previous block
      )
        newTrackerObj[hash] = this.trackerObj[hash]
    }
    this.trackerObj = newTrackerObj;
  }

  snapshot() {
    this.routineCleanup() //send snapshot after a cleanup to be extra safe about removing already mined txns
    var pool = []
    for(var hash in this.trackerObj){
      var tx = this.trackerObj[hash]['txn']
      tx['gasPrice'] = tx['gasPrice'].toString()
      tx['gasLimit'] = tx['gasLimit'].toString()
      pool.push(tx)
    }
    // console.log("!!! pool: ", pool.length)
    return pool
  }

  add(txn) {
    if(!txn || !('hash' in txn)){
      console.log("WARN: We have a weird txn: "+txn)
      return
    }
    var hash = txn.hash
    let struct = {
          "txn": txn,
          "t": Date.now(),
      }
    this.trackerObj[hash] = struct
  }


} 



