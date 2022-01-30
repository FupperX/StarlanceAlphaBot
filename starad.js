/**
 * STARAD EWS
 */ 

const request = require('request');
const fs = require('fs');

var channelID = "783011426595766332";//"722146937649889470";
var guildID = "721872207239970866";

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
        image: 'https://cdn.discordapp.com/attachments/722146937649889470/936843277829812224/alert1routine.png'
    },
    'Irregular': {
        color: '#2ab823', //'#1b7816',//'#11f005',
        image: 'https://cdn.discordapp.com/attachments/722146937649889470/936843278089863278/alert2irregular.png'
    },
    'Elevated': {
        color: '#f0e805',
        image: 'https://cdn.discordapp.com/attachments/722146937649889470/936843278400229386/alert3elevated.png'
    },
    'Severe': {
        color: '#ff5100',
        image: 'https://cdn.discordapp.com/attachments/722146937649889470/936843280686120960/alert4severe.png'
    },
    'Critical': {
        color: '#ff0000',
        image: 'https://cdn.discordapp.com/attachments/722146937649889470/936843280946188298/alert5critical.png'
    }
}

const SYSTEM_TYPE = {
    CORE: 2,
    CONTROLLED: 1,
    FRINGE: 0
}; 

var CORE_SYSTEMS = ['Turing', 'Satva', 'Janjiwa', 'HIP 78551', 'Caudjabe', 'Telenisates'];

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

async function runDetectSquash(){
    try {
        await runDetect();
    }
    catch (e) {
        console.log(e.stack);
        console.log(e.message);
    }
}

function runDetectInterval(){
    runDetectSquash();
  
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
    var converted = cloneObj(systemData);
    
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

function sendActivationNotice(){

    var text = 'Listening posts operating at optimal capacity.\n\n**NOW MONITORING:**';

    var core = 0;
    var controlled = 0;
    var fringe = 0;

    for (const [system, systemData] of Object.entries(knownData)) {
        var systemType = getSystemType(systemData);
        if(systemType == SYSTEM_TYPE.CORE)
            core++;
        else if(systemType == SYSTEM_TYPE.CONTROLLED)
            controlled++;
        else 
            fringe++;
    }

    text += `\n- **${core}** core systems\n- **${controlled}** controlled systems\n- **${fringe}** fringe systems\n`;

    const embed = new Discord.MessageEmbed()
        .setColor(ALERT_DETAILS[ALERT_LEVEL.IRREGULAR].color)
        .setDescription("**STARAD EWS ALERT**")
        .setThumbnail(ALERT_DETAILS[ALERT_LEVEL.IRREGULAR].image)
        .addFields({ name: '**STARAD DEFENSE NETWORK ONLINE**', value: text, inline: false })
        .setTimestamp()
        .setFooter('POWERED BY IRIDIUM AEROSPACE DEFENSE INCORPORATED\nKNOW EARLY, STRIKE FAST');

    var channel = client.channels.cache.get(channelID);
    channel.send(embed);
}

function sendFactionEntered(faction, system, systemData){
    var systemType = getSystemType(systemData);
    var systemTypeStr = systemTypeToName(systemType).toLowerCase();

    if(systemType == SYSTEM_TYPE.FRINGE)
        return;

    sendAlert(systemType == SYSTEM_TYPE.CORE ? ALERT_LEVEL.IRREGULAR : ALERT_LEVEL.ROUTINE, `${faction} has expanded into the ${system} ${systemTypeStr} system.`);
}

function sendFactionLeft(faction, system, systemData){
    var systemType = getSystemType(systemData);
    if(systemType == SYSTEM_TYPE.FRINGE)
        return;
    
    sendAlert(systemType == SYSTEM_TYPE.CORE ? ALERT_LEVEL.IRREGULAR : ALERT_LEVEL.ROUTINE, `${faction} has retreated from the ${system} system.`);
}

function checkSystemChange(systemData) {
    var system = systemData['name'];
    var updatedMillis = Date.parse(systemData['updated_at']);
    var lastUpdatedMillis = Date.parse(knownData[system]['updated_at']);

    var changed = false;

    if(updatedMillis > lastUpdatedMillis) {
        for(const [faction, factionData] of Object.entries(systemData['factions'])){
            if(!(faction in knownData[system]['factions'])) { // new faction entered system
                sendFactionEntered(faction, system, systemData);
                changed = true;
            }
            else if(!changed && 
                factionData['faction_details']['faction_presence']['influence'] 
                    != knownData[system]['factions'][faction]['faction_details']['faction_presence']['influence']){
                // inf change
                changed = true;
            }
        }

        for (const [faction, factionData] of Object.entries(knownData[system]['factions'])) {
            if(!(faction in systemData['factions'])) { // faction left system
                sendFactionLeft(faction, system, systemData);
                changed = true;
            }
        }

        if(!changed) {
            for(const [conflictName, conflictData] of Object.entries(systemData['conflicts'])) {
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

        if(!changed){
            for (const [faction, factionData] of Object.entries(knownData[system]['factions'])) {
                for(var state of factionData['faction_details']['faction_presence']['active_states']) {
                    if(!hasState(state, knownData[system]['factions'][faction]['faction_details']['faction_presence']['active_states']))
                        return true;
                }
                for(var state of factionData['faction_details']['faction_presence']['pending_states']) {
                    if(!hasState(state, knownData[system]['factions'][faction]['faction_details']['faction_presence']['pending_states']))
                        return true;
                }
                for(var state of factionData['faction_details']['faction_presence']['recovering_states']) {
                    if(!hasState(state, knownData[system]['factions'][faction]['faction_details']['faction_presence']['recovering_states']))
                        return true;
                }

                for(var state of knownData[system]['factions'][faction]['faction_details']['faction_presence']['active_states']) {
                    if(!hasState(state, factionData['faction_details']['faction_presence']['active_states']))
                        return true;
                }
                for(var state of knownData[system]['factions'][faction]['faction_details']['faction_presence']['pending_states']) {
                    if(!hasState(state, factionData['faction_details']['faction_presence']['pending_states']))
                        return true;
                }
                for(var state of knownData[system]['factions'][faction]['faction_details']['faction_presence']['recovering_states']) {
                    if(!hasState(state, factionData['faction_details']['faction_presence']['recovering_states']))
                        return true;
                }
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

function checkOutdated(system, systemData) {
    var systemType = getSystemType(systemData);
    var systemTypeStr = systemTypeToName(systemType);

    if(systemType == SYSTEM_TYPE.FRINGE)
        return;

    if('Outdated Timer' in miscData && system in miscData['Outdated Timer'] && Date.now() - miscData['Outdated Timer'][system] < 2 * 24 * 60 * 60 * 1000){
        return; // only warn once per 2 days
    }

    var days = (Date.now() - Date.parse(systemData['updated_at'])) / 1000 / 60 / 60 / 24;

    if(systemType == SYSTEM_TYPE.CORE && days >= 3 || systemType == SYSTEM_TYPE.CONTROLLED && days >= 5) {

        sendAlert(systemType == SYSTEM_TYPE.CORE ? ALERT_LEVEL.ELEVATED : ALERT_LEVEL.IRREGULAR, `${systemTypeStr} system ${system} has not been updated in ${Math.floor(days)} days.`);

        if(!('Outdated Timer' in miscData))
            miscData['Outdated Timer'] = {};

        miscData['Outdated Timer'][system] = Date.now();

        saveData();

    }
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

function hasState(stateLook, stateArr){
    for(var state of stateArr)
        if(state['state'] == stateLook)
            return true;
}

function getSecondFactionInSystem(systemData) {
    var factions = [];
    for(const [faction, factionData] of Object.entries(systemData['factions']))
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
    var systemTypeStr = systemTypeToName(systemType).toLowerCase();

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

    var str = `${PRIMARY_FACTION} ${Math.floor(drop)}% influence drop in ${systemTypeStr} system ${system} detected.`;

    if(hasState('expansion', systemData['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['recovering_states']) && 
        !hasState('expansion', knownData[system]['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['recovering_states'])) {
        str += " If we were expanding out of this system, 15% of the drop is a result of the expansion ending.";
    }

    sendAlert(alertLevel, str);
}

function checkInfluenceGapDrop(systemData) {
    var systemType = getSystemType(systemData);
    var systemTypeStr = systemTypeToName(systemType).toLowerCase();

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

    var str = `${PRIMARY_FACTION} lead on ${current2ndFac[0]} in ${systemTypeStr} system ${system} has dropped by ${Math.floor(drop)}%.`;

    if(hasState('expansion', systemData['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['recovering_states']) && 
        !hasState('expansion', knownData[system]['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['recovering_states'])) {
        str += " If we were expanding out of this system, 15% of the drop is a result of the expansion ending.";
    }

    sendAlert(alertLevel, str);
}

function checkConflictChange(systemData) {
    var systemType = getSystemType(systemData);
    var systemTypeStr = systemTypeToName(systemType).toLowerCase();

    var system = systemData['name'];

    for(const [conflictName, conflictData] of Object.entries(systemData['conflicts'])) {

        var type = conflictData['type'];
        var type2 = type;
        if(type2 == 'election') type2 = 'elections';

        var type3 = type2 == 'elections' ? `in ${type2}` : `at ${type2}`;

        var f1 = conflictData['faction1'];
        var f2 = conflictData['faction2'];

        var f1Key = 'faction1';
        var f2Key = 'faction2';

        if(f2['name'] == PRIMARY_FACTION){
            var temp = f1;
            f1 = f2;
            f2 = temp;

            temp = f1Key;
            f1Key = f2Key;
            f2Key = temp;
        }

        if(f1['name'] != PRIMARY_FACTION && systemType == SYSTEM_TYPE.FRINGE)
            continue;
        if(f1['name'] == 'Starlance Alpha' && f2['name'] == 'Union of Jath for Equality' && system == 'Lundji') // no one cares
            continue;
        
        var alertLevel = ALERT_LEVEL.ROUTINE;
        var str = '';
        var scoreStr = `\n\n**${type.toUpperCase()} SCORE :**\n${f1['name']}: **${f1['days_won']}**\n${f2['name']}: **${f2['days_won']}**`;

        var newConflict = !(conflictName in knownData[system]['conflicts']);
        if(conflictData['status'] == 'pending' && (newConflict || knownData[system]['conflicts'][conflictName]['status'] != 'pending')){
            str = `${f1['name']} is now pending ${type2} against ${f2['name']} in ${systemTypeStr} system ${system}.`;
            
            if(f2['name'] == PRIMARY_FACTION){
                if(systemType == SYSTEM_TYPE.CONTROLLED)
                    alertLevel = ALERT_LEVEL.SEVERE;
                else if(systemType == SYSTEM_TYPE.CORE)
                    alertLevel = ALERT_LEVEL.CRITICAL;
            }
        }
        else if(conflictData['status'] == 'active'){
            if(newConflict || knownData[system]['conflicts'][conflictName]['status'] != 'active') {
                str = `${f1['name']} is now ${type3} against ${f2['name']} in ${systemTypeStr} system ${system}.`;

                if(f2['name'] == PRIMARY_FACTION){
                    if(systemType == SYSTEM_TYPE.CONTROLLED)
                        alertLevel = ALERT_LEVEL.SEVERE;
                    else if(systemType == SYSTEM_TYPE.CORE)
                        alertLevel = ALERT_LEVEL.CRITICAL;
                }
            }
            else {
                // ticked
                if(f1['days_won'] > knownData[system]['conflicts'][conflictName][f1Key]['days_won']) {
                    str = `${f1['name']} has won a day of ${type2} against ${f2['name']} in ${systemTypeStr} system ${system}.`;

                    // if(f1['name'] == PRIMARY_FACTION) {
                    //     if(systemType == SYSTEM_TYPE.CONTROLLED)
                    //         alertLevel = ALERT_LEVEL.IRREGULAR;
                    //     else if(systemType == SYSTEM_TYPE.CORE)
                    //         alertLevel = ALERT_LEVEL.ELEVATED;
                    // }
                }
                if(f2['days_won'] > knownData[system]['conflicts'][conflictName][f2Key]['days_won']) {
                    if(f1['name'] == PRIMARY_FACTION) {
                        str = `${f1['name']} has lost a day of ${type2} against ${f2['name']} in ${systemTypeStr} system ${system}.`;

                        if(systemType == SYSTEM_TYPE.CONTROLLED)
                            alertLevel = ALERT_LEVEL.SEVERE;
                        else if(systemType == SYSTEM_TYPE.CORE)
                            alertLevel = ALERT_LEVEL.CRITICAL;
                        else alertLevel = ALERT_LEVEL.IRREGULAR;
                    }
                    else 
                        str = `${f2['name']} has won a day of ${type2} against ${f1['name']} in ${systemTypeStr} system ${system}.`;
                }
            }
        }
        else if(conflictData['status'] == '' && (newConflict || knownData[system]['conflicts'][conflictName]['status'] != '')){
            if(f1['days_won'] > f2['days_won']) {
                str = `${f1['name']} has won the ${type2} against ${f2['name']} in ${systemTypeStr} system ${system}.`;

                // if(f1['name'] == PRIMARY_FACTION) {
                //     if(systemType >= SYSTEM_TYPE.CONTROLLED)
                //         alertLevel = ALERT_LEVEL.IRREGULAR;
                // }
            }
            else if(f1['days_won'] < f2['days_won']) {
                if(f1['name'] == PRIMARY_FACTION) {
                    str = `${f1['name']} has been defeated in the ${type2} against ${f2['name']} in ${systemTypeStr} system ${system}.`;

                    if(systemType >= SYSTEM_TYPE.CONTROLLED)
                        alertLevel = ALERT_LEVEL.CRITICAL;
                    else
                        alertLevel = ALERT_LEVEL.IRREGULAR;
                }
                else 
                    str = `${f2['name']} has won the ${type2} against ${f1['name']} in ${systemTypeStr} system ${system}.`;
            }
            else {
                str = `${f2['name']} has drawed in the ${type2} against ${f1['name']} in ${systemTypeStr} system ${system}.`;

                if(f1['name'] == PRIMARY_FACTION && systemType >= SYSTEM_TYPE.CONTROLLED)
                    alertLevel = ALERT_LEVEL.SEVERE;
            }
        }

        if(str == '')
            continue;

        if(f1['name'] != PRIMARY_FACTION)
            str = 'Third party conflict status change detected.\n\n' + str;
        str = str + scoreStr;

        sendAlert(alertLevel, str);
    }
}

function cloneObj(obj){
    return JSON.parse(JSON.stringify(obj));
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

    var firstLoad = Object.keys(knownData).length == 0 && systems.length > 0;

    var wasNoPendingExpansion = true;
    for(var system of systems){
        if(system in knownData && hasState('expansion', knownData[system]['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['pending_states'])) {
            wasNoPendingExpansion = false;
            break;
        }
    }

    var knownSystems = [];
    for (const [system, systemData] of Object.entries(knownData))
        knownSystems.push(system);
    
    for(var system of knownSystems) {
        if(!systems.includes(system)) {
            sendAlert(ALERT_LEVEL.CRITICAL, `${PRIMARY_FACTION} has retreated from the ${system} system.`);
            delete knownData[system];
            saveData();
        }
    }

    for(var system of systems){
        var systemContent = await doRequest(`https://elitebgs.app/api/ebgs/v5/systems?name=${system}&factionDetails=true`);
        var json = JSON.parse(systemContent);
        var systemData = convertSystemData(json.docs[0]);

        var systemType = getSystemType(systemData);
        if(systemType >= SYSTEM_TYPE.CONTROLLED) {
            await checkTrafficLevels(systemData);
            checkOutdated(system, systemData);
        }

        if(!(system in knownData)){
            if(!firstLoad)
                sendAlert(ALERT_LEVEL.ROUTINE, `${PRIMARY_FACTION} has expanded into the ${system} system.`);
            knownData[system] = cloneObj(systemData);
            saveData();
            knownData[system]['conflicts'] = {}; // force checking of invasion war
        }

        if(wasNoPendingExpansion && hasState('expansion', systemData['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['pending_states'])) {
            sendAlert(ALERT_LEVEL.ROUTINE, `${PRIMARY_FACTION} is entering expansion.`);
            wasNoPendingExpansion = false;
        }

        if(hasState('retreat', systemData['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['pending_states']) || 
            hasState('retreat', systemData['factions'][PRIMARY_FACTION]['faction_details']['faction_presence']['active_states'])) {
            sendAlert(ALERT_LEVEL.CRITICAL, `${PRIMARY_FACTION} is entering retreat in ${system}.`);
        }

        if(checkSystemChange(systemData)){
            checkInfluenceDrop(systemData);
            
            if(systemType >= SYSTEM_TYPE.CONTROLLED)
                checkInfluenceGapDrop(systemData);

            checkConflictChange(systemData);

            // updating data store for this system
            knownData[system] = cloneObj(systemData);
            saveData();
        }
    }
    
    if(firstLoad){
        sendActivationNotice();
    }

    console.log("EWS detection pass complete.");
}