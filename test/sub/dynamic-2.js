var val;
setTimeout(function () {
    val = 1000;
}, 10);
setInterval(function () {
    val++;
}, 15);

module.exports = function () {
    return val;
};