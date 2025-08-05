import { RedirectError } from "../errors";
import { extendURL, isValidURL, objFromBase64, objToBase64, validateFn, validateURL } from "../tools";
import { OAuth2Account } from "./OAuth2Account";

export class OAuth2Grant {

    static name="";
    static uidKey="";
    static scopePrefix="";
    static scopesCommon=[];
    static scopesNoPrefix=[];
    static Account = OAuth2Account;

    constructor(client, opt={}) {
        const { name, uidKey, scopesCommon } = this.constructor;

        this.client = client;
        this.name = opt.name || name;
        this.uidKey = opt.uidKey || uidKey;

        this.isOffline = !!opt.isOffline;
        this.clientId = opt.clientId;
        this.clientSecret = opt.clientSecret;

        this.redirectUri = validateURL(true, opt.redirectUri, "options.redirectUri");
        this.fallbackUri = validateURL(true, opt.fallbackUri, "options.fallbackUri");
        this.landingUri = validateURL(false, opt.landingUri, "options.landingUri");

        this.onAuth = validateFn(true, opt.onAuth, "options.onAuth");
        this.onRenew = validateFn(true, opt.onRenew, "options.onRenew");
        this.getCredentials = validateFn(false, opt.getCredentials, "options.getCredentials");
        this.optExtra = (opt.extra || {});
            
        this.scopesRequired = this.effaceScopes([...scopesCommon, ...(opt.scopes || [])]);
    }

    createAccount(credentials) {
        const { client, constructor:{ Account } } = this;
        return new Account(client, credentials);
    }

    effaceScope(scope, withPrefix=false) {
        const { scopePrefix, scopesNoPrefix } = this.constructor;

        if (scope == null) { return; }
        scope = String(scope).replace(/[\s\n\r]+/g, " ").trim().toLowerCase();
        if (!scopePrefix || scopesNoPrefix.includes(scope)) { return scope; }
        const sw = scope.startsWith(scopePrefix);
        return (sw === withPrefix) ? scope : (withPrefix ? (scopePrefix+scope) : scope.substring(scopePrefix.length));
    }

    effaceScopes(scopes, withPrefix=false, withRequired=false) {
        const { scopesRequired } = this;

        if (typeof scopes === "string") { scopes = scopes.split(" "); }
        if (!Array.isArray(scopes)) { scopes = []; }
        if (withRequired) { scopes = scopes.concat(scopesRequired); }

        const r = new Set();
        for (let scope of scopes) {
            if (scope) { scope = this.effaceScope(scope, withPrefix); }
            if (scope) { r.add(scope); }
        }
        return [...r];
    }

    generateAuthUrl(scope, state, extra={}) {

    }

    getInitAuthURL(options={}) {
        const { landingUri, state:stateObj, scopes, extra } = options;

        if ((landingUri || !this.landingUri) && !isValidURL(landingUri)) {
            throw new RedirectError(1, "Bad request. Missing valid 'landingUri'");
        }

        const scope = this.effaceScopes(scopes, true, true);
        const state = objToBase64([ landingUri || this.landingUri, stateObj ]);

        return this.generateAuthUrl(scope, state, extra || {});
    }

    async swapCodeForTokens(code) {

    }

    async getExitAuthURL({code, state}, context) {
        if (!code) { throw new RedirectError(201, "Bad request. Missing 'code'"); }

        const [ landingUri, stateObj ] = objFromBase64(state);
        if (!isValidURL(landingUri)) { throw new RedirectError(202, "Bad request. Missing valid 'state'"); }

        const tokens = await this.swapCodeForTokens(code);
        const account = this.createAccount(tokens);
        
        const customUri = await this.onAuth(account, { context, landingUri, state:stateObj });
        return customUri || landingUri;
    }
    
    fallbackRedirect(majorCode, err) {
        const c = RedirectError.is(err) ? err.code : 0;
        return extendURL(this.fallbackUri, {errorCode:majorCode*100+c, errorMessage:err.message});
    }

}