var emoji = require('node-emoji');

var bSayMap = {
    "0": "zero",
    "1": "one",
    "2": "two",
    "3": "three",
    "4": "four",
    "5": "five",
    "6": "six",
    "7": "seven",
    "8": "eight",
    "9": "nine",
    " ": "black_medium_square",
    "?": "grey_question",
    "!": "grey_exclamation"
}

var space = " ";//"\u200B";

exports.sendBlockMessage = function(str, channel) {

    var toSay = "";
    var max = 1500;
    var tryStop = false;

    for(var i = 0;  i < str.length; i++){
      var cU = str.charAt(i) + "";
      var c = cU.toLowerCase();

      var isEmoji = true;
      var toAdd = "";

      if(toSay.length >= max){
        tryStop = true;
      }

      if(cU !== '\n' && !(cU == ' ' && tryStop)){
        var emojiName;
        if(c in bSayMap){
          emojiName = bSayMap[c];
        }
        else if(c.charCodeAt() >= "a".charCodeAt() && c.charCodeAt() <= "z".charCodeAt()){
          emojiName = "regional_indicator_" + c;
        }
        else {
          toAdd = cU;
          isEmoji = false;
        }
        
        if(isEmoji){
          toAdd = `:${emojiName}:` + space;
        }
      }

      if((toSay.length + toAdd.length) > 2000 || cU == '\n' || (cU == ' ' && tryStop)){
        if(toSay.length > 0){
          channel.send(emoji.emojify(toSay));
        }
        toSay = toAdd;
        max = Math.floor(Math.random() * Math.floor(1850)) + 100;
        tryStop = false;
      }
      else {
        toSay += toAdd;
      }
    }

    if(toSay.length > 0){
      channel.send(emoji.emojify(toSay));
    }

}