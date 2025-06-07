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
    ws.send(`{"jsonrpc": "2.0", "id": 1, "method": "subscribe", "params": ["bdnBlocks", {"include": ["hash"]}]}`)
}

function handle(nextNotification) {
    console.log(nextNotification.toString()); // or process it generally
}

ws.on('open', proceed);
ws.on('message', handle);
