import ReloadableModule = require("./reloadable-module");
import AbstractReloadableSource = require("./abstract-reloadable-source");

class ReloadableSource extends AbstractReloadableSource{
    private _cleanup;

    constructor(private _evaluate:(m:any, s:string) => any, source:string) {
        super(source);
    }

    protected evaluate(source) {
        var result;
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
            result = this._evaluate({
                setTimeout: timeoutProxy.start,
                clearTimeout: timeoutProxy.stop,
                setInterval: intervalProxy.start,
                clearInterval: intervalProxy.stop
            }, source);
        } catch (e) {
            cleanup();
            throw e;
        }
        return result;
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