const config = require('./config.js');
var fs = require('fs');

readJson = function(fname){
    let rawdata = fs.readFileSync(fname);
    let jsonobj = JSON.parse(rawdata);
    return jsonobj;
}

loadWhitelist = function(fname){
    var tokens = []
    var data = readJson(fname);
    for(var i=0; i<data.length; i++){
        tokens.push(data[i].id.toLowerCase())
    }
    return tokens;
}    

getVal = function(data, key){
    for(e in data){
        if(data[e].name == key){
            return data[e].value
        }
    }
}

randomID = function(){
    return Math.floor(Math.random() * (1000000)).toString();
}


function getTimestamp() {
    const pad = (n,s=2) => (`${new Array(s).fill(0)}${n}`).slice(-s);
    const d = new Date();
    
    return `${pad(d.getFullYear(),4)}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}.${pad(d.getMilliseconds(),3)}`;
}


log = function(dataString, stdout=true){
    var logString = getTimestamp() + ": " + dataString

    if(stdout)
        console.log(logString);

    fs.appendFileSync(config.logf, logString+"\n");
}


module.exports = {
    readJson: readJson,
    loadWhitelist: loadWhitelist,
    getVal: getVal,
    log: log,
    randomID: randomID,
}
