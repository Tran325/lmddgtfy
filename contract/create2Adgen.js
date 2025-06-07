const ethers = require("ethers");

function numberToUint256(value) {
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

function buildCreate2Address(creatorAddress, saltHex, byteCode) {
  return `0x${ethers.utils
    .keccak256(
      `0x${["ff", creatorAddress, saltHex, ethers.utils.keccak256(byteCode)]
        .map(x => x.replace(/0x/, ""))
        .join("")}`
    )
    .slice(-40)}`.toLowerCase();
}

function getAddresses(factoryAddress, byteCode, saltLow, saltHigh){
    factoryAddress = factoryAddress.slice(2)
    var addresses = []
    var i = saltLow;
    while(i<saltHigh){
        saltHex = numberToUint256(i)
        addresses.push(
            buildCreate2Address(
                factoryAddress, saltHex, byteCode
            )
        )
        i++;
    }
    return addresses;
}

var factoryAddress = ""
var code = ""
var low = 0
var high = 10
var addresses = getAddresses(factoryAddress, code, low, high)
console.log(addresses)
