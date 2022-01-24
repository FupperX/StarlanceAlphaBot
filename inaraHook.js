const request = require('request');
var querystring = require('querystring');

exports.findSystemURL = function(systemName, callback) {

    var form = {
        "formact": "SEARCH_GALAXY_STAR",
        "searchgalaxy": systemName
    };
    
    var formData = querystring.stringify(form);
    var contentLength = formData.length;

    var requestInfo = {
        headers: {
            'Content-Length': contentLength,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        uri: 'https://inara.cz/galaxy-starsystems/',
        body: formData,
        method: 'POST'
    };

    request(requestInfo, (err, res, content) => {
        try {
            var id = content.match(/(?<=gallery-starsystem\/)[0-9]*(?=\/)/g)[0];
            callback(id);
        }
        catch (e) {
            console.log(e.stack);
            console.log(e.message);
            callback(null);
        }
    });

}