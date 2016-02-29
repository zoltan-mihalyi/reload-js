var fs = require('fs');
var path = require('path');
var ReloadableModule = require('./reloadable-module');

var moduleCache = {};

function createRequire(require, relativeTo) {

    function newRequire(filename) {
        var filepath = path.resolve(relativeTo, filename) + '.js';
        if (newRequire.cache.hasOwnProperty(filepath)) {
            return newRequire.cache[filepath];
        }
        if (filename.indexOf('.') !== 0) {
            return require(filename);
        }

        function load(content) {
            var module = {
                exports: {}
            };
            try {
                var fn = new Function('require,module,exports', content);
            } catch (e) {
                console.error(e + ' in file: ' + filepath);
                return;
            }
            fn(createRequire(require, path.dirname(filepath)), module, module.exports);
            return module.exports;
        }


        var content = fs.readFileSync(filepath);
        var reloadableModule = new ReloadableModule(load(content));
        moduleCache[filepath] = reloadableModule;

        watch(filepath, function (newContent) {
            reloadableModule.update(load(newContent));
        });

        return newRequire.cache[filepath] = reloadableModule.getProxied();
    }

    newRequire.cache = require.cache;

    return newRequire;
}


function watch(filename, callback) {
    console.log('WATCHING: ' + filename);
    fs.watchFile(filename, {
        persistent: false,
        interval: 200
    }, function () {
        callback(fs.readFileSync(filename));
        console.log('FILE RELOADED: ' + filename);
    });
}

module.exports = function (require, filepath) {
    return createRequire(require, path.dirname(require.main.filename))(filepath);
};