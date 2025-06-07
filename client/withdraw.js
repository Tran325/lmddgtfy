const trader = require('./trader.js')
const ethers = require("ethers");
const bloxRoute = require("./bloxroute.js")

const bloxroute = new bloxRoute()
bloxroute.run()
const traderObj = new trader(bloxroute)


async function withdraw(){
    traderObj.sendBackBalance()
}


withdraw()