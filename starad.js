/**
 * STARAD EWS
 */ 

const request = require('request');
const fs = require('fs');

var channelID = "722146937649889470";//"722146937649889470";
var guildID = "721872207239970866";

var FIRST_LOAD = true;
var DETECT_INTERVAL = 10;

var Discord;
var client;

var PRIMARY_FACTION = "Starlance Alpha";

const ALERT_LEVEL = {
    ROUTINE: 'Routine',
    IRREGULAR: 'Irregular',
    ELEVATED: 'Elevated',
    SEVERE: 'Severe',
    CRITICAL: 'Critical'
}; 

const ALERT_DETAILS = {
    'Routine': {
        color: '#05c5f0',
        image: 'https://cdn.discordapp.com/attachments/722146937649889470/936253519185469450/alert1routine.png'
    },
    'Irregular': {
        color: '#1b7816',//'#11f005',
        image: 'https://cdn.discordapp.com/attachments/722146937649889470/936253519470673930/alert2irregular.png'
    },
    'Elevated': {
        color: '#f0e805',
        image: 'https://cdn.discordapp.com/attachments/722146937649889470/936253519806205992/alert3elevated.png'
    },
    'Severe': {
        color: '#ff5100',
        image: 'https://cdn.discordapp.com/attachments/722146937649889470/936253520062079016/alert4severe.png'
    },
    'Critical': {
        color: '#ff0000',
        image: 'https://cdn.discordapp.com/attachments/722146937649889470/936253520330518568/alert5critical.png'
    }
}

const SYSTEM_TYPE = {
    CORE: 2,
    CONTROLLED: 1,
    FRINGE: 0
}; 

var CORE_SYSTEMS = ['Turing', 'Satva', 'Janjiwa', 'HIP 78551', 'Caudjabe'];

var knownData = {};
var miscData = {};

exports.initiate = function(_Discord, _client) {
    Discord = _Discord;
    client = _client;

    loadData();
    runDetectInterval();
}

function loadData() {
    var filePath = "./staradData.json";
    if(fs.existsSync(filePath)){
        var dataStr = fs.readFileSync(filePath, "utf8");
        var json = JSON.parse(dataStr);
        knownData = json['Systems'];
        miscData = json['Misc'];
    }
    else {
        knownData = {};
        miscData = {};
    }
}

function saveData() {
    var filePath = "./staradData.json";
    var json = {
        'Systems': knownData,
        'Misc': miscData
    };
    var dataStr = JSON.stringify(json, null, 2);
    fs.writeFileSync(filePath, dataStr);
}

function doRequest(url) {
    return new Promise(function (resolve, reject) {
        request(url, function (error, res, body) {
            if (!error && res.statusCode == 200) {
                resolve(body);
            } 
            else {
                console.log(error);
                resolve(null);
            }
        });
    });
}

async function getInaraTraffic(system){
    var content = await doRequest(`https://inara.cz/starsystem/?search=${system}`);
    if(content == null)
        return null;

    try {
        var traffic = content.match(new RegExp(`(?<=actual traffic\.">)[0-9-+]*(?= ships)`))[0];
        
        var trafficN = traffic;
        if(trafficN.endsWith("+")){
            trafficN = trafficN.substring(0, trafficN.length-1);
        }
        if(trafficN.includes("-")){
            trafficN = trafficN.split("-")[0];
        }
        
        var trafficNum = parseInt(trafficN);
        return [trafficNum, traffic + " ships"];
    }
    catch (e) {
        console.log(e.stack);
        console.log(e.message);
        return null;
    }
}

function runDetectInterval(){
    try {
        runDetect();
    }
    catch (e) {
        console.log(e.stack);
        console.log(e.message);
    }
  
    setTimeout(() => {
        runDetectInterval();
    }, DETECT_INTERVAL * 60 * 1000);
}

function sendAlert(alertLevel, text){
    const embed = new Discord.MessageEmbed()
        // .setColor("#f07b05")
        .setColor(ALERT_DETAILS[alertLevel].color)
        .setDescription("**STARAD EWS ALERT**")
        .setThumbnail(ALERT_DETAILS[alertLevel].image)
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

function getSystemType(systemData) {
    if(CORE_SYSTEMS.includes(systemData['name']))
        return SYSTEM_TYPE.CORE;
    
    var primaryControlling = systemData['controlling_minor_faction'].toUpperCase() == PRIMARY_FACTION.toUpperCase();
    if(primaryControlling)
        return SYSTEM_TYPE.CONTROLLED;

    return SYSTEM_TYPE.FRINGE;
}

function convertSystemData(systemData) {
    var converted = systemData;
    
    converted['factions'] = {};
    for(var faction of systemData['factions']){
        var name = faction['name'];
        converted['factions'][name] = faction;
    }

    converted['conflicts'] = {};
    for(var conflict of systemData['conflicts']){
        var name = conflict['faction1']['name'] + " vs. " + conflict['faction2']['name']; // possible duplication when same factions enter war immediately? not sure
        converted['conflicts'][name] = conflict;
    }

    return converted;
}

function sendFactionEntered(faction, system, systemData){

}

function sendFactionLeft(faction, system, systemData){

}

function checkSystemChange(systemData) {
    var system = systemData['name'];
    var updatedMillis = Date.parse(systemData['updated_at']);
    var lastUpdatedMillis = Date.parse(knownData[system]['updated_at']);

    var changed = false;

    if(updatedMillis > lastUpdatedMillis) {
        for(const [faction, factionData] of systemData['factions']){
            if(!(faction in knownData[system]['factions'])) { // new faction entered system
                sendFactionEntered(faction, system, systemData);
                changed = true;
            }
            else if(!changed && 
                factionData['faction_details']['faction_presence']['influence'] 
                    != knownData[system][faction]['faction_details']['faction_presence']['influence']){
                // inf change
                changed = true;
            }
        }

        for (const [faction, factionData] of knownData[system]['factions']) {
            if(!(faction in systemData['factions'])) { // faction left system
                sendFactionLeft(faction, system, systemData);
                changed = true;
            }
        }

        if(!changed) {
            for(const [conflictName, conflictData] of systemData['conflicts']) {
                if(!(conflictName in knownData[system]['conflicts'])) // new conflict
                    return true;
                var c1 = conflictData;
                var c2 = knownData[system]['conflicts'][conflictName];
                if(c1['status'] != c2['status'] 
                    || c1['faction1']['days_won'] != c2['faction1']['days_won'] 
                    || c1['faction2']['days_won'] != c2['faction2']['days_won']) // conflict changed
                    return true;
            }
        }
    }

    return changed;
}

function systemTypeToName(systemType) {
    if(systemType == SYSTEM_TYPE.CORE)
        return "Core";
    if(systemType == SYSTEM_TYPE.CONTROLLED)
        return "Controlled";
    if(systemType == SYSTEM_TYPE.FRINGE)
        return "Fringe";
}

async function checkTrafficLevels(systemData){
    // var systemType = getSystemType(systemData);
    var system = systemData['name'];

    var trafficRes = await getInaraTraffic(system);
        
    if(trafficRes != null){
        var traffic = trafficRes[0];
        var trafficStr = trafficRes[1];

        if('Traffic Timer' in miscData && system in miscData['Traffic Timer']){
            if(Date.now() - miscData['Traffic Timer'][system]['Last Sent'] < 24 * 60 * 60 * 1000) {
                if(traffic - miscData['Traffic Timer'][system]['Traffic'] < 20){
                    return; // only send more than once per 24 hours per system if traffic exceeds previous by 20 ships
                }
            }
        }

        if(traffic >= 60)
            sendAlert(ALERT_LEVEL.ELEVATED, `Extremely high traffic level of ${trafficStr} detected in ${system}.`);
        else if(traffic >= 40)
            sendAlert(ALERT_LEVEL.IRREGULAR, `High traffic level of ${trafficStr} detected in ${system}.`);
        else if(traffic >= 20)
            sendAlert(ALERT_LEVEL.ROUTINE, `Moderate traffic level of ${trafficStr} detected in ${system}.`);
        else return;

        if(!('Traffic Timer' in miscData))
            miscData['Traffic Timer'] = {};

        miscData['Traffic Timer'][system] = {
            'Last Sent': Date.now(),
            'Traffic': traffic
        };

        saveData();
    }
}

function hasExpansionState(stateArr){
    for(var state of stateArr){
        if(state['state'] == 'expansion')
            return true;
}

function getSecondFactionInSystem(systemData) {
    var factions = [];
    for(const [faction, factionData] of systemData['factions'])
        factions.push([faction, factionData['faction_details']['faction_presence']['influence']]);
    
    factions.sort(function(first, second) {
        return second[1] - first[1];
    });

    if(factions.length >= 2)
        return factions[1];
    return null;
}

function checkInfluenceDrop(systemData) {
    var systemType = getSystemType(systemData);
    var system = systemData['name'];

    var currentInf = systemData['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['influence'];
    var previousInf = knownData[system]['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['influence'];

    var drop = (previousInf - currentInf) * 100;

    var alertLevel;
    
    if(drop >= 20){
        alertLevel = systemType >= SYSTEM_TYPE.CONTROLLED ? ALERT_LEVEL.CRITICAL : ALERT_LEVEL.SEVERE;
    }
    else if(drop >= 15){
        alertLevel = systemType >= SYSTEM_TYPE.CONTROLLED ? ALERT_LEVEL.SEVERE : ALERT_LEVEL.ELEVATED;
    }
    else if(drop >= 10){
        alertLevel = systemType >= SYSTEM_TYPE.CONTROLLED ? ALERT_LEVEL.ELEVATED : ALERT_LEVEL.IRREGULAR;
    }
    else if(drop >= 5){
        alertLevel = ALERT_LEVEL.ROUTINE;
    }
    else return;

    var str = `Starlance Alpha ${drop}% influence drop in ${systemType.toLowerCase()} system ${system} detected.`;

    if(hasExpansionState(systemData['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['recovering_states']) && 
        !hasExpansionState(knownData[system]['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['recovering_states'])) {
        str += " If we were expanding out of this system, 15% of the drop is a result of the expansion ending.";
    }

    sendAlert(alertLevel, str);
}

function checkInfluenceGapDrop(systemData) {
    var systemType = getSystemType(systemData);
    var system = systemData['name'];

    var currentInf = systemData['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['influence'];
    var previousInf = knownData[system]['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['influence'];

    var current2ndFac = getSecondFactionInSystem(systemData);
    var previous2ndFac = getSecondFactionInSystem(knownData[system]);
    if(current2ndFac == null || previous2ndFac == null)
        return;
    
    var currentGap = currentInf - current2ndFac[1];
    var previousGap = previousInf - previous2ndFac[1];
    
    var drop = (previousGap - currentGap) * 100;

    var alertLevel;
    
    if(drop >= 30){
        alertLevel = ALERT_LEVEL.CRITICAL;
    }
    else if(drop >= 20){
        alertLevel = ALERT_LEVEL.SEVERE;
    }
    else if(drop >= 15){
        alertLevel = ALERT_LEVEL.ELEVATED;
    }
    else if(drop >= 10){
        alertLevel = ALERT_LEVEL.IRREGULAR;
    }
    else if(drop >= 5){
        alertLevel = ALERT_LEVEL.ROUTINE;
    }
    else return;

    var str = `Starlance Alpha lead on ${current2ndFac[0]} in ${systemType.toLowerCase()} system ${system} has dropped by ${drop}%.`;

    if(hasExpansionState(systemData['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['recovering_states']) && 
        !hasExpansionState(knownData[system]['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['recovering_states'])) {
        str += " If we were expanding out of this system, 15% of the drop is a result of the expansion ending.";
    }

    sendAlert(alertLevel, str);
}

function checkConflictChange(systemData) {
    // TODO

    var systemType = getSystemType(systemData);
    var system = systemData['name'];

    for(const [conflictName, conflictData] of systemData['conflicts']) {

        var f1 = conflictData['faction1'];
        var f2 = conflictData['faction2'];
        
        if(f2['name'] == PRIMARY_FACTION){
            var temp = f1;
            f1 = f2;
            f2 = temp;
        }
        
        var scoreStr = `\n**War score:**\n${f1['name']}: ${f1['days_won']}\n${f2['name']}: ${f2['days_won']}`;

        if(!(conflictName in knownData[system]['conflicts'])){
            
        }
    }
}

async function runDetect(){

    console.log("Running EWS detection.");

    // var primaryFaction = "Starlance Alpha";
    var factionURL = `https://elitebgs.app/api/ebgs/v5/factions?name=${PRIMARY_FACTION}`;

    var content = await doRequest(factionURL);
    
    if (content == null)
        return;
        
    var factionJSON = JSON.parse(content);
    var data = factionJSON.docs[0];

    var systems = [];

    for(var factionPresence of data.faction_presence) {
        var system = factionPresence['system_name'];
        systems.push(system);
    }

    var wasNoPendingExpansion = true;
    for(var system of systems){
        if(hasExpansionState(knownData[system]['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['pending_states'])) {
            wasNoPendingExpansion = false;
            break;
        }
    }

    for(var system of systems){
        var systemContent = await doRequest(`https://elitebgs.app/api/ebgs/v5/systems?name=${system}&factionDetails=true`);
        var json = JSON.parse(systemContent);
        var systemData = convertSystemData(json.docs[0]);

        var systemType = getSystemType(systemData);
        if(systemType >= SYSTEM_TYPE.CONTROLLED) {
            await checkTrafficLevels(systemData);
        }

        if(!(system in knownData)){
            sendAlert(ALERT_LEVEL.ROUTINE, `Starlance Alpha has entered the ${system} system.`);
            knownData[system] = systemData;
            knownData[system]['conflicts'] = {}; // force checking of invasion war
        }

        if(wasNoPendingExpansion && hasExpansionState(systemData['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['pending_states'])) {
            sendAlert(ALERT_LEVEL.ROUTINE, `Starlance Alpha is entering expansion.`);
            wasNoPendingExpansion = false;
        }

        if(checkSystemChange(systemData)){
            checkInfluenceDrop(systemData);
            
            if(systemType >= SYSTEM_TYPE.CONTROLLED)
                checkInfluenceGapDrop(systemData);

            checkConflictChange(systemData);
        }

        // if(primaryControlling){
        //     sendAlert(ALERT_LEVEL.IRREGULAR, `Faction Union of Jath for Equality has entered the ${system} system.`);
        //     sendAlert(ALERT_LEVEL.IRREGULAR, `Core system ${system} has not been updated in 3 days.`);
        //     sendAlert(ALERT_LEVEL.ELEVATED, `Starlance Alpha 5% influence drop in ${system} detected.`);
        //     sendAlert(ALERT_LEVEL.ELEVATED, `Starlance Alpha 10% influence drop in ${system} detected.`);
        //     sendAlert(ALERT_LEVEL.ELEVATED, `Starlance Alpha lead on Union of Jath for Equality in ${system} has dropped by 10%.`);
        // }
        // else sendAlert(ALERT_LEVEL.ELEVATED, `Starlance Alpha has lost a day of war in fringe system ${system}.\n**War score:**\nStarlance Alpha: 0\nUnion of Jath for Equality: 1`);
        
        // if(primaryControlling) {
        //     sendAlert(ALERT_LEVEL.SEVERE, `Starlance Alpha 20% influence drop in ${system} detected.`);
        //     sendAlert(ALERT_LEVEL.SEVERE, `Starlance Alpha lead on Union of Jath for Equality in ${system} has dropped by 20%.`);
        //     sendAlert(ALERT_LEVEL.SEVERE, `Starlance Alpha has lost a day of war in core system ${system}.\n**War score:**\nStarlance Alpha: 0\nUnion of Jath for Equality: 1`);
        //     sendAlert(ALERT_LEVEL.CRITICAL, `Starlance Alpha has lost a day of war in critical system ${system}.\n**War score:**\nStarlance Alpha: 0\nUnion of Jath for Equality: 1`);
        // }
    }
}