var fs = require('fs');
const WebSocket = require('ws');
const config = require('./config.js');
const utils = require('./utils');


function promisify(f) {
    return function (...args) { // return a wrapper-function (*)
      return new Promise((resolve, reject) => {
        function callback(err, result) { // our custom callback for f (**)
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        }
  
        args.push(callback); // append our custom callback to the end of f arguments
  
        f.call(this, ...args); // call the original function
      });
    };
  }

function waitForSocketConnection(socket, callback){
    setTimeout(
        function() {
            if (socket.readyState === 1) {
                if (callback != null){
                    callback();
                }
            }
            else {
                console.log("wait for connection...")
                waitForSocketConnection(socket, callback);
            }
        }, 5); 
}

class BloxRoute{
    constructor(){
        this.wsSendTxn = new WebSocket(
            config.bloxRouteWSS, 
            {
                headers: { "Authorization" : config.bloxRouteAuth}, 
                rejectUnauthorized: false,
            }
        )

        this.wsSendTxn2 = new WebSocket(
            "wss://api.blxrbdn.com/ws",
            {
                headers: { "Authorization" : config.bloxRouteAuth}, 
                rejectUnauthorized: false,
            }
        )

        this.streamWs = new WebSocket(
            'ws://127.0.0.1:28333/ws',
            {
                headers: { "Authorization" : config.bloxRouteAuth}, 
                cert: fs.readFileSync('/root/bloxroute/external_gateway/registration_only/external_gateway_cert.pem'),
                key: fs.readFileSync('/root/bloxroute/external_gateway/registration_only/external_gateway_key.pem'),
                rejectUnauthorized: false,
            }
          )
          
        this.blockStreamWs = new WebSocket(
            config.bloxRouteCloudWSS, 
            {
                headers: { "Authorization" : config.bloxRouteAuth}, 
                cert: fs.readFileSync('/root/bloxroute/external_gateway/registration_only/external_gateway_cert.pem'),
                key: fs.readFileSync('/root/bloxroute/external_gateway/registration_only/external_gateway_key.pem'),
                rejectUnauthorized: false,
            }
          )    
    }

    async run(){
        this.subscribe()
        this.subscribeBlocks()
    }

    async subscribe(){
        var msg = {
            "jsonrpc": "2.0", 
            "id": 1, 
            "method": "subscribe", 
            "params": [
                "newTxs", 
                {
                    "include": ["tx_hash","tx_contents"]
                }
            ]
            }
        this.streamWs.on('open', () => {this.streamWs.send(JSON.stringify(msg))})
        this.streamWs.on('error', (err) => console.log('error:', err));        
        return this.streamWs
    }

    async subscribeBlocks(){
        var msg = {
                "jsonrpc": "2.0", 
                "id": 1, 
                "method": "subscribe", 
                "params": [
                    "bdnBlocks", 
                    {
                        "include": ["transactions"], 
                    }
                ]
            };
        this.blockStreamWs.on('open', () => {this.blockStreamWs.send(JSON.stringify(msg))})
        this.blockStreamWs.on('error', (err) => {console.log('error:', err)});        
        return this.blockStreamWs
    }    

    async sendMessage(msg){
        this.wsSendTxn.send(msg);
        this.wsSendTxn2.send(msg);
    }

    async sendTransaction(signedTxn){
        signedTxn = signedTxn.startsWith('0x') ? signedTxn.slice(2) : signedTxn;
        var req = {
            "jsonrpc": "2.0", 
            "id": 1, 
            "method": "blxr_tx", 
            "params": {
                "transaction": signedTxn, 
                "blockchain_network": "BSC-Mainnet"
            }
        }
        this.sendMessage(JSON.stringify(req));
        this.wsSendTxn.on('message', (response) => {
            response = JSON.parse(response)
            utils.log("Sent transaction: "+"https://bscscan.com/tx/0x"+response.result.txHash.toString())
        })
    }
}

module.exports = BloxRoute