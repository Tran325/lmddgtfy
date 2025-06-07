module.exports = {
    // Sandwich config
    debug:false,
    maxAttackEth: "",
    minTargetEthIn: "",
    rugCheckEth: "0.01", //NOTE: SC Balance must be greater than rugCheckEth + maxAttackEth
    nSearchSteps: 10, //Binary search or PromiseAll
    gasBumpGwei: '6', //gasBump to frontrun buy target txn
    blackListGasBumpGwei: '10', //gasBump for the blackList txn to frontun self
    slippage: '0', // in % // HMM this doesn't work rn lol
    minprofitEth: '0.0001',
    minReserveEth: '20', //set 0 only if ARC is active, else you will get REKT
    gasLimit: '1000000',
    dumpPercent: "50", //if token becomes less than token*dumpPercent/100 we leave FOR ARC
    networkDefaultGasGwei: '5',
    alpha: '90', // \alpha in [0, 100] more the alpha, less the gas
    PGA: true,

    stopLossEth:"0.1",

    // Addresses
    traderContractAddress:"",
    bnbReserveAddress:'',
    dexRouterAddress:"", //using PCSv2
    motherWalletAddress: "",
    traderWalletAddress: "",
    secret:"",
    mommyContractAddress:"",

    // function signatures for your contract
    buyId: "",
    sellId: "",
    blacklistId: "",
    depositId: "",
    sendBackBalanceId: "",

    // BloxRoute and node config
    logf:"logs.txt",
    nodeWSS:"ws://127.0.0.1:8546",
    publicNodeWSS: "wss://bsc-ws-node.nariox.org:443",
    nodeHTTP:"http://127.0.0.1:8545",
    bloxRouteWSS:"ws://127.0.0.1:28333/ws",
    // bloxRouteCloudWSS: "wss://singapore.bsc.blxrbdn.com/ws", //for block stream
    // bloxRouteCloudWSS: "wss://uk.bsc.blxrbdn.com/ws", //for block stream
    bloxRouteCloudWSS: "wss://virginia.bsc.blxrbdn.com/ws", //for block stream
    bloxRouteAuth:"",

    rawBuyFnName: "_executeBuy"
};