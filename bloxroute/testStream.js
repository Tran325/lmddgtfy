const WebSocket = require('ws');

const ws = new WebSocket(
  'ws://127.0.0.1:28333', 
  {
    headers: { 
      "Authorization" :""
    },
  }
);


function proceed() {
    ws.send(`{"jsonrpc": "2.0", "id": 1, "method": "subscribe", "params": ["newTxs",{"tx_contents.input"}]}`);
}


function handle(nextNotification) {
    console.log(nextNotification.toString()); // or process it generally
}

ws.on('open', proceed);
ws.on('message', handle);

