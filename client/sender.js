const { resolve } = require('dns')
const ethers = require('ethers')

class multiSend{
    constructor(){
        this.servers = []
        this.providers_rpc = []
        this.providers_ws = []
        require('fs')
        .readFileSync('./list_nodes.txt', 'utf-8').split(/\r?\n/)
        .forEach((line) => {this.servers.push(line);})
    }

    getInitializedWebsocketProvider(rpcUrl) {
        return new Promise((resolve, reject) => {
          const provider = new ethers.providers.WebSocketProvider(rpcUrl);
          provider._websocket.on('open', () => resolve(provider))
          provider._websocket.on('error', () => reject(provider));
        });
    }

    refresh_connection = ()=>{
        for(var i = 0;i<this.servers.length;i++){
            var url = 'http://'+this.servers[i]+':8546'
            this.getInitializedWebsocketProvider(url)
            .then((x)=>{this.providers_ws.push(x)})
            .catch((x)=>{this.providers_rpc.push((
                new ethers.providers.JsonRpcProvider(x._websocket._url.substr(0, x._websocket._url.length - 1)+'5')
                ))})
        }
    }

    checkLatestBlock (mode){
        for(var i = 0;i<this.providers_rpc.length;i++){
            this.providers_rpc[i]
            .getBlockNumber()
            .then(console.log)
            .catch(console.log)
        }
        for(var i = 0;i<this.providers_ws.length;i++){
            this.providers_ws[i]
            .getBlockNumber()
            .then(console.log)
            .catch(console.log)
        }
    }

    sendTrans = (signedTrans) => {
        for(var i = 0;i<this.providers_rpc.length;i++){
            try{
                this.providers_rpc[i].sendTransaction(signedTrans).catch((x)=>{})
            }
            catch (error){
                console.log(error)
            }
        }
        for(var i = 0;i<this.providers_ws.length;i++){
            try{
                this.providers_ws[i].sendTransaction(signedTrans).catch((x)=>{})
            }
            catch (error){
                console.log(error)
            }
        }
    }
}

module.exports = multiSend
