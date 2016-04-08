class ReloadableModule {
    private _objProxies:{[idx:string]:any} = {};
    private _fnProxies = {};
    private _currentByPath = {};
    private _currentProxy = null;
    private _cleanup:() => void = null;

    constructor(initial, cleanup?:() => void) {
        this.update(initial, cleanup);
    }

    update(newObject, cleanup?:() => void) {
        if (this._cleanup) {
            this._cleanup();
        }
        this._cleanup = cleanup;

        this._currentProxy = new Context(this).createProxy(newObject);
    }

    getProxied() {
        return this._currentProxy;
    }

    _getObjProxy(path:string) {
        var objProxy = this._objProxies[path];
        if (!objProxy) {
            objProxy = this._objProxies[path] = {};
        }
        return objProxy;
    }

    _getFunctionProxy(path:string, newObject:any) {
        this._currentByPath[path] = newObject;
        var fnProxy = this._fnProxies[path];
        if (!fnProxy) {
            var current = this._currentByPath;
            fnProxy = this._fnProxies[path] = function () {
                return current[path].apply(this, arguments);
            };
        }
        return fnProxy;
    }
}

class Context {

    constructor(private module:ReloadableModule, private added?, private proxies?, private path?) {
        this.added = this.added || [];
        this.proxies = this.proxies || [];
        this.path = this.path || '';
    }

    and(newObject, proxy, prop) {
        return new Context(this.module, concat(this.added, newObject), concat(this.added, proxy), this.path + '.' + prop);
    }

    getProxy(newObject) {
        var index = this.added.indexOf(newObject);
        if (index !== -1) {
            return this.proxies[index];
        }
        return null;
    }

    createProxy(newObject) {
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
    }

    createObjectProxy(newObject) {
        var objProxy = this.module._getObjProxy(this.path);

        this.syncProperties(objProxy, newObject);

        objProxy.__proto__ = newObject;

        return objProxy;
    }

    createFunctionProxy(newObject) {
        var fnProxy = this.module._getFunctionProxy(this.path, newObject);
        this.syncProperties(fnProxy, newObject);
        return fnProxy;
    }

    syncProperties(proxy, newObject) {
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
    }
}

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

export = ReloadableModule;