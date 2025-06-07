const bloxRoute = require("./bloxroute.js")
const { ethers } = require("ethers");
var utils = require("./utils")
const config = require('./config.js');
const trader_abi = require('./abi/trader_abi.json');
const TxnHandler = require("./txnHandler.js");
const memPool = require("./mempool.js")
const PGA = require('./PGA.js')

module.exports = class Trader{

    constructor(bloxroute){
        this.provider = new ethers.providers.JsonRpcProvider(config.nodeHTTP);
        this.traderContract = new ethers.utils.Interface(trader_abi);
        
        this.personal = utils.readJson("private_key.json")
        utils.log("[trader] Using wallet: " + this.personal['name'])
        
        this.walletAddress = this.personal['walletaddress']
        this.wallet = new ethers.Wallet(this.personal['privatekey'])
        this.baseNonce = this.provider.getTransactionCount(this.walletAddress);
        this.nonceOffset = 0;

        this.walletAddressBlackList = this.personal['walletaddress_blacklist']
        this.walletBlackList = new ethers.Wallet(this.personal['privatekey_blacklist'])
        this.baseNonceBlackList = this.provider.getTransactionCount(this.walletAddressBlackList);
        this.nonceOffsetBlackList = 0;    
        
        this.ruggedTracker = {}
        this.rektTrader = false;
        this.br = null;
        this.bloxroute = bloxroute;
        this.txnHandler = new TxnHandler(bloxroute)
        this.mempool = new memPool(bloxroute)
    }

    XOREncode(tokenAddress){
        var address = ethers.BigNumber.from(tokenAddress)
        var secret = ethers.BigNumber.from(config.secret)
        return address.xor(secret).toHexString()
    }

    async send_txn(txn, type="UNK", tokenAddress, wallet=this.wallet){
        var signedTxn = await wallet.signTransaction(txn);
        utils.log("[trader] Sending txn " + type + " to txnHandler...")
        this.txnHandler.send(signedTxn)
        try{
            var txObj = await this.provider.sendTransaction(signedTxn)
            var receipt = await txObj.wait();
            utils.log("[trader] provider sent" + id  + ": " + type + " : https://bscscan.com/tx/" + txObj.hash);  
        }
        catch{
            console.log("e")
        }
      

        // if(type=="FR CHECK BUY"){
        // if(type=="SELL ALL"){
        //     var callback = this.br.stopARC
        //     // var callback = null;
        //     var args = [this.br, tokenAddress]
        // }
        // else{
        //     var callback = null;
        //     var args = null;
        // }        
        // this.txnHandler.send(signedTxn, type, tokenAddress, callback, args)
    }      

    getNonce(){
        return this.baseNonce
        .then(
            (nonce)=>{
                    var new_nonce = nonce + (this.nonceOffset++)
                    utils.log("[trader] Acc 1 Nonce changed to: " + new_nonce)
                    return new_nonce;
            }
        );
    }

    getNonce_blackList(){
        return this.baseNonceBlackList
        .then(
            (nonce)=>{
                    var new_nonce = nonce + (this.nonceOffsetBlackList++)
                    utils.log("[trader] Acc 2 Nonce changed to: " + new_nonce)
                    return new_nonce;
            }
        );
    }    
    
    async stopLossCheck(id){
        var curBalance = await this.provider.getBalance(this.walletAddress)
        var stopBalance = ethers.utils.parseUnits(config.stopLossEth.toString(), "ether")
        var curBalance = ethers.utils.parseUnits(curBalance.toString(), "wei")
        utils.log("[trader]  Stop loss, current balance: " + curBalance.toString() + " | Stop loss balance: " + stopBalance.toString())
        utils.log("[trader]  Stop loss, current balance: " + JSON.stringify(curBalance) + " | Stop loss balance: " + JSON.stringify(stopBalance))
        return curBalance.gte(stopBalance)
    }

    async authorize(address){
        
        var gasLimit = 2000000
        var gasPrice = ethers.utils.parseUnits("6", "gwei")
        
        const processedData = this.traderContract.encodeFunctionData(
            "authorize",
            [address]
        );
        
        let tx = {
            from: this.walletAddress,
            to: config.traderContractAddress,
            value: ethers.BigNumber.from("0"),
            chainId: 56,
            nonce: this.getNonce(),
            gasPrice: ethers.BigNumber.from(gasPrice),
            gasLimit: ethers.BigNumber.from(gasLimit),
            data: processedData
        }

        sendTxn(tx, "Authorize", id);
    }  
    
    async set(pairAddress, gasPrice){
        
        pairAddress = this.XOREncode(pairAddress);

        utils.log("[trader]  ==== SET > " + pairAddress + " < =====")
        
        var gasLimit = 2000000
        
        const processedData = this.traderContract.encodeFunctionData(
            "SET",
            [pairAddress]
        );
        
        let tx = {
            from: this.walletAddress,
            to: config.traderContractAddress,
            value: ethers.BigNumber.from("0"),
            chainId: 56,
            nonce: this.getNonce(),
            gasPrice: ethers.BigNumber.from(gasPrice),
            gasLimit: ethers.BigNumber.from(gasLimit),
            data: processedData
        }

        this.send_txn(tx, "Set", 0);
    }      
    
    getBuyTxnForPGA(buyFnName, pairAddress, value, amountOutMin, targetAddress, mintargetBalance, gasPrice, gasLimit, sds, nonce){
        //This one has same nonce always
        pairAddress = this.XOREncode(pairAddress);

        if(buyFnName == "BF")
            var args = [value, amountOutMin, pairAddress, targetAddress, mintargetBalance, sds]
        else
            var args = [value, amountOutMin, pairAddress, sds]

        const processedData = this.traderContract.encodeFunctionData(
            buyFnName,
            args
        );
        let tx = {
            from: this.walletAddress,
            to: config.traderContractAddress,
            value: ethers.BigNumber.from("0"),
            nonce: nonce,
            gasPrice: ethers.BigNumber.from(gasPrice),
            gasLimit: ethers.BigNumber.from(gasLimit),
            data: processedData
        }
       return tx;
    }    
    
    getBuyTxn(buyFnName, pairAddress, value, amountOutMin, targetAddress, mintargetBalance, gasPrice, gasLimit, sds){
        pairAddress = this.XOREncode(pairAddress);

        if(buyFnName == "BF")
            var args = [value, amountOutMin, targetAddress, mintargetBalance, sds]
        else
            var args = [value, amountOutMin, pairAddress, sds]

        const processedData = this.traderContract.encodeFunctionData(
            buyFnName,
            args
        );
        let tx = {
            from: this.walletAddress,
            to: config.traderContractAddress,
            value: ethers.BigNumber.from("0"),
            nonce:this.getNonce(),
            gasPrice: ethers.BigNumber.from(gasPrice),
            gasLimit: ethers.BigNumber.from(gasLimit),
            data: processedData
        }
       return tx;
    }
    
    getSellTxn(tokenAddress, pairAddress, gasPrice, gasLimit){
        tokenAddress = this.XOREncode(tokenAddress);
        pairAddress = this.XOREncode(pairAddress);

        if(!gasLimit)
            var gasLimit = 2000000
        
        if(!gasPrice)
            gasPrice = ethers.utils.parseUnits("5", "gwei")        

        const processedData = this.traderContract.encodeFunctionData(
            "S",
            [tokenAddress, pairAddress]
        );
        let tx = {
            from: this.walletAddress,
            to: config.traderContractAddress,
            value: ethers.BigNumber.from("0"),
            nonce:this.getNonce(),
            gasPrice: ethers.BigNumber.from(gasPrice),
            gasLimit: ethers.BigNumber.from(gasLimit),
            data: processedData
        }
       return tx;
    }    

    async buy(tokenAddress, pairAddress, value, amountOutMin, gasPrice, gasLimit){

        utils.log("[trader] ==== RAW BUYING > " + tokenAddress + " < =====")

        if(!gasLimit)
            gasLimit = 2000000
        
        var tx = this.getBuyTxn("B", pairAddress, value, amountOutMin, null, null, gasPrice, gasLimit)
        this.send_txn(tx, "RAW BUY", tokenAddress, this.wallet);
    }

    async buy_frcheck(tokenAddress, pairAddress, value, amountOutMin, targetAddress, mintargetBalance, gasPrice, gasLimit, gasGears, doPGA=false){
        
        this.br.launchARC(tokenAddress, pairAddress, gasPrice) //important
        utils.log("[trader]  ==== FR CHECK BUY > " + tokenAddress + " < =====")
        this.set(pairAddress, gasPrice)

        if(!gasLimit)
            gasLimit = 2000000

        // var tx = this.getBuyTxn("B", pairAddress, value, amountOutMin, targetAddress, mintargetBalance, gasPrice, gasLimit)
        var args = [
            "BF", pairAddress, value, amountOutMin, targetAddress, mintargetBalance, gasPrice, gasLimit, []
        ]
        var tx = this.getBuyTxn(...args)
        this.send_txn(tx, "FR CHECK BUY", tokenAddress, this.wallet);

        // if(doPGA && config.PGA){
        //     var pga = new PGA(this, tx, gasGears, args)
        //     // pga.launch(gasPrice)
        //     pga.launch() //this will launch PGA at maxGas
        // }
        // else{
        //     this.send_txn(tx, "FR CHECK BUY", tokenAddress, this.wallet);
        // }

        return tx;

    } 

    async sell(tokenAddress, pairAddress, gasPrice, gasLimit){

        utils.log("[trader]  ==== SELLING > " + tokenAddress + " < =====")
        
        var tx = this.getSellTxn(tokenAddress, pairAddress, gasPrice, gasLimit)

        this.send_txn(tx, "SELL ALL", tokenAddress, this.wallet);
        return tx;

    }

    async transferBalance(toAddress, value){
        
        utils.log("[trader]  ==== Transfering balance to > " + toAddress + " | value: "+ value.toString() +" < =====")

        let tx = {
            from: this.walletAddress,
            to: toAddress,
            value: ethers.BigNumber.from(value),
            chainId: 56,
            nonce: this.getNonce(),
            gasPrice: ethers.utils.parseUnits("5", "gwei"),
            gasLimit: ethers.BigNumber.from(100000),
            data: "0x"
        }
        this.send_txn(tx, "TRANSFER BALANCE", toAddress, this.wallet);

    }  
    
    async tempTransferBalance(toAddress, value){
        
        utils.log("[trader]  ==== Transfering balance to > " + toAddress + " | value: "+ value.toString() +" < =====")

        let tx = {
            from: this.walletAddress,
            to: toAddress,
            value: ethers.BigNumber.from(value),
            chainId: 56,
            nonce: this.getNonce(),
            gasPrice: ethers.utils.parseUnits("5", "gwei"),
            gasLimit: ethers.BigNumber.from(100000),
            data: "0x"
        }
        return tx
    }      

    async sendBackBalance(){
        var gasLimit = 2000000

        const processedData = this.traderContract.encodeFunctionData(
            "sendBackBalance", 
            []
        );

        let tx = {
            from: this.walletAddress,
            to: config.traderContractAddress,
            value: ethers.BigNumber.from('0'),
            chainId: 56,
            nonce: this.getNonce(),
            gasPrice: ethers.BigNumber.from(ethers.utils.parseUnits("5", "gwei")),
            gasLimit: ethers.BigNumber.from(gasLimit),
            // gasLimit: ethers.BigNumber.from("2000000"),
            data: processedData
        }
        this.send_txn(tx, "SEND BACK BALANCE", "0x", this.wallet);

    } 
    
    async deposit(value){
        var gasLimit = 2000000

        const processedData = this.traderContract.encodeFunctionData(
            "ethToWeth", 
            []
        );

        let tx = {
            from: this.walletAddress,
            to: config.traderContractAddress,
            value: ethers.BigNumber.from(value),
            chainId: 56,
            nonce: this.getNonce(),
            gasPrice: ethers.BigNumber.from(ethers.utils.parseUnits("5", "gwei")),
            gasLimit: ethers.BigNumber.from(gasLimit),
            // gasLimit: ethers.BigNumber.from("2000000"),
            data: processedData
        }
        this.send_txn(tx, "DEPOSIT", "0x", this.wallet);

    }     
    
    async blackList(gasPrice){
        var gasLimit = 200000

        const processedData = this.traderContract.encodeFunctionData(
            "blacklist", 
            []
        );

        let tx = {
            from: this.walletAddressBlackList,
            to: config.traderContractAddress,
            value: ethers.BigNumber.from('0'),
            chainId: 56,
            nonce: this.getNonce_blackList(),
            gasPrice: gasPrice,
            gasLimit: ethers.BigNumber.from(gasLimit),
            // gasLimit: ethers.BigNumber.from("2000000"),
            data: processedData
        }
        this.send_txn(tx, "BLACKLIST", "0x", this.walletBlackList);

    } 
    
    // async wtf(gasPrice){
    //     let tx = {
    //         from: this.walletAddressBlackList,
    //         to: "",
    //         value: ethers.BigNumber.from('0'),
    //         chainId: 56,
    //         nonce: this.getNonce_blackList(),
    //         gasPrice: gasPrice,
    //         gasLimit: ethers.BigNumber.from("2000000"),
    //         // gasLimit: ethers.BigNumber.from("2000000"),
    //         data: "0x"
    //     }
    //     this.send_txn(tx, "wtf", "0x", this.walletBlackList);
    // }
    
    async wtf(gasPrice){
        let tx = {
            from: this.walletAddressBlackList,
            to: null,
            value: ethers.BigNumber.from('0'),
            chainId: 56,
            nonce: this.getNonce_blackList(),
            gasPrice: gasPrice,
            gasLimit: ethers.BigNumber.from("2000000"),
            // gasLimit: ethers.BigNumber.from("2000000"),
            data: "0x33ff"
        }
        this.send_txn(tx, "wtf", "0x", this.walletBlackList);
    }    
    
    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++
    //Below are functions only used for simulation
    //Either through independent eth_call for gas simulation
    //Or through upper and lower bread in blockrunner
    //++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++

    async getAmountOutMin(tokenAddress, value, slippage){
        //slippage kept here for backward compatibility, will remove in next iteration.
        tokenAddress = this.XOREncode(tokenAddress)
        try{
            var processedData = this.traderContract.encodeFunctionData(
                "getAmountOut",
                [tokenAddress, value]
            );            
        }
        catch{
            utils.log("[WEIRD] Can't XOREncode: "+tokenAddress)
            return false;
        }


        let tx = {
            from: this.walletAddress,
            to: config.traderContractAddress,
            value: ethers.BigNumber.from('0'),
            chainId: 56,
            gasPrice: ethers.BigNumber.from(ethers.utils.parseUnits("5", "gwei")),
            gasLimit: ethers.BigNumber.from(2000000),
            data: processedData
        }
        try{ //sometimes token can't be sold so eth_call fails.
            var amountOutMin = await this.provider.call(tx);
            amountOutMin = ethers.BigNumber.from(amountOutMin)
        }
        catch{
            var amountOutMin = false
        }
        return amountOutMin;
    }    

    async estimateGas(value, amountOutMin, tokenAddress, pairAddress){
        pairAddress = this.XOREncode(pairAddress);
        tokenAddress = this.XOREncode(tokenAddress);

        var sds = []
        var mintargetBalance = ethers.BigNumber.from("0")
        var targetAddress = config.bnbReserveAddress
        var args = [value, amountOutMin, tokenAddress, pairAddress, targetAddress, mintargetBalance, sds]

        const processedData = this.traderContract.encodeFunctionData(
            "gasEstimate",
            args
        );
        let tx = {
            from: this.walletAddress,
            to: config.traderContractAddress,
            value: ethers.BigNumber.from("0"),
            data: processedData
        }
        var gas = await this.provider.estimateGas(tx);
        // gas = gas.add(ethers.BigNumber.from("55000")) //some additional gas for multiple txns + safety
        return gas;
    }    

    upperBread1(pairAddress, value, amountOutMin, targetAddress, mintargetBalance, gasPrice, gasLimit){
        pairAddress = this.XOREncode(pairAddress);
        var sds = [];
        var args = [value, amountOutMin, pairAddress, targetAddress, mintargetBalance, sds]
        
        const processedData = this.traderContract.encodeFunctionData(
            "upperBread1",
            args
        );
        let tx = {
            from: this.walletAddress,
            to: config.traderContractAddress,
            value: ethers.BigNumber.from("0").toString(),
            gasPrice: ethers.BigNumber.from(gasPrice).toString(),
            gasLimit: ethers.BigNumber.from(gasLimit).toString(),
            data: processedData
        }
       return tx;
    } 
    
    upperBread2(value, tokenAddress, pairAddress, gasPrice, gasLimit){
        pairAddress = this.XOREncode(pairAddress);
        tokenAddress = this.XOREncode(tokenAddress);
        var args = [value, tokenAddress, pairAddress]
        
        const processedData = this.traderContract.encodeFunctionData(
            "upperBread2",
            args
        );
        let tx = {
            from: this.walletAddress,
            to: config.traderContractAddress,
            value: ethers.BigNumber.from("0").toString(),
            gasPrice: ethers.BigNumber.from(gasPrice).toString(),
            gasLimit: ethers.BigNumber.from(gasLimit).toString(),
            data: processedData
        }
       return tx;
    } 

    lowerBread1(tokenAddress, pairAddress){
        tokenAddress = this.XOREncode(tokenAddress);
        pairAddress = this.XOREncode(pairAddress);
        var gasLimit = 2000000
        var gasPrice = ethers.utils.parseUnits("5", "gwei")

        const processedData = this.traderContract.encodeFunctionData(
            "lowerBread1", 
            [tokenAddress, pairAddress]
        );

        let tx = {
            from: this.walletAddress,
            to: config.traderContractAddress,
            value: ethers.BigNumber.from('0').toString(),
            gasPrice: ethers.BigNumber.from(gasPrice).toString(),
            gasLimit: ethers.BigNumber.from(gasLimit).toString(),
            data: processedData
        }
        return tx
    } 

    lowerBread2(tokenAddress, pairAddress){
        tokenAddress = this.XOREncode(tokenAddress);
        pairAddress = this.XOREncode(pairAddress);     
        var gasLimit = 2000000
        var gasPrice = ethers.utils.parseUnits("5", "gwei")

        const processedData = this.traderContract.encodeFunctionData(
            "lowerBread2", 
            [tokenAddress, pairAddress, config.dumpPercent]
        );

        let tx = {
            from: this.walletAddress,
            to: config.traderContractAddress,
            value: ethers.BigNumber.from('0').toString(),
            gasPrice: ethers.BigNumber.from(gasPrice).toString(),
            gasLimit: ethers.BigNumber.from(gasLimit).toString(),
            data: processedData
        }
        return tx
    }    

}