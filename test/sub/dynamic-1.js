setTimeout(function () {
    throw new Error('Timeout not cleared after reloading a module!');
}, 1000);

setInterval(function () {
    throw new Error('Interval not cleared after reloading a module!');
}, 1000);

module.exports = function () {
    return 1;
};