import ReloadableModule = require("./reloadable-module");
abstract class AbstractReloadableSource {
    private _module:ReloadableModule;

    constructor(private _firstSource:string) {
    }

    update(source:string) {
        var result = this.evaluate(source);
        this.getModule().update(result);
    }

    getModule() {
        if (!this._module) {
            this._module = new ReloadableModule(this.evaluate(this._firstSource));
            delete this._firstSource;
        }
        return this._module;
    }

    getProxied() {
        return this.getModule().getProxied();
    }

    protected abstract evaluate(source:string);
}

export = AbstractReloadableSource;