const ethers = require("ethers");
const Web3 = require("web3");
const config = require('./config.js');
const utils = require('./utils');
const multiSend = require('./sender')

class ReceiptChecker{
    constructor(bloxroute, web3){
        this.bloxroute = bloxroute
        this.web3 = web3
    }
  
    async log_txn(txn){
      var type;
      switch(txn.input.slice(0, 10).toLowerCase())
      {
        case config.buyId.toLowerCase():
          type = "BUY FR CHECK"
          break;
        case config.sellId.toLowerCase():
          type = "SELL ALL"
          break;
        case config.blacklistId.toLowerCase():
          type = "BLACKLIST"
          break;     
        case config.depositId.toLowerCase():
          type = "DEPOSIT"
          break;
        case config.sendBackBalanceId.toLowerCase():
          type = "WITHDRAW"
          break;
        default:
          type = "UKN"             
      }
      var hash = txn.hash.toLowerCase()

      try{
        var txReceipt = await this.web3.eth.getTransactionReceipt(hash) //idk
        console.log(txReceipt)
        utils.log("[CONFIRMED]: "+type+" | https://bscscan.com/tx/"+hash+" | status: " + txReceipt.status + " | blockNumber: " + txReceipt.blockNumber );
      }catch{
        utils.log("[CONFIRMED]: "+type+" | https://bscscan.com/tx/"+hash+" | RECEIPT FAILED.");
      }      

    }
  
    async run(){
      this.bloxroute.blockStreamWs.on('message', (streamObj) => {
          streamObj = JSON.parse(streamObj)
          if(streamObj.params){
            var txns = streamObj.params.result.transactions
            if(!txns)
              return
            for(var i=0; i<txns.length; i++){
              var txn = txns[i]
              if(txn.to && txn.to.toLowerCase() == config.traderContractAddress.toLowerCase()){
                this.log_txn(txn);
              }
            }
          }
      })
    }
}


class TxnHandler{
    constructor(bloxroute){
        this.bloxroute = bloxroute
        this.web3 = new Web3(new Web3.providers.WebsocketProvider(config.nodeWSS));
        this.web3Public = new Web3(new Web3.providers.WebsocketProvider(config.publicNodeWSS));
        this.mult = new multiSend()
        this.mult.refresh_connection()
        this.provider = new ethers.providers.WebSocketProvider(config.nodeWSS);
        // this.provider = new ethers.providers.JsonRpcProvider(config.nodeHTTP);
        
        
        this.rc = new ReceiptChecker(bloxroute, this.web3)
        this.rc.run();
        // this.bloxRouteListener();
        utils.log("New txnHandler")
    }

    async _sendNode(signedTxn){
      try{
        await this.provider.sendTransaction(signedTxn)
      }
      catch(e){
        console.log("1")
      }
    }

    async _sendBlx(signedTxn){
      signedTxn = signedTxn.startsWith('0x') ? signedTxn.slice(2) : signedTxn;
      var req = {
          "jsonrpc": "2.0", 
          "id": 1, 
          "method": "blxr_tx", 
          "params": {
              "transaction": signedTxn, 
              "blockchain_network": "BSC-Mainnet",
              "validators_only": true
          }
      }
      try{
        this.bloxroute.wsSendTxn.send(JSON.stringify(req))   
      }
      catch(e){
        console.log("2")
      }
    }    


    async send(signedTxn, type, tokenAddress, callback, args){
      this.mult.sendTrans(signedTxn)
      this._sendBlx(signedTxn)
      this._sendNode(signedTxn)
      var hash = this.web3.utils.keccak256(signedTxn) 
      utils.log(" [SENT]: " + "https://bscscan.com/tx/" + hash)
    }

    // async bloxRouteListener(){
    //     this.bloxroute.wsSendTxn.on('message', (response) => {
    //       utils.log(" [SENT]: " + "https://bscscan.com/tx/0x" + JSON.parse(response).result.txHash.toString())
    //     })
    // }
}

module.exports = TxnHandler