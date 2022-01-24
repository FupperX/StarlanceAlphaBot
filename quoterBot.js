var fs = require('fs');
var blocker = require('./blocker.js');

var guildID = "721872207239970866";
var channelID = "721872207239970869";//"722146937649889470";
var minInterval = 240;
var maxInterval = 1200;

var lines = [];
var client;

// var usernames = [];
var memberIds = [];

exports.initiateQuotes = function(_client) {

  client = _client;

  loadUsers();
}

exports.postQuoteToChannel = postQuoteToChannel;

function loadQuotes(){
  fs.readFile('./quotesList.txt', function (err, data) {
    if (err) {
      throw err;
    }

    lines = data.toString().split(/\r?\n/);
    console.log("Loaded " + lines.length + " NPC quotes.");
    postQuote();
  });
}

function loadUsers(){
  var usernames = [];
  client.guilds.cache.get(guildID).members.fetch().then(members => {
    members.forEach(member => {
      // var name = member.nickname !== null ? member.nickname : member.user.username;
      // if(name && name.startsWith("CMDR ")){
      //   usernames.push(name);
      // }

      if(member.id){
        memberIds.push(member.id);
      }
    });

    // var s = "";
    // var i = 0;
    // for(var name of usernames){
    //   if(i > 0 && i % 20 == 0){
    //     s += "\n";
    //   }
    //   else if(i > 0){
    //     s += "|";
    //   }
    //   s += name;
    //   i++;
    // }
    // console.log(s);
    // console.log(usernames.length);

    loadQuotes();
  });
}

function postQuote(){
  var channel = client.channels.cache.get(channelID);
  postQuoteToChannel(channel);

  var mins = Math.random() * (maxInterval - minInterval) + minInterval;

  setTimeout(() => {
    postQuote();
  }, mins * 60 * 1000);
}

function postQuoteToChannel(channel) {
  var line = lines[Math.floor(Math.random() * lines.length)];

  while(line.length == 0) {
    line = lines[Math.floor(Math.random() * lines.length)];
  }

  if(line.includes("<cmdr_name>")){
    var id = memberIds[Math.floor(Math.random() * memberIds.length)];
    var user = "<@" + id + ">"; //usernames[Math.floor(Math.random() * usernames.length)];
    line = line.replace(/<cmdr_name>/g, user);
  }

  if(Math.random() < 0.25 && !line.toLowerCase().startsWith("http") && !line.startsWith("<")){
    blocker.sendBlockMessage(line, channel);
  }
  else {
    channel.send(line);
  }
}
