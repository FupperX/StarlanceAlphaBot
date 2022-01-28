/**
 * STARAD EWS
 */ 

const request = require('request');

var channelID = "722146937649889470";//"722146937649889470";
var guildID = "721872207239970866";

var FIRST_LOAD = true;
var DETECT_INTERVAL = 10;

var Discord;
var client;

const ALERT_LEVEL = {
    ROUTINE: 'Routine',
    IRREGULAR: 'Irregular',
    ELEVATED: 'Elevated',
    SEVERE: 'Severe',
    CRITICAL: 'Critical'
}; 

const ALERT_COLORS = {
    'Routine': '#05c5f0',
    'Irregular': '#1b7816',//'#11f005',
    'Elevated': '#f0e805',
    'Severe': '#ff5100',
    'Critical': '#ff0000'
}

exports.initiate = function(_Discord, _client) {
    Discord = _Discord;
    client = _client;

    runDetectInterval();
}

// var channel = client.channels.cache.get(channelID);

function runDetectInterval(){
    runDetect();
  
    setTimeout(() => {
        runDetectInterval();
    }, DETECT_INTERVAL * 60 * 1000);
}

function sendAlert(alertLevel, text){
    const embed = new Discord.MessageEmbed()
        // .setColor("#f07b05")
        .setColor(ALERT_COLORS[alertLevel])
        .setDescription("**STARAD EWS ALERT**")
        .setThumbnail("https://i.imgur.com/WVTPNml.png")
        // .addFields(fields)
        .addFields({ name: alertLevel.toUpperCase() + ' ALERT', value: text, inline: false })
        .setTimestamp()
        .setFooter('POWERED BY IRIDIUM AEROSPACE DEFENSE INCORPORATED\nKNOW EARLY, STRIKE FAST');

    var channel = client.channels.cache.get(channelID);
    channel.send(embed);

    /*
    { name: 'FACTION', value: factionText, inline: true },
          { name: '\u200B', value: '\u200B', inline: true },
          { name: 'SYSTEM', value: systemText, inline: true },
          { name: 'TYPE', value: type, inline: true },
          { name: '\u200B', value: '\u200B', inline: true },
          { name: 'VALUE', value: value, inline: true }
    */
}

function runDetect(){

    console.log("Running EWS detection.");

    var primaryFaction = "Starlance Alpha";
    var factionURL = `https://elitebgs.app/api/ebgs/v5/factions?name=${primaryFaction}`;

    request(factionURL, (err, res, content) => {
        try {
            if (err){
                console.log(err);
                // callback(null);
                return;
            }
            
            var factionJSON = JSON.parse(content);
            // console.log(factionJSON.docs[0].faction_presence);
            for(var factionPresence of factionJSON.docs[0].faction_presence) {
                var system = factionPresence['system_name'];
                sendAlert(ALERT_LEVEL.ROUTINE, `Starlance Alpha has entered the ${system} system.`);
                sendAlert(ALERT_LEVEL.IRREGULAR, `Faction Union of Jath for Equality has entered the ${system} system.`);
                sendAlert(ALERT_LEVEL.IRREGULAR, `Core system ${system} has not been updated in 3 days.`);
                sendAlert(ALERT_LEVEL.ELEVATED, `Starlance Alpha 5% influence drop in ${system} detected.`);
                sendAlert(ALERT_LEVEL.ELEVATED, `Starlance Alpha 10% influence drop in ${system} detected.`);
                sendAlert(ALERT_LEVEL.ELEVATED, `Starlance Alpha lead on Union of Jath for Equality in ${system} has dropped by 10%.`);
                sendAlert(ALERT_LEVEL.ELEVATED, `Starlance Alpha has lost a day of war in fringe system ${system}.\n**War score:**\nStarlance Alpha: 0\nUnion of Jath for Equality: 1`);
                sendAlert(ALERT_LEVEL.SEVERE, `Starlance Alpha 20% influence drop in ${system} detected.`);
                sendAlert(ALERT_LEVEL.SEVERE, `Starlance Alpha lead on Union of Jath for Equality in ${system} has dropped by 20%.`);
                sendAlert(ALERT_LEVEL.SEVERE, `Starlance Alpha has lost a day of war in core system ${system}.\n**War score:**\nStarlance Alpha: 0\nUnion of Jath for Equality: 1`);
                sendAlert(ALERT_LEVEL.CRITICAL, `Starlance Alpha has lost a day of war in critical system ${system}.\n**War score:**\nStarlance Alpha: 0\nUnion of Jath for Equality: 1`);
                return;
            }
        }
        catch (e) {
            console.log(e.stack);
            console.log(e.message);
            // callback(null);
        }
    });

}