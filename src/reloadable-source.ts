import ReloadableModule = require("./reloadable-module");

class ReloadableSource {
    private _module:ReloadableModule;
    private _cleanup;

    constructor(private _require, source:string) {
        this.update(source);
    }

    update(source) {
        var module = {
            exports: {}
        };

        var intervalProxy = createProxy(setInterval, clearInterval, false);
        var timeoutProxy = createProxy(setTimeout, clearTimeout, true);

        function cleanup() {
            intervalProxy.cleanup();
            timeoutProxy.cleanup();
        }

        if (this._cleanup) {
            this._cleanup();
        }
        this._cleanup = cleanup;
        try {
            var fn = new Function('require,module,exports,setTimeout,clearTimeout,setInterval,clearInterval', source);
            var result = fn(this._require, module, module.exports, timeoutProxy.start, timeoutProxy.stop, intervalProxy.start, intervalProxy.stop);
            if (typeof result !== 'undefined') {
                module.exports = result;
            }
        } catch (e) {
            cleanup();
            throw e;
        }

        if (this._module) {
            this._module.update(module.exports);
        } else {
            this._module = new ReloadableModule(module.exports);
        }
    }

    getModule() {
        return this._module;
    }

    getProxied() {
        return this._module.getProxied();
    }
}


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

export = ReloadableSource;