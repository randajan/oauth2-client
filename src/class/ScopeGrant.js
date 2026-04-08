import { RedirectError } from "../errors";
import { isValidURL, objToBase64 } from "../tools";
import { Grant } from "./Grant";

export class ScopeGrant extends Grant {

    static scopePrefix="";
    static scopesCommon=[];
    static scopesNoPrefix=[];

    constructor(client, opt={}) {
        super(client, opt);

        const { scopesCommon } = this.constructor;
        this.scopesRequired = this.effaceScopes([...scopesCommon, ...(opt.scopes || [])]);
    }

    normalizeScope(scope) {
        if (scope == null) { return; }
        return String(scope).replace(/[\s\n\r]+/g, " ").trim().toLowerCase();
    }

    effaceScope(scope, withPrefix=false) {
        const { scopePrefix, scopesNoPrefix } = this.constructor;

        scope = this.normalizeScope(scope);
        if (!scope) { return; }
        if (!scopePrefix || scopesNoPrefix.includes(scope)) { return scope; }

        const sw = scope.startsWith(scopePrefix);
        return (sw === withPrefix) ? scope : (withPrefix ? (scopePrefix+scope) : scope.substring(scopePrefix.length));
    }

    effaceScopes(scopes, withPrefix=false, withRequired=false) {
        const { scopesRequired } = this;

        if (typeof scopes === "string") { scopes = scopes.split(" "); }
        if (!Array.isArray(scopes)) { scopes = []; }
        if (withRequired && Array.isArray(scopesRequired)) { scopes = scopes.concat(scopesRequired); }

        const r = new Set();
        for (let scope of scopes) {
            scope = this.effaceScope(scope, withPrefix);
            if (scope) { r.add(scope); }
        }
        return [...r];
    }

    generateAuthUrl(scope, state, extra={}) {

    }

    async getInitAuthURL(options={}) {
        const { landingUri, state:stateObj, scopes, extra } = options;

        const state = this.serializeState(stateObj, landingUri);
        const scope = this.effaceScopes(scopes, true, true);

        return this.generateAuthUrl(scope, state, extra || {});
    }

}
