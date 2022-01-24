require('dotenv').config();
var CronJob = require('cron').CronJob;

var blocker = require('./blocker.js');
var quoterBot = require('./quoterBot.js');
var galnet = require('./galnet.js');


var bgsLogger = require('./bgsLogger.js');
var tickDetector = require('./tickDetector.js');

const request = require('request');

var sayBlacklist = [
  '751603555886039070', '754980422814793759'
];

var gottem = [
  "https://media1.tenor.com/images/aeb5c1e1d94d758a10940a7526e98469/tenor.gif",
  "https://media1.tenor.com/images/090400df0703068e818e6ccf14573a6e/tenor.gif",
  "https://media1.tenor.com/images/7804870e93351de54bdaa667ed9b6931/tenor.gif",
  "https://media1.tenor.com/images/7709762d946ecf9dabd388b079dc2894/tenor.gif",
  "https://media1.tenor.com/images/fe4d5ba31a04ef87422b6537377f89a2/tenor.gif",
  "https://media1.tenor.com/images/0b6c3998bfd00fdf682bcd29ad27a0c4/tenor.gif",
  "https://media1.tenor.com/images/4797f32159e8c26b1f62b00f254ede1d/tenor.gif",
  "https://media1.tenor.com/images/82a9076fd2d9b1a574cb239750b1491e/tenor.gif",
  "https://media1.tenor.com/images/44b0ce9266cb067a3f6503783f34a466/tenor.gif",
  "https://media1.tenor.com/images/668812942bdb73ede0f0c1f42a6e51f3/tenor.gif",
  "https://media.tenor.com/images/24eb3ea5bd37be83f5f16b8ad62f75c8/tenor.gif"
];

var ym1 = [
  "u",
  "you",
  "ur",
  "your",
  "yer",
  "yo"
];

var ym2 = [
  "mom",
  "mum",
  "momma"
];

const Discord = require('discord.js');
const {Client, Intents} = require('discord.js');

const intents = new Intents([
    Intents.NON_PRIVILEGED, // include all non-privileged intents, would be better to specify which ones you actually need
    "GUILD_MEMBERS", // lets you request guild members (i.e. fixes the issue)
]);

const client = new Client({ ws: { intents } });

var allValidCharLazy = "(\\w| |-|\\.|_|')*?";

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setActivity({name: "with yo momma", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", type: "STREAMING"});

    quoterBot.initiateQuotes(client);
    galnet.initiateGalnetHook(Discord, client);
    tickDetector.initiate(Discord, client);
    // bgsLogger.aggregateData(Discord, client, () => {});
});

const canned = {
  "inara ltd link": "https://inara.cz/galaxy-commodity/144/",
  "inara ephemeris": "https://inara.cz/cmdr-fleetcarrier/240618/202720/",
  "inara carrier": "https://inara.cz/cmdr-fleetcarrier/240618/202720/"
}

function sendReport(channel){
  const titleEmbed = new Discord.MessageEmbed()
    .setColor('#00c3ff')
    .setTitle('<:freedom:739496082102288454><:freedom:739496082102288454><:freedom:739496082102288454>     DAILY BGS REPORT     <:freedom:739496082102288454><:freedom:739496082102288454><:freedom:739496082102288454>');
  channel.send(titleEmbed);
  // channel.send("<@332846508888031232> systemstatus get turing");
  // channel.send("<@332846508888031232> factionstatus get starlance alpha");
  channel.send("<@332846508888031232> bgsreport get");
  channel.send("<@332846508888031232> chart get factions influence starlance alpha");
}

// var job = new CronJob('0 0 16 * * *', function() {
//   var channel = client.channels.cache.get("736467872561496114");
//   sendReport(channel);
// }, null, true, 'Etc/UTC');

// job.start();

client.on('guildMemberAdd', member => {
  var msg = `Welcome to Starlance Alpha, <@${member.id}>! To get set up, please change your nickname to CMDR <cmdr name>, mark your interests in <#722013342318985268>, apply to the squadron ingame (our tag is SRLA), send a friend request to Starlance Central, and join <https://inara.cz/squadron/8014/> if you have an Inara account! <:o7:722149464021794947>`;
  member.guild.channels.cache.get('721872207239970869').send(msg);
});

client.on('message', msg => {
  var gMember = msg.channel.guild.member(msg.author);
  if(sayBlacklist.includes(msg.author.id) || (gMember != null && gMember.roles.cache.some(r => r.id == "806439101829873664"))){ // stfu role
    console.log("DELETING | " + msg.author.username + ": " + msg.content);
    msg.delete({timeout: 0});
    return;
  }
  // if(msg.channel.id == '736467872561496114'){ // #bgs-report
  //   bgsLogger.forwardTickDetect(Discord, client, msg);
  // }

  msgLower = msg.content.toLowerCase();

  if(msg.author.id == "327946633499246593"){ // neutro attachment
    var yes = msgLower.endsWith(".mp4");
    if(!yes){
      for(const [key, value] of msg.attachments.entries()){
        if(value.url.endsWith(".mp4")){
          yes = true;
          break;
        }
      }
    }

    if(yes){
      msg.react("🚨");
      msg.channel.send("⚠️ **RICK ROLL ALERT** ⚠️\n\nVideos from <@327946633499246593> are known to the State of California to have a high likelyhood of containing imagery relating to British singer, songwriter and radio personality \"Rick Astley\".\nIf you receive a video you suspect to contain such imagery, do not play it. Take shelter and immediately report the message to the authorities.\n\n⚠️ **RICK ROLL ALERT** ⚠️");
      return;
    }
  }

  if(msgLower === "inara ltd")
    handleCommodityMessage(msg, 144, "sellmax", "hi-sell");
  else if(msgLower === "inara void opals" || msgLower === "inara void opal" || msgLower === "inara vo")
    handleCommodityMessage(msg, 10250, "sellmax", "hi-sell");
  else if(msgLower === "inara tritium")
    handleCommodityMessage(msg, 10269, "buymin", "low-buy");
  else if(msgLower === "bgs report"){
    // msg.channel.send("<@332846508888031232> factionstatus get starlance alpha");
    sendReport(msg.channel);
  }
  else if(msgLower === "bgs report sys"){
    msg.channel.send("<@332846508888031232> systemstatus get turing");
  }
  else if(msgLower === "bgs report all"){
    sendReport(msg.channel);
  }
  else if(msgLower === "npc quote" || msgLower === "hello" || msgLower === "hello?" || msgLower === "hi" || msgLower === "hi?"){
    quoterBot.postQuoteToChannel(msg.channel);
  }
  //else if(msgLower.includes("fupper") && msg.author.id == '145377571175923712') { // redwood
  //  msg.channel.send('⚠️ **DISCLAIMER** ⚠️ <@145377571175923712> is a tiny dick cucklord and should not be trusted!')
  //}
  else if(msgLower.includes("bot ") && msg.author.id == '145377571175923712') { // redwood
    msg.channel.send("<@145377571175923712>'s ego is so fragile that he insults inanimate pieces of software. What a beta cuck pussy, I bet his wife's boyfriend doesn't even let him visit on weekends");
  }
  else if((msgLower.includes("damn") || msgLower.includes("wtf") || msgLower.includes("block")) && msg.author.id == '145377571175923712') { // redwood
    msg.channel.messages.fetch({limit: 2}).then(messageMappings => {
      let messages = Array.from(messageMappings.values());
      //let previousMessage = messages[1];
      if((messages.length > 0 && messages[0].author.id == '728427347451183164') || (messages.length > 1 && messages[1].author.id == '728427347451183164')){ // bot
        msg.channel.send("<@145377571175923712> well punk that's all you have to say? Get absolutely fucking owned you tiny peenlord");
      }
    });
  }
  else if(msgLower.includes("hey fupper") && msgLower.includes("when we going to colonia")){
    msg.channel.send({files: ['https://media1.tenor.com/images/6a2bce1ed140432737290514df1e24e9/tenor.gif']});
  }
  else if(msgLower.startsWith("bgslog")){
    bgsLogger.postLog(Discord, client, msg);
  }
  else if(msgLower.startsWith("bgstotal")){
    bgsLogger.aggregateData(Discord, client, msg.channel, () => {});
  }
  else if(msg.embeds.length > 0 && msg.embeds[0].title == 'back to the grind'){
    // const embed = new Discord.MessageEmbed()
    //     .setImage("https://media1.tenor.com/images/78fd2dae59ad2b1e744c57232e1b5b7b/tenor.gif?itemid=15496843");

    // msg.channel.send(embed);
    msg.channel.send({files: ['https://media1.tenor.com/images/78fd2dae59ad2b1e744c57232e1b5b7b/tenor.gif?itemid=15496843']});
  }
  else if(msgLower.startsWith("say ")){
    var toSay = msg.content.substr(4);
    if(!toSay.toLowerCase().startsWith("say "))
      client.channels.cache.get("721872207239970869").send(toSay);
  }
  else if(msgLower.startsWith("sendgif ")){
    var toSend = msg.content.substr(8);
    client.channels.cache.get("721872207239970869").send({files: [toSend]});
  }
  else if(msgLower.startsWith("bsay ")){
    console.log(msg.author.username + " using " + msgLower);
    msg.delete({timeout: 0});

    var str = msg.content.substr(5);
    blocker.sendBlockMessage(str, msg.channel);
    
  }
  else if(msgLower.startsWith("setrole ") && msg.author.id == "250850608246947851"){
    var arr = msg.content.split(" ");
    if(arr.length >= 4){
      runSetRoles(msg, arr);
    }
    else {
      msg.reply("Not enough arguments! setrole <channel> <msgid> <role>");
    }
  }
  else if(msgLower in canned){
    msg.reply(canned[msgLower]);
  }
  else if(msgLower.startsWith("inara commodityid ")){
    var split = msgLower.split(" ");
    if(split.length < 3)
      msg.reply("usage: inara commodityid <commodityID> <sellmax/buymin>");
    else {
      var id = -1;
      try {
        id = parseInt(split[2]);
      } catch (err) {
        msg.reply("commodity ID must be a number");
      }

      var type = "sellmax";
      if(split.length > 3)
        type = split[3];

      if(id >= 0){
        handleCommodityMessage(msg, id, type, type);
      }
    }
  }
  else if(msgLower.startsWith("inara c ")){
    if(msgLower.length <= 8)
      msg.reply("usage: inara c <commodity name> [lowest]");
    else {
      var name = msgLower.substring(8, msgLower.length);

      var type = "sellmax";
      if(msgLower.endsWith("low")){
        type = "buymin";
        name = name.substring(0, name.length - 4);
      }
      else if(msgLower.endsWith("buy")){
        type = "buy";
        name = name.substring(0, name.length - 4);
      }

      name = comShortToLong(name);

      getCommodityIdByName(name, (id => {
        handleCommodityMessage(msg, id, type, type);
      }), () => {
        msg.reply("unknown commodity \"" + name + "\"");
      });

      if(id >= 0){
        handleCommodityMessage(msg, id, split[3], type);
      }
    }
  }
  else if(msg.author.id != "728427347451183164" && (msgLower.includes("ur mum") || msgLower.includes("your mum") || msgLower.includes("yer mum") || msgLower.includes("ur mom") || msgLower.includes("your mom") || msgLower.includes("yer mom") || msgLower.includes("yo mom"))){
    var gifL = gottem[Math.floor(Math.random() * gottem.length)];
    msg.channel.send({files: [gifL]});
  }
  else if(msg.author.id != "728427347451183164" && (msgLower.match(/ is /g) || []).length == 1 && !msgLower.endsWith("?")){
    var ind = msgLower.indexOf(" is ") + 4;
    if (ind >= 0 && ind < msgLower.length){
      var str = msgLower.substring(ind);
      if((str.match(/ /g) || []).length < 5){
        var a = Math.random() * 100;
        if(a <= 10){
          var s1 = ym1[Math.floor(Math.random() * ym1.length)];
          var s2 = ym2[Math.floor(Math.random() * ym2.length)];
          msg.channel.send(s1 + " " + s2 + " is " + str);

          var gifL = gottem[Math.floor(Math.random() * gottem.length)];
          msg.channel.send({files: [gifL]});
        }
        else if(a <= 20){
          msg.react("785615213486669834");
        }
      }
    }
  }
});

async function runSetRoles(msg, arr){
  var users = new Set();
  var channel = client.channels.cache.get(arr[1]);
  
  var tMsg = await channel.messages.fetch(arr[2]);
  for(var reacc of tMsg.reactions.cache.array()){
    var c = await reacc.users.fetch();

    for(var u of c.array()){
      users.add(u);
    }
  }
  
  var roleName = arr[3].replace(/_/g, " ");
  var role = channel.guild.roles.cache.find(role => role.name === roleName);

  if(!role){
    msg.reply("Could not find role \"" + roleName + "\"");
    return;
  }
  
  var s = "";
  var count = 0;

  for(var user of users){
    var member = channel.guild.member(user);
    if(!member.roles.cache.some(r => r.id == role.id)){
      member.roles.add(role);
      s += (s == "" ? "" : ", ") + member.nickname;
      count += 1;
    }
  }

  msg.reply("Successfully added role " + role.name + " to " + count + " members, " + users.size + " total: " + s);
  return;
}

function comShortToLong(short){
  switch(short){
    case "ltd":
      return "low temperature diamond";
    case "vo":
      return "void opal";
    case "trit":
      return "tritium";
    default:
      return short;
  }
}

function handleCommodityMessage(msg, commodityID, desiredColumn, columnFancyName){
  retrieveHiSell(commodityID, desiredColumn, (commodityName, station, system, values) => {
    msg.reply("current " + commodityName + " " + columnFancyName + " is at " + station + " in " + system + ". Details: pad **" + values[0] + "** | star dist " + values[1] + " | demand " + values[3] + " | price **" + values[4] + " Cr**. Last updated " + values[6] + ".");
  }, () => {
    msg.reply("unable to retrieve data for " + commodityID + " column " + desiredColumn);
  });
}

function parseStationResult(content, result){
  var station = result.match(new RegExp(`(?<=<span class="normal avoidwrap">)${allValidCharLazy}(?=<\\/span>)`))[0];
  var system = result.match(new RegExp(`(?<=<span class="uppercase avoidwrap">)${allValidCharLazy}(?=<\\/span>)`))[0];

  var metadata = content.match(new RegExp(`(?<=<span class="normal avoidwrap">${station}<\\/span>)(.|\n)*?<\\/tr>`))[0];
  var dataRaw = metadata.match(/<td class=".*?">.*?<\/td>/g);

  var values = [];
  for(raw of dataRaw){
    var extracted = raw.match(/(?<=">).*?(?=<\/td>)/)[0];
    if(extracted.includes('lower than displayed')){
      extracted = extracted.match(/(?<=>).*?(?=<)/)[0];
    }
    else if(extracted.includes('span')){
      extracted = extracted.match(/.*?(?= <)/)[0];
    }
    values.push(extracted);
  }

  return [station, system, values];
}

function retrieveHiSell(commodityID, desiredColumn, callback, errback){
  request('https://inara.cz/ajaxaction.php?act=goodsdata&refname=' + desiredColumn + '&refid=' + commodityID + '&refid2=0', (err, res, content) => {
    try {
      if (err){
        console.log(err);
        errback();
        return;
      }

      var nameMatches = content.match(/(?<=<span lang="">).*?(?=<\/span>)/);
      // var nameMatches = content.match(/(?<=buy ).*(?= for)/);
      // if(nameMatches === null || nameMatches === undefined){
      //   nameMatches = content.match(/(?<=buy ).*(?= near)/);
      // }
      // if(nameMatches === null || nameMatches === undefined){
      //   nameMatches = content.match(/(?<=sell ).*(?= for)/);
      // }
      // if(nameMatches === null || nameMatches === undefined){
      //   nameMatches = content.match(/(?<=sell ).*(?= near)/);
      // }
      var commodityName = nameMatches[0];

      var pattern = new RegExp(`<span class="normal avoidwrap">${allValidCharLazy}<\\/span><span class="minor"> \\| <\\/span><span class="uppercase avoidwrap">${allValidCharLazy}<\\/span>`, 'g');
      var found = content.match(pattern);

      if(found.length > 0){
        var result = found[0];

        var [station, system, values] = parseStationResult(content, result);
        callback(commodityName, station, system, values);

        if(values[0] != "L"){
          for(var i = 0; i < found.length; i++){
            result = found[i];
            var [stationL, systemL, valuesL] = parseStationResult(content, result);
            if(valuesL[0] == "L"){
              callback(commodityName + " __large__", stationL, systemL, valuesL);
              break;
            }
          }
        }

        if(parseInt(values[3].replace(/,/g, '')) < 1000){
          for(var i = 0; i < found.length; i++){
            result = found[i];
            var [stationD, systemD, valuesD] = parseStationResult(content, result);
            if(parseInt(valuesD[3].replace(/,/g, '')) >= 1000){
              callback(commodityName + " with __1000+__ demand", stationD, systemD, valuesD);

              if(valuesD[0] != "L"){
                for(var i = 0; i < found.length; i++){
                  result = found[i];
                  var [stationL, systemL, valuesL] = parseStationResult(content, result);
                  if(valuesL[0] == "L" && parseInt(valuesL[3].replace(/,/g, '')) >= 1000){
                    callback(commodityName + " __large__ with __1000+__ demand", stationL, systemL, valuesL);
                    break;
                  }
                }
              }

              break;
            }
          }
        }
      }
    }
    catch (e) {
      errback(e);
      console.log(e.stack);
      console.log(e.message);
    }
  });
}

function normalizeCommodityName(str){
  str = str.replace(/( |-|\.|_)/g, '').toLowerCase();
  if(str.length > 0 && str[str.length-1] === 's')
    str = str.substring(0, str.length - 1);
  return str;
}

function getCommodityIdByName(commodityName, callback, errback){
  var name = normalizeCommodityName(commodityName);
  if(name.length == 0){
    errback();
    return;
  }

  request('https://inara.cz/galaxy-commodities/', (err, res, content) => {
    try {
      if (err){
        console.log(err);
        errback();
        return;
      }

      content = normalizeCommodityName(content);

      var pattern = new RegExp(`(?<=<optionvalue=")[0-9]*(?="><spanlang="">${name}s?<\\/span><\\/option>)`, 'g');
      var mtch = content.match(pattern);
      if(mtch){
        var commodityId = parseInt(mtch[0]);
        callback(commodityId);
      }
      else {
        errback();
      }
    }
    catch (e) {
      errback();
      console.log(e.stack);
      console.log(e.message);
    }
  });
}

client.login(process.env.DISCORD_TOKEN);
