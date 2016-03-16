function ReloadableModule(initial, cleanup) {
    this._objProxies = {};
    this._fnProxies = {};
    this._currentByPath = {};
    this._currentProxy = null;
    this.update(initial, cleanup);
}

ReloadableModule.prototype.getProxied = function () {
    return this._currentProxy;
};

ReloadableModule.prototype.update = function (newObject, cleanup) {
    if (this.cleanup) {
        this.cleanup();
    }
    this.cleanup = cleanup;

    this._currentProxy = new Context(this).createProxy(newObject);
};

function Context(module, added, proxies, path) {
    this.module = module;
    this.added = added || [];
    this.proxies = proxies || [];
    this.path = path || '';
}

Context.prototype.and = function (newObject, proxy, prop) {
    return new Context(this.module, concat(this.added, newObject), concat(this.added, proxy), this.path + '.' + prop);
};

Context.prototype.getProxy = function (newObject) {
    var index = this.added.indexOf(newObject);
    if (index !== -1) {
        return this.proxies[index];
    }
    return null;
};

Context.prototype.createProxy = function (newObject) {
    var proxy = this.getProxy(newObject);
    if (proxy) {
        return proxy;
    }
    if (isObject(newObject)) {
        return this.createObjectProxy(newObject);
    } else if (isFunction(newObject)) {
        return this.createFunctionProxy(newObject);
    }
    return newObject;
};


Context.prototype.createObjectProxy = function (newObject) {
    var objProxy = this.module._objProxies[this.path];
    if (!objProxy) {
        objProxy = this.module._objProxies[this.path] = {};
    }

    this.syncProperties(objProxy, newObject);

    objProxy.__proto__ = newObject;

    return objProxy;
};

Context.prototype.createFunctionProxy = function (newObject) {
    var path = this.path;
    this.module._currentByPath[path] = newObject;
    var fnProxy = this.module._fnProxies[path];
    if (!fnProxy) {
        var current = this.module._currentByPath;
        fnProxy = this.module._fnProxies[path] = function () {
            return current[path].apply(this, arguments);
        };
    }
    this.syncProperties(fnProxy, newObject);
    return fnProxy;
};

Context.prototype.syncProperties = function (proxy, newObject) {
    var i;
    for (i in proxy) {
        if (proxy.hasOwnProperty(i) && !newObject.hasOwnProperty(i)) {
            delete proxy[i];
        }
    }

    var props = [];
    for (i in newObject) {
        if (newObject.hasOwnProperty(i)) {
            props.push(i);
        }
    }

    if (newObject.hasOwnProperty('prototype')) {
        props.push('prototype');
    }

    for (i = 0; i < props.length; i++) {
        var prop = props[i];
        proxy[prop] = this.and(newObject, proxy, prop).createProxy(newObject[prop]);
    }
};

function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}

function isFunction(obj) {
    return typeof obj === 'function';
}

function concat(arr1, item) {
    var result = arr1.slice();
    result.push(item);
    return result;
}

module.exports = ReloadableModule;