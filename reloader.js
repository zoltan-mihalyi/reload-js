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
            var error;

            var intervalProxy = createProxy(setInterval, clearInterval);
            var timeoutProxy = createProxy(setTimeout, clearTimeout);

            function cleanup() {
                intervalProxy.cleanup();
                timeoutProxy.cleanup();
            }

            try {
                var fn = new Function('require,module,exports,setTimeout,clearTimeout,setInterval,clearInterval', content);
                fn(createRequire(require, path.dirname(filepath)), module, module.exports, timeoutProxy.start, timeoutProxy.stop, intervalProxy.start, intervalProxy.stop);
            } catch (e) {
                error = e;
            }
            return {
                error: error,
                object: module.exports,
                cleanup: cleanup
            };
        }


        var content = fs.readFileSync(filepath);
        var initial = load(content);
        if (initial.error) {
            require(filename); //this will throw the error;
            throw initial.error;
        }
        var reloadableModule = new ReloadableModule(initial.object, initial.cleanup);
        moduleCache[filepath] = reloadableModule;

        watch(filepath, function (newContent) {
            var newObject = load(newContent);
            if (newObject.error) {
                newObject.cleanup();
                console.error('ERROR IN FILE: ' + newObject.error + '  ' + filepath);
            } else {
                reloadableModule.update(newObject.object, newObject.cleanup);
                console.log('FILE RELOADED: ' + filepath);
            }
        });

        return newRequire.cache[filepath] = reloadableModule.getProxied();
    }

    newRequire.cache = require.cache;

    return newRequire;
}

var n = 1;

function createProxy(start, stop, removeAfterRun) {
    var running = [];

    function proxiedStart(callback) {
        var args = Array.prototype.slice.call(arguments);
        if (removeAfterRun) {
            args[0] = function () {
                running.splice(running.indexOf(id), 1);
                return callback.apply(this, arguments);
            };
        }


        var id = start.apply(this, args);
        n++;
        running.push(id);
        return id;
    }

    function proxiedStop(id) {
        var index = running.indexOf(id);
        if (index !== -1) {
            running.splice(index, 1);
        }
        stop(id);
    }

    function cleanup() {
        for (var i = 0; i < running.length; i++) {
            var id = running[i];
            stop(id);
        }
    }

    return {
        start: proxiedStart,
        stop: proxiedStop,
        cleanup: cleanup
    };

}


function watch(filename, callback) {
    console.log('WATCHING: ' + filename);
    fs.watchFile(filename, {
        persistent: false,
        interval: 200
    }, function () {
        callback(fs.readFileSync(filename));
    });
}

module.exports = function (require, filepath) {
    return createRequire(require, path.dirname(require.main.filename))(filepath);
};