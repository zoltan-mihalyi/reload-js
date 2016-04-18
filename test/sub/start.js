var fs = require('fs');
var dynamic = require('./tmp/dynamic');
var json = require('./json.json');
fs.stat('./start.js', function() {
}); //just use an external module


module.exports = {
    dynamic: dynamic,
    json: json
};