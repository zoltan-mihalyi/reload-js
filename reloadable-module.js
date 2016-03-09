function Context(added, proxies) {
    this.added = added || [];
    this.proxies = proxies || [];
}
Context.prototype.and = function (newObject, proxy) {
    return new Context(this.added.concat(newObject), this.proxies.concat(proxy));
};

Context.prototype.getProxy = function (newObject) {
    var index = this.added.indexOf(newObject);
    if (index !== -1) {
        return this.proxies[index];
    }
    return null;
};

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

    this._currentProxy = this.createProxy(newObject, '', new Context());
};

ReloadableModule.prototype.createProxy = function (newObject, path, context) {
    var proxy = context.getProxy(newObject);
    if (proxy) {
        return proxy;
    }
    if (isObject(newObject)) {
        return this.createObjectProxy(newObject, path, context);
    } else if (isFunction(newObject)) {
        return this.createFunctionProxy(newObject, path, context);
    }
    return newObject;
};

ReloadableModule.prototype.createObjectProxy = function (newObject, path, context) {
    var objProxy = this._objProxies[path];
    if (!objProxy) {
        objProxy = this._objProxies[path] = {};
    }

    this.syncProperties(objProxy, newObject, path, context);

    objProxy.__proto__ = newObject;

    return objProxy;
};

ReloadableModule.prototype.createFunctionProxy = function (newObject, path, context) {
    this._currentByPath[path] = newObject;
    var fnProxy = this._fnProxies[path];
    if (!fnProxy) {
        var current = this._currentByPath;
        fnProxy = this._fnProxies[path] = function () {
            return current[path].apply(this, arguments);
        };
    }
    this.syncProperties(fnProxy, newObject, path, context);
    return fnProxy;
};

ReloadableModule.prototype.syncProperties = function (proxy, newObject, path, context) {
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
        proxy[prop] = this.createProxy(newObject[prop], path + '.' + prop, context.and(newObject, proxy));
    }
};

function isObject(obj) {
    return obj !== null && typeof obj === 'object';
}

function isFunction(obj) {
    return typeof obj === 'function';
}

module.exports = ReloadableModule;