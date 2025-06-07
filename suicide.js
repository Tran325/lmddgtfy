const ethers = require("ethers");
const config = require("./config.js");
const utils = require("./utils.js");
const fs = require('fs');

function write(array, path) {
    fs.writeFileSync(path, JSON.stringify(array));
}

function read(path) {
    try {
        var fileContent = fs.readFileSync(path);
        var trackerObj = JSON.parse(fileContent);
        return trackerObj
    } catch (err) {
        fs.closeSync(fs.openSync(path, 'w'));
        var trackerObj = {}
        return trackerObj
    }
}


class CREATE2Utils{

    constructor(byteCode){
        this.factoryAddress = config.mommyContractAddress;
        this.byteCode = byteCode
    }
    
    numberToUint256(value) {
        let result = null;
      
        try {
          const hex = value.toString(16);
          result = `${'0'.repeat(64 - hex.length)}${hex}`;
        } catch (err) {
          result = null
        }
      
        return result
          ? `0x${result}`
          : '0x';
      }
    
    buildCreate2Address(creatorAddress, saltHex, byteCode) {
      return `0x${ethers.utils
        .keccak256(
          `0x${["ff", creatorAddress, saltHex, ethers.utils.keccak256(byteCode)]
            .map(x => x.replace(/0x/, ""))
            .join("")}`
        )
        .slice(-40)}`.toLowerCase();
    }  
    
    getAddresses(saltLow, saltHigh){
        var factoryAddress = this.factoryAddress.slice(2)
        var byteCode = this.byteCode
        var addresses = []
        while(saltLow<saltHigh){
            var saltHex = this.numberToUint256(saltLow)
            addresses.push(
                this.buildCreate2Address(
                    factoryAddress, saltHex, byteCode
                )
            )
            saltLow++;
        }
        return addresses;
    }

}

module.exports = class SuicideManager{

    constructor(fname="suicide.txt"){
        this.fname = fname
        this.cuitls = new CREATE2Utils("");
    }

    generate(low, high){
        var addresses = this.cuitls.getAddresses(low, high);
        write(addresses, this.fname)
    }

    add(newAddresses){
        var addresses = read(this.fname)
        for(var i=0; i<newAddresses.length; i++)
            addresses.push(newAddresses[i])
        write(addresses, this.fname)
    }
    
    get(n){
        var addresses = read(this.fname)
        var retAddresses = []
        while(n > 0){
            retAddresses.push(addresses.pop())
            n--;
        }
        write(addresses, this.fname)
        return retAddresses;
    }
}
