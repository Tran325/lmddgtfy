var fs = require('fs');
const WebSocket = require('ws');

const ws = new WebSocket(
  'ws://127.0.0.1:28333/ws',
  {
    cert: fs.readFileSync('/root/bloxroute/external_gateway/registration_only/external_gateway_cert.pem'),
    key: fs.readFileSync('/root/bloxroute/external_gateway/registration_only/external_gateway_key.pem'),
    rejectUnauthorized: false,
  }
);

function proceed() {
ws.send(`{"jsonrpc": "2.0", "id": 1, "method": "subscribe", "params": ["newTxs", {"include": ["tx_hash","raw_tx"]}]}`);
//yws.send(`{"jsonrpc": "2.0", "id": 1, "method": "subscribe", "params": ["newTxs", {"include": ["tx_hash"], "filters": "{to} IN ['']"`);
}

function handle(data) {    
//console.log(nextNotification.toString()); // or process it generally
//console.log(data)
//console.log(data["params"])
//data = JSON.stringify(data.toString())
//var hash = data["params"]["result"]["txhash"]
//var to = data["params"]["result"]["txContents"]["to"]
//console.log(hash,to)
var date = new Date()
// console.log(data.toString(),date.toISOString())
data = JSON.parse(data)
try{
  console.log(data.params.result.txHash, "\n\n===================")
}
catch{
  console.log("wtf")
}
// console.log(data.params.txHash)
// print(a)
}

ws.on('open', proceed);
ws.on('message', handle);
