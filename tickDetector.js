var bgsLogger = require('./bgsLogger.js');

const fs = require('fs');
const moment = require('moment');

const io = require('socket.io-client');


exports.initiate = function(Discord, client) {

    const socket = io('http://phelbore.com:31173').connect();

    socket.on('connect', () => {
        console.log('Connected to Phelbore Tick Detector');
    });

    socket.on('error', (err) => {
        console.log(err);
    });
    
    socket.on('message', (data) => {
        checkTick(Discord, client, data);
    });

    socket.on('tick', (data) => {
        checkTick(Discord, client, data);
    });
    
}

function checkTick(Discord, client, data){
    let tickTime = new Date(data);
    let lastTickFormattedTime = moment(tickTime).utc().format('HH:mm');
    let lastTickFormattedDate = moment(tickTime).utc().format('MMM Do');
    var timeFormatted = `${lastTickFormattedTime} UTC - ${lastTickFormattedDate}`;

    var ticked = true;

    var filePath = "./lastTickTime.txt";
    if(fs.existsSync(filePath)){
        var lastTickTime = fs.readFileSync(filePath, "utf8");
        if(lastTickTime === timeFormatted){
            ticked = false;
        }
    }

    fs.writeFileSync(filePath, timeFormatted);

    if(ticked){
        console.log("Tick detected at " + timeFormatted);
        bgsLogger.handleTick(Discord, client, tickTime, timeFormatted);
    }
}
