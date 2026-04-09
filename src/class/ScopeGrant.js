import { solid, virtuals } from "@randajan/props";
import { Grant } from "./Grant";
import { validateArr } from "../tools";

export class ScopeGrant extends Grant {

    static scopePrefix="";
    static scopesCommon=[];
    static scopesNoPrefix=[];

    constructor(opt={}) {
        super(opt);

        const { scopePrefix, scopesCommon, scopesNoPrefix } = this.constructor;
        const optScopes = validateArr(false, opt.scopes, "options.scopes") || [];
        const scopesRequired = this._effaceScopes([...scopesCommon, ...optScopes]);

        solid(this, "scopePrefix", scopePrefix);

        virtuals(this, {
            scopesRequired:_=>[...scopesRequired],
            scopesNoPrefix:_=>[...scopesNoPrefix]
        });
    }

    _normalizeScope(scope) {
        if (scope == null) { return; }
        return String(scope).replace(/[\s\n\r]+/g, " ").trim().toLowerCase();
    }

    _effaceScope(scope, withPrefix=false) {
        const { scopePrefix } = this;

        scope = this._normalizeScope(scope);
        if (!scope) { return; }
        if (!scopePrefix || this.scopesNoPrefix.includes(scope)) { return scope; }

        const sw = scope.startsWith(scopePrefix);
        return (sw === withPrefix) ? scope : (withPrefix ? (scopePrefix+scope) : scope.substring(scopePrefix.length));
    }

    _effaceScopes(scopes, withPrefix=false, withRequired=false) {

        if (typeof scopes === "string") { scopes = scopes.split(" "); }
        if (!Array.isArray(scopes)) { scopes = []; }
        if (withRequired) { scopes = scopes.concat(this.scopesRequired); }

        const r = new Set();
        for (let scope of scopes) {
            scope = this._effaceScope(scope, withPrefix);
            if (scope) { r.add(scope); }
        }
        return [...r];
    }

    _generateAuthUrl(scope, state, extra={}) {

    }

    async _resolveInitAuthURL(options={}) {
        const { landingUri, state:stateObj, scopes, extra } = options;

        const state = this._serializeState(stateObj, landingUri);
        const scope = this._effaceScopes(scopes, true, true);

        return this._generateAuthUrl(scope, state, extra || {});
    }

}
