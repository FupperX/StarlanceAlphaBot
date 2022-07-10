var channelID = "800932163318317076";//"722146937649889470";
var guildID = "721872207239970866";

var systemLinks = {
  'Turing': 'https://inara.cz/galaxy-starsystem/4959/',
  'Malali': 'https://inara.cz/galaxy-starsystem/5730/',
  'Lundji': 'https://inara.cz/galaxy-starsystem/5686/',
  'Janjiwa': 'https://inara.cz/galaxy-starsystem/5706/',
  'Chodhna': 'https://inara.cz/galaxy-starsystem/5732/',
  'Birangana': 'https://inara.cz/galaxy-starsystem/5735/',
  'Arundji': 'https://inara.cz/galaxy-starsystem/5861/'
};

var factionLinks = {
  'Starlance Alpha': 'https://inara.cz/galaxy-minorfaction/78297/'
};

var factionLookup = {
  'sa': 'Starlance Alpha',
  'srla': 'Starlance Alpha',
  'jup': 'Janjiwa Union Party',
  'unje': 'Union of Jath for Equality',
  'mfmi': 'Mould Federal Mining Incorporated',
  'bic': 'Beyond Infinity Corporation',
  'dci': 'Dedalo Corp. Interstellar',
  'lofk': 'Leaders of Kumbaya',
  'bspm': 'Bluestar PMC'
};

// Note: 25 choices max for slash command options
var types = {
  'bounty': 'Bounty',
  // 'bounties': 'Bounty',
  'b': 'Bounty',

  'combatbond': 'Combat Bond',
  // 'combatbonds': 'Combat Bond',
  // 'bond': 'Combat Bond',
  // 'bonds': 'Combat Bond',
  'cb': 'Combat Bond',
  
  // 'explo': 'Exploration Data',
  // 'exploration': 'Exploration Data',
  'explorationdata': 'Exploration Data',
  // 'explodata': 'Exploration Data',
  'data': 'Exploration Data',
  'e': 'Exploration Data',
  'd': 'Exploration Data',

  'exobiology': 'Exobiology Data',
  //'exo': 'Exobiology Data',

  'conflictzonehigh': 'Conflict Zone (High)',
  // 'zonehigh': 'Conflict Zone (High)',
  'czh': 'Conflict Zone (High)',
  'gczh': 'Ground Conflict Zone (High)',
  
  'conflictzonemedium': 'Conflict Zone (Medium)',
  // 'zonemedium': 'Conflict Zone (Medium)',
  'czm': 'Conflict Zone (Medium)',
  'gczm': 'Ground Conflict Zone (Medium)',

  'conflictzonelow': 'Conflict Zone (Low)',
  // 'zonelow': 'Conflict Zone (Low)',
  'czl': 'Conflict Zone (Low)',
  'gczl': 'Ground Conflict Zone (Low)',

  'installationdefense': 'Installation Defense',
  // 'installation': 'Installation Defense',
  'id': 'Installation Defense',

  'tradeprofit': 'Trade Profit',
  // 'trade': 'Trade Profit',
  // 't': 'Trade Profit',
  'tp': 'Trade Profit',
  
  'tradeloss': 'Trade Loss',
  'tl': 'Trade Loss',
  
  'murder': 'Murder',
  'groundmurder': 'Ground Murder',
  //'gmurder': 'Ground Murder',
  // 'mu': 'Murder',

  'smuggling': 'Smuggling',
  // 's': 'Smuggling',

  // 'mission': 'Mission INF+',
  // 'missions': 'Mission INF+',
  // 'mi': 'Mission INF+',
  'inf': 'Mission INF+',
  // 'inf+': 'Mission INF+',
  'i': 'Mission INF+'
};

var typeColors = {
  'Bounty': '#f02c05',
  'Combat Bond': '#f00505',
  'Conflict Zone (High)': '#c70000',
  'Conflict Zone (Medium)': '#c70000',
  'Conflict Zone (Low)': '#c70000',
  'Ground Conflict Zone (High)': '#c70000',
  'Ground Conflict Zone (Medium)': '#c70000',
  'Ground Conflict Zone (Low)': '#c70000',
  'Installation Defense': '#c70000',
  'Exploration Data': '#05c5f0',
  'Exobiology Data': '#05c5f0',
  'Trade Profit': '#11f005',
  'Trade Loss': '#f08605',
  'Murder': '#8A0303',
  'Ground Murder': '#8A0303',
  'Smuggling': '#f0057e',
  'Mission INF+': '#f0e805'
}

exports.validTypes = types;

var chartColors = ['5, 197, 240', '5, 240, 177', '240, 134, 5'];

// var validTypeStr = 'Valid types are bounty (b), combatbond (cb), mission (inf, i), explorationdata (e, data, d), conflictzonehigh (czh), czm, czl, installationdefense (installation, id), tradeprofit (tp), tradeloss (tl), murder (mu), smuggling (s).';
var validTypeStr = 'Valid types are bounty (b), combatbond (cb), inf (i), explorationdata (e, data, d), exobiology, conflictzonehigh (czh), czm, czl, gczh, gczm, gczl, installationdefense (id), tradeprofit (tp), tradeloss (tl), murder, groundmurder, smuggling.';

function isNumeric(str) {
  if (typeof str != "string") return false // we only process strings!  
  return !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
         !isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

var nonCapTitle = ['A', 'AN', 'THE', 'FOR', 'AND', 'NOR', 'BUT', 'OR', 'YET', 'SO', 'AT', 'TO', 'BY', 'AS', 'FROM', 'IF', 'IN', 'OF', 'ON', 'WITH'];

function capitalize(str) {
  var arr = str.split(" ");
  for(var i = 0; i < arr.length; i++) {
    if(arr[i].length > 0){
      var l = arr[i].toUpperCase();
      if(l == "HIP" || l == "SPOCS"){
        arr[i] = l;
      }
      else if(i > 0 && i < arr.length-1 && nonCapTitle.includes(l)){
        arr[i] = arr[i].toLowerCase();
      }
      else {
        arr[i] = arr[i].substring(0, 1).toUpperCase() + arr[i].substring(1).toLowerCase();
      }
    }
  }
  return arr.join(" ");
}

function numericize(str){

  var multi = 1;
  str = str.replace(/_/g, '').replace(/,/g, '').toLowerCase();
  
  if(str.endsWith("k")){
    str = str.slice(0, -1);
    multi = 1000;
  }
  else if(str.endsWith("m")){
    str = str.slice(0, -1);
    multi = 1000000;
  }
  else if(str.endsWith("mil")){
    str = str.slice(0, -3);
    multi = 1000000;
  }

  if(!isNumeric(str)){
    return -1;
  }
  
  try {
    var val = Math.round(parseFloat(str) * multi);
    return val.toLocaleString();
  }
  catch (err) {
    return -1;
  }

}

exports.postLogMsg = async function(Discord, client, msg) {
  var guild = client.guilds.cache.get(guildID);
  var gMember = await guild.members.fetch(msg.author);
  var user = gMember.displayName;

  var content = msg.content.split(' ');

  if(content.length < 5){
    msg.reply("invalid syntax. bgslog usage: `bgslog <faction> <system> <type> <value> [location] [user]`. \nExample: `bgslog Starlance_Alpha Turing bounty 10,000,000`\n\u200b\n" + validTypeStr);
    return;
  }

  content = content.slice(1);

  var type = content[2].replace(/_/g, '').toLowerCase();
  if(type in types){
    type = types[type];
  }
  else {
    msg.reply('unknown type `' + type + '`. ' + validTypeStr);
    return;
  }

  var location = undefined;
  if(content.length >= 5){
    location = content[4].replace(/_/g, '');
  }

  this.postLog(Discord, client, msg, user, content[0], content[1], type, content[3], location);
}

exports.parseFaction = function(faction) {
  var faction = faction.replace(/_/g, ' ');
  if(faction.toLowerCase() in factionLookup){
    faction = factionLookup[faction.toLowerCase()];
  }
  else {
    faction = capitalize(faction);
  }
  return faction;
}

exports.parseSystem = function(system){
  return capitalize(system.replace(/_/g, ' '));
}

exports.postLog = async function(Discord, client, interaction, user, faction, system, type, value, location) {

    var faction = this.parseFaction(faction);
    var system = this.parseSystem(system);
    
    var valueStr = value;

    // if(!type.startsWith('Conflict Zone') && type != 'Murder'){
    value = numericize(valueStr);
    if(value < 0){
      interaction.reply({content: 'Invalid numerical value `' + valueStr + '`. Valid examples: `10,000,000`, `10000000`, `10m`, `10mil`, `10k`'});
      return;
    }
    // }

    var color = typeColors[type];

    var systemText = system;
    // if(system in systemLinks){
    //   systemText = `[${system}](${systemLinks[system]})`;
    // }

    var factionText = faction;
    // if(faction in factionLinks){
    //   factionText = `[${faction}](${factionLinks[faction]})`;
    // }

    var fields = [
      { name: 'FACTION', value: factionText, inline: true },
      { name: '\u200B', value: '\u200B', inline: true },
      { name: 'SYSTEM', value: systemText, inline: true },
      
      { name: 'TYPE', value: type, inline: true },
      { name: '\u200B', value: '\u200B', inline: true },
      { name: 'VALUE', value: value, inline: true }
    ];

    if(location != undefined) {
      fields.push({ name: 'LOCATION', value: capitalize(location), inline: true });
    }

    const embed = new Discord.MessageEmbed()
        // .setColor("#f07b05")
        .setColor(color)
        .setDescription("**BGS CONTRIBUTION**")
        .setThumbnail("https://i.imgur.com/WVTPNml.png")
        .addFields(fields)
        .setTimestamp()
        .setFooter({ text: user });

    var channel = client.channels.cache.get(channelID);
    channel.send({embeds: [embed]});

    interaction.reply({content: "BGS contribution logged!"});
}

exports.forwardTickDetect = function(Discord, client, msg) {
  if(msg.author.username == 'BGSBot' && msg.embeds.length > 0){
    console.log(msg.embeds[0]);
  }

  if(msg.author.username == 'BGSBot' && msg.embeds.length > 0 && msg.embeds[0].title == "Tick Detected") {
    console.log("tick");
    var tickTime = msg.embeds[0].fields[0].value;

    const embed = new Discord.MessageEmbed()
        .setColor("#FFFFFF")
        .setTitle("TICK DETECTED")
        .addFields(
          { name: 'Latest Tick At', value: tickTime }
        )
        .setTimestamp();

    var channel = client.channels.cache.get(channelID);
    channel.send({embeds: [embed]});
  }
}

exports.handleTick = function(Discord, client, tickTime, timeFormatted) {
  var channel = client.channels.cache.get(channelID);
  this.aggregateData(Discord, client, channel, () => sendTickMsg(Discord, client, tickTime, timeFormatted));
};

function sendTickMsg(Discord, client, tickTime, timeFormatted) {

  const embed = new Discord.MessageEmbed()
      .setColor("#FFFFFF")
      .setTitle("TICK DETECTED")
      .addFields(
        { name: 'Latest Tick At', value: timeFormatted }
      )
      .setTimestamp(tickTime);

  var channel = client.channels.cache.get(channelID);
  channel.send({embeds: [embed]});
};

function sortObject(obj) {
  return Object.keys(obj).sort().reduce(function (result, key) {
      result[key] = obj[key];
      return result;
  }, {});
}

exports.aggregateData = function(Discord, client, postChannel, readDoneCB) {
  var channel = client.channels.cache.get(channelID);

  var data = {};
  var totals = {};
  var cmdrs = new Set();

  var locations = new Set();

  var multiTotals = {};
  var daysToCollect = 3;

  channel.messages.fetch({limit: 100}).then(messages => {
    var day = 0;
    var datasetLabels = ['Current Tick'];

    for(var entry of messages.entries()){
      var msg = entry[1];

      if(msg.embeds.length > 0) {
        if(msg.embeds[0].title){
          if(msg.embeds[0].title == "TICK DETECTED"){
            if(day >= daysToCollect - 1){
              break;
            }

            day++;
            var time = msg.embeds[0].fields[0].value;
            var date = time.substring(time.indexOf('-') + 2);
            datasetLabels.push(date);
          }
        }
        else {
          var fields = msg.embeds[0].fields;
        
          var faction = capitalize(fields[0].value);
          var system = capitalize(fields[2].value);
          var type = fields[3].value;
          var value = parseInt(fields[5].value.replace(/,/g, ''));

          if(fields.length >= 7) {
            var location = fields[6].value;
            locations.add(location);
          }

          if(day == 0){

            var cmdr = msg.embeds[0].footer.text;
            cmdrs.add(cmdr);

            if(!(system in data)){
              data[system] = {};
            }

            if(!(faction in data[system])){
              data[system][faction] = {};
            }

            if(!(type in data[system][faction])){
              data[system][faction][type] = 0;
            }

            if(!(type in totals)){
              totals[type] = 0;
            }

            data[system][faction][type] += value;
            totals[type] += value;

          }

          if(!(type in multiTotals)){
            multiTotals[type] = {};
          }
          if(!(day in multiTotals[type])){
            multiTotals[type][day] = 0;
          }
          multiTotals[type][day] += value;
        }
      }
    }

    var fields = [];

    totals = sortObject(totals);

    for(var system in data){

      var factionField = "";
      var typeField = "";
      var valueField = "";

      for(var faction in data[system]){
        for(var type in data[system][faction]){
          factionField += faction + "\n";
          typeField += type + "\n";
          valueField += data[system][faction][type].toLocaleString() + "\n";
        }
      }

      var header = '\u200B\n';

      fields.push({ name: header + system.toUpperCase(), value: factionField, inline: true });
      fields.push({ name: header + '\u200B', value: typeField, inline: true });
      fields.push({ name: header + '\u200B', value: valueField, inline: true });
    }

    if(fields.length == 0){
      fields.push({ name: '\u200B', value: 'No contributions this tick so far' });
    }
    else {
      var totalField = "";
      var totalValField = "";
      for(var type in totals){
        totalField += type + "\n";
        totalValField += totals[type].toLocaleString() + "\n";
      }
      totalField += '\u200B';
      fields.push({ name: '\u200B\nTOTAL', value: totalField, inline: true });
      fields.push({ name: '\u200B\n\u200B', value: totalValField, inline: true });
    }

    if(locations.size > 0){
      var locField = "";
      for(var loc in locations) {
        locField += loc + "\n";
      }
      fields.push({ name: '\u200B\nLOCATIONS', value: locField, inline: true });
    }

    var chartLabels = [];
    var chartDatasets = [];
    var chartDatasetMaps = {};

    for(var d = 0; d < daysToCollect && d <= day; d++){
      chartDatasetMaps[d] = [];
    }

    multiTotals = sortObject(multiTotals);

    for(var type in multiTotals){
      chartLabels.push(type);

      for(var d = 0; d < daysToCollect && d <= day; d++){
        var total = d in multiTotals[type] ? multiTotals[type][d] : 0;
      
        var divider = 1;
        if(type == 'Trade Loss'){
          divider = 10000000;
        }
        else if(!type.startsWith("Conflict Zone") && type != 'Murder' && type != 'Mission INF+'){
          divider = 1000000;
        }
      
        chartDatasetMaps[d].push(total / divider);
      }
    }

    for(var d = Math.min(daysToCollect, day+1) - 1; d >= 0; d--){
    // for(var d = 0; d < Math.min(daysToCollect, day+1); d++){
      chartDatasets.push({
        label: datasetLabels[d],
        data: chartDatasetMaps[d],
        backgroundColor: 'rgba(' + chartColors[d] + ', 0.5)',
        borderColor: 'rgba(' + chartColors[d] + ', 1)',
        borderWidth: 2
      });
    }

    readDoneCB();

    var gridLineColor = '#616161';
    var textColor = 'white';

    var chart = {
      type: 'bar',
      data: {
        labels: chartLabels,
        datasets: chartDatasets
      },
      options: {
        legend: {
            labels: {
                // This more specific font property overrides the global property
                fontColor: textColor
            }
        },
        scales: {
          yAxes: [{
            gridLines: {
              color: gridLineColor
            },
            ticks: {
              fontColor: textColor
            },
          }],
          xAxes: [{
            gridLines: {
              color: gridLineColor
            },
            ticks: {
              fontColor: textColor
            },
          }]
        } 
      }
    };

    var encodedChart = encodeURIComponent(JSON.stringify(chart));

    const embed = new Discord.MessageEmbed()
        .setColor("#05c5f0")
        .setTitle("TICK CONTRIBUTION SUMMARY")
        .setThumbnail("https://i.imgur.com/WVTPNml.png")
        .setImage(`https://quickchart.io/chart?c=${encodedChart}`)
        .addFields(
          fields
        )
        .setFooter({ text: `${cmdrs.size} commanders contributed` })
        .setTimestamp();

    postChannel.send({embeds: [embed]});

  }).catch(err => console.log(err));
}