function createFunctionProxy(module, path) {
    function proxy() {
        return module._paths[path].apply(this, arguments);
    }

    return proxy;
}

function ReloadableModule(initial) {
    this._paths = {};
    this.update(initial);
}

ReloadableModule.prototype.update = function (newObject) {
    var self = this;
    var added = [];
    var proxies = [];

    function createProxy(obj, target, path) {
        var i;

        var index = added.indexOf(obj);
        if (index !== -1) {
            return proxies[index]; //todo shortest path to _paths
        }
        console.log(path, obj);
        self._paths[path] = obj;
        if (!target) {
            if (typeof obj === 'function') {
                target = createFunctionProxy(self, path);
            } else if (isObject(obj)) {
                target = {};
            }
        } else if (obj) { //nem létező propertyk pucolása
            for (i in target) {
                if (target.hasOwnProperty(i) && !obj.hasOwnProperty(i)) {
                    delete target[i];
                }
            }
        }

        added.push(obj);
        proxies.push(target);

        if (isObject(target) || isFunction(target)) {
            for (i in obj) {
                if (obj.hasOwnProperty(i)) {
                    target[i] = createProxy(obj[i], target[i], path + '.' + i);
                }
            }
        }
        if (isFunction(target)) {
            if (isFunction(obj)) {
                createProxy(obj.prototype, target.prototype, path + '.prototype');
            }
        }
        if (isObject(target)) {
            if (isObject(obj)) {
                target.__proto__ = obj;
            }
        }
        return target;
    }

    this._proxied = createProxy(newObject, this._proxied, '');
};

ReloadableModule.prototype.getProxied = function () {
    return this._proxied;
};

function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}
function isFunction(obj) {
    return typeof obj === 'function';
}


module.exports = ReloadableModule;