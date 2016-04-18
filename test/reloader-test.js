var fs = require('fs');
var reloader = require('./../dist/node-reloader')(require);
var asserts = require('./asserts');
var assertEquals = asserts.assertEquals;
var assertTrue = asserts.assertTrue;

try {
    fs.mkdirSync('test/sub/tmp');
} catch (e) {
}
var dynamic1 = fs.readFileSync('test/sub/dynamic-1.js');
var dynamic2 = fs.readFileSync('test/sub/dynamic-2.js');
var dynamicError = fs.readFileSync('test/sub/dynamic-error.js.txt');
var dynamicError2 = fs.readFileSync('test/sub/dynamic-error2.js.txt');
var simple = 'module.exports = {};';

fs.writeFileSync('test/sub/tmp/dynamic.js', dynamic1);
var start = reloader('./sub/start');
fs.writeFileSync('test/sub/tmp/dynamic.js', simple); //clear timeouts
assertEquals(1, start.dynamic());
assertEquals("test", start.json.data);

function step1() {
    fs.writeFileSync('test/sub/tmp/dynamic.js', dynamicError);
    setTimeout(step2, 500);
}

function step2() {
    fs.writeFileSync('test/sub/tmp/dynamic.js', dynamicError2);
    setTimeout(step3, 500);
}
function step3() {
    fs.writeFileSync('test/sub/tmp/dynamic.js', dynamic2);
    setTimeout(step4, 500);
}
function step4() {
    assertTrue(start.dynamic() > 1000); //interval and timeout works
    fs.writeFileSync('test/sub/tmp/dynamic.js', simple); //stop intervals
    console.log('DONE');
}
setTimeout(step1, 500);


