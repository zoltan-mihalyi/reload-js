var fs = require('fs');
var reloader = require('./../reloader');
var asserts = require('./asserts');
var assertEquals = asserts.assertEquals;

var dynamic1 = fs.readFileSync('test/sub/dynamic-1.js');
var dynamic2 = fs.readFileSync('test/sub/dynamic-2.js');
var dynamicError = fs.readFileSync('test/sub/dynamic-error.js.txt');
var dynamicError2 = fs.readFileSync('test/sub/dynamic-error2.js.txt');

fs.writeFileSync('test/sub/tmp/dynamic.js', dynamic1);
var start = reloader(require, './sub/start');
assertEquals(1, start());
fs.writeFileSync('test/sub/tmp/dynamic.js', dynamicError);

setTimeout(function () {
    fs.writeFileSync('test/sub/tmp/dynamic.js', dynamicError2);

    setTimeout(function () {
        fs.writeFileSync('test/sub/tmp/dynamic.js', dynamic2);

        setTimeout(function () {
            assertEquals(2, start());
            console.log('DONE');
        }, 500);
    }, 500);
}, 500);


