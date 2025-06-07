const ethers = require("ethers");
const config = require('./config.js');
const TxnHandler = require('./txnHandler.js')
const utils = require('./utils.js')
const SuicideManager = require('./suicide.js');
const sm = new SuicideManager();


// PGA is Price Gas Auction
// The only challenge for sandwich bots is other sandwich bots
// This helps combatting that
// This was competitive for around a week or so, then it got rekt by other
// attackers on BSC. This file here was the moat of all my work

module.exports = class PGA {

  constructor(trader, txn, gasGears, args) {
      this.blockMined = false;
      this.ntry = 0 //relaunch try
      this.maxLevel = 0;

      this.txn = txn
      this.gasGears = gasGears
      this.maxGas = gasGears[gasGears.length-1];
      this.args = args

      this.trader = trader
      this.mempool = trader.mempool
      this.wallet = trader.wallet
      this.provider = trader.provider
      this.txnHandler = trader.txnHandler

      this.sds = sm.get(3); //TODO: Write back wasted SCs
  }


  resolveLevel(){
    var level = 0
    var curGas = this.txn.gasPrice

    for(var i=0; i<this.gasGears.length; i++){

      if(curGas.lte(this.gasGears[i])){
        level = i;
        break;
      }

    }

    if(level > this.maxLevel)
      this.maxLevel = level

    utils.log("[PGA] Current level: " + level)
    return level;
  }

  async send_txn(newgas){
    this.txn.gasPrice = newgas
    this.ntry += 1;
    var sds = this.sds.slice(0, this.resolveLevel()) //get SC addresses
    this.args[this.args.length-1] = sds //change arg for SC addreses
    var updatedGasPrice = this.txn.gasPrice //update gas
    var ta = Date.now()
    this.txn = this.trader.getBuyTxnForPGA(...this.args, this.txn.nonce) //new buyTxn with same nonce
    var tb = Date.now()
    this.txn.gasPrice = updatedGasPrice
    var t1 = Date.now()
    var signedTx = await this.wallet.signTransaction(this.txn)
    var t2 = Date.now()

    utils.log("[PGA] [Aggressive Try]: "+this.ntry+" ] | Gas: " + ethers.utils.formatUnits(newgas, "gwei") + "| Signing took (s): "+(t2-t1)/1000 + " Fetching took (s): "+(tb-ta)/1000); 
    this.txnHandler.send(signedTx, "PGA TXN", "0xPGA")

    // var txObj = await this.provider.sendTransaction(signedTx)
    // utils.log("[Aggressive Trader try: "+this.ntry+" ] " + " : https://bscscan.com/tx/" + txObj.hash + " Gas: " + this.txn.gasPrice.toString());
  }  

  mempoolMax(){
    var maxGas = 5000000000
    var mempoolTxns = this.mempool.snapshot()
    for(var txn in mempoolTxns){
      var gas = Number(txn.gasPrice)
      if(gas > maxGas)
        maxGas = gas
    }
  // console.log("maxGas: ", maxGas.toString())
  return ethers.utils.parseUnits(maxGas.toString(), "wei")
  }

  validContendor(contenderTxn){
    return !(
      !contenderTxn || 
      (contenderTxn.to && contenderTxn.to.toLowerCase() == this.txn.to.toLowerCase()) ||
      !contenderTxn.to ||
      contenderTxn.input == "0x"
      )
  }

  getLaunchGas(launchGas){
    if(launchGas){
      utils.log("[PGA] Starting with initialized gas: "+ethers.utils.formatUnits(this.txn.gasPrice, "gwei"))
      return launchGas
    }
    var poolMax = this.mempoolMax()
    if(poolMax.gte(this.maxGas)){
      utils.log("[PGA] Mempool already has a winner: "+ethers.utils.formatUnits(this.txn.gasPrice, "gwei"))
      utils.log("[PGA] Starting with maxGas: "+ethers.utils.formatUnits(this.maxGas, "gwei"))
      return this.maxGas
    }
    var gas = poolMax.add(ethers.utils.parseUnits("100", "wei"))
    utils.log("[PGA] Starting with pool maxGas: "+ethers.utils.formatUnits(gas, "gwei"))
    return gas
  }

  async launch(launchGas){
    this.startT = Date.now();
    this.blockMined = false; //set blockMinedCounter
    this.startBlockStreaming() //Start blockstreaming
    var newgas = this.getLaunchGas(launchGas)
    await this.send_txn(newgas) //Send first txn
    utils.log("[PGA] PGAing...") 
    this.mempool.bloxroute.streamWs.on('message', (streamObj) => {
      if(this.stop)
        return

      if(this.blockMined || (Date.now()-this.startT)/1000 > 3){
        console.log("[PGA] STOPING PGA...")
        this.stop = true
        this.writeUnused(); //Write back unused suicide SCs
        return
      }

      streamObj = JSON.parse(streamObj)
      if(!streamObj.params)
        return

      var contenderTxn = streamObj.params.result.txContents
      if(this.validContendor(contenderTxn)){
        var contenderGas = ethers.BigNumber.from(contenderTxn.gasPrice);

        if(contenderGas.gte(this.txn.gasPrice)){
          utils.log("[PGA] OUTGAS THIS BITCH~!: https://bscscan.com/address/" +contenderTxn.to + "| GAS: " + ethers.utils.formatUnits(contenderGas, "gwei") + " | https://bscscan.com/tx/"+contenderTxn.hash)
          var boosted1 = this.txn.gasPrice.mul(1101).div(1000)
          var boosted2 = contenderGas.add(ethers.utils.parseUnits("1000", "wei"))

          if(boosted1.gte(boosted2))
            var boostedGas = boosted1
          else
            var boostedGas = boosted2

          if(boostedGas.lte(this.maxGas)){
            utils.log("[PGA] Won for now")
            this.send_txn(boostedGas)
            //send txn
          }
          else{
            //accept defeat
            utils.log("[PGA] Lost to: " + ethers.utils.formatUnits(contenderGas, "gwei") + " | Cucker:  https://bscscan.com/address/"+contenderTxn.to + " | Txn: https://bscscan.com/tx/" +contenderTxn.hash)
          }
        }
      }
    })
  }

  writeUnused(){
    var unused = this.sds.slice(this.maxLevel)
    if(unused.length > 0){
        utils.log("[PGA] Adding some unused bombers: " + unused)
        sm.add(unused)
      }
  }

  async startBlockStreaming(){
    this.mempool.bloxroute.blockStreamWs.on('message', (streamObj) => {
      this.blockMined = true;
    })
  }

}