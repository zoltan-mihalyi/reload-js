///<reference path="others.d.ts"/>
import fs = require('fs');
import path = require('path');
import ReloadableSource = require('./reloadable-source');

interface Require {
    (file:string):any;
    cache:any;
    resolve:any;
}

var sourceCache:{
    [index:string]:ReloadableSource
} = {};

function createRequire(origRequire:Require, relativeTo?:string) {
    var require = ((file) => {
        if (file[0] === '.') {
            if (relativeTo) {
                file = relativeTo + '/' + file;
            }
        } else {
            return origRequire(file);
        }
        var filePath = origRequire.resolve(file);
        if (sourceCache.hasOwnProperty(filePath)) {
            return sourceCache[filePath].getProxied();
        }

        var module = new ReloadableSource(createRequire(origRequire, path.dirname(filePath)), fs.readFileSync(filePath));

        watch(filePath, function (newContent) {
            try {
                module.update(newContent);
                console.log('FILE RELOADED: ' + filePath);
            } catch (e) {
                console.error('ERROR IN FILE: ' + e + '  ' + filePath);
            }
        });

        sourceCache[filePath] = module;
        var proxied = module.getProxied();
        require.cache[filePath] = proxied;
        return proxied;
    }) as Require;

    require.cache = origRequire.cache;
    require.resolve = origRequire.resolve;

    return require;
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

export = function (require:Require) {
    if (typeof require !== 'function') {
        throw new Error('First parameter should be the local require function!');
    }
    return createRequire(require);
};