const RssFeedEmitter = require('rss-feed-emitter')
const DomParser = require('dom-parser')
const request = require('request');

const feeder = new RssFeedEmitter( { skipFirstLoad: true } )
const parser = new DomParser()

var guildID = "721872207239970866";
var channelID = "795120826998587423";

var client;

function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

async function findImage(title, callback){
    
    var noSpecial = title.replace(/[^A-Za-z0-9- ]/g, '');
    // console.log(noSpecial);

    var sanitized = "";
    for(var part of noSpecial.split(" ")){
        if(part.length > 0){
            if(part[0] == part[0].toUpperCase() && !(sanitized.length == 0 && (part == "A" || part == "Of" || part == "The"))){
                if(sanitized.length > 0)
                    sanitized += "-";
                sanitized += part.toLowerCase();
            }
        }
    }

    var url = "https://www.elitedangerous.com/news/galnet/" + sanitized;

    request(url, (err, res, content) => {
        try {
            if (err){
                console.log(err);
                callback(null);
                return;
            }
            
            var allValidChar = "[A-Za-z:\\/\\.\\-\\_]*";
            var pattern = new RegExp(`(?<=<img alt="${escapeRegExp(title)}" src=")${allValidChar}(?=" data-v)`, 'g');
            var match = content.match(pattern);
            if(match){
                callback(match[0]);
            }
            else {
                callback(null);
            }
        }
        catch (e) {
            console.log(e.stack);
            console.log(e.message);
            callback(null);
        }
    });
}

exports.initiateGalnetHook = function(discord, _client) {

    client = _client;

    feeder.add({
        url: "https://community.elitedangerous.com/en/galnet-rss",
        eventName: "galnet"
    });

    feeder.on('error', console.error);

    feeder.on("galnet", (item) => {
        //   let dom = parser.parseFromString(item.description);
        let body = item.description.replace(/\<br \/>/g, "\n");
        let title = item.title;
        let link = "https://community.elitedangerous.com/galnet/uid/" + item.guid;
        let date = item.date.setYear(item.date.getFullYear() + 1286);

        findImage(title, (imageURL) => {

            var embed = new discord.MessageEmbed()
                .setColor("#f07b05")
                .setTitle(title)
                .setDescription(body)
                .setURL(link)
                .setTimestamp(date);
            
            if(imageURL != null) {
                embed = embed.setImage(imageURL);
            }

            var channel = client.channels.cache.get(channelID);
            channel.send(embed);

        });

    });

}
