import AbstractReloadableSource = require("./abstract-reloadable-source");
class ReloadableJSONSource extends AbstractReloadableSource {
    
    protected evaluate(source:string){
        return JSON.parse(source);
    }
}

export = ReloadableJSONSource;