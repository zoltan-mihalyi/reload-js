var toString = Function.prototype.toString;

class ReloadableModule {
    private _objProxies:{[idx:string]:any} = {};
    private _fnProxies = {};
    private _classProxies = {};
    private _currentByPath = {};
    private _currentProxy = null;

    constructor(initial) {
        this.update(initial);
    }

    update(newObject) {
        this._currentProxy = new Context(this).createProxy(newObject);
        for (var i in this._currentProxy) {
            if (this._currentProxy.hasOwnProperty(i)) {
                newObject[i] = this._currentProxy[i];
            }
        }
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

    _getClassProxy(path:string, newObject:any) {
        this._currentByPath[path] = newObject;
        var classProxy = this._classProxies[path];
        if (!classProxy) {
            var current = this._currentByPath;

            classProxy = this._classProxies[path] = function proxy() {
                var result = new (Function.prototype.bind.apply(current[path], [null].concat(Array.prototype.slice.call(arguments, 0))));
                result.__proto__ = classProxy.prototype;
                return result;
            };
        }
        return classProxy;
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
            if (isClass(newObject)) {
                return this.createClassProxy(newObject);
            }
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

    createClassProxy(newObject) {
        var classProxy = this.module._getClassProxy(this.path, newObject);
        this.syncProperties(classProxy, newObject);
        return classProxy;
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

function isClass(obj) {
    return typeof obj === 'function' && toString.call(obj).indexOf('class') === 0;
}

function concat(arr1, item) {
    var result = arr1.slice();
    result.push(item);
    return result;
}

export = ReloadableModule;