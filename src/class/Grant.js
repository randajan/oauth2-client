import { solids } from "@randajan/props";
import { RedirectError } from "../errors";
import { extendURL, isValidURL, objFromBase64, objToBase64, validateFn, validateObj, validateStr, validateURL } from "../tools";
import { Account } from "./Account";
import { Client } from "./Client";


export class Grant {

    static isClass(Class) { return typeof Class === "function" && (Class === Grant || Class.prototype instanceof Grant); }

    static name="";
    static accountId="";
    static reqClientId = true;
    static reqClientSecret = true;
    static Account = Account;

    constructor(opt={}) {
        const { name, accountId, reqClientId, reqClientSecret, Account } = this.constructor;
        const { client, key } = opt;

        if (client != null && !Client.is(client)) {
            throw new Error("options.client must be an instance of Client");
        }

        solids(this, {
            client,
            Account,
            name,
            key,
            accountId:validateStr(false, opt.accountId, "options.accountId") || accountId,
            isOffline:!!opt.isOffline,
            clientId: validateStr(reqClientId, opt.clientId, "options.clientId"),
            clientSecret: validateStr(reqClientSecret, opt.clientSecret, "options.clientSecret"),
            redirectUri: validateURL(true, opt.redirectUri, "options.redirectUri"),
            fallbackUri: validateURL(true, opt.fallbackUri, "options.fallbackUri"),
            landingUri: validateURL(false, opt.landingUri, "options.landingUri"),
            onAuth: validateFn(true, opt.onAuth, "options.onAuth"),
            onRenew: validateFn(true, opt.onRenew, "options.onRenew"),
            extra: Object.freeze(validateObj(false, opt.extra, "options.extra") || {}),
        });

    }

    _generateFallbackUrl(majorCode, err) {
        const c = RedirectError.is(err) ? err.code : 0;
        return extendURL(this.fallbackUri, {errorCode:majorCode*100+c, errorMessage:err.message});
    }

    _generateAuthUrl(state, extra={}) {

    }

    _serializeState(stateObject, landingUri) {

        if ((landingUri || !this.landingUri) && !isValidURL(landingUri)) {
            throw new RedirectError(2, "Bad request. Missing valid 'landingUri'");
        }

        return objToBase64([ landingUri || this.landingUri, stateObject ]);
    }

    async _swapCodeForTokens(code) {

    }

    async _resolveInitAuthURL(options={}) {
        const { landingUri, state:stateObj, extra } = options;
        const state = this._serializeState(stateObj, landingUri);
        return this._generateAuthUrl(state, extra || {});
    }

    async _resolveExitAuthURL({code, state}, context) {
        if (!code) { throw new RedirectError(4, "Bad request. Missing 'code'"); }

        const [ landingUri, stateObj ] = objFromBase64(state);
        if (!isValidURL(landingUri)) { throw new RedirectError(5, "Bad request. Missing valid 'state'"); }

        const tokens = await this._swapCodeForTokens(code);
        const account = this.account(tokens);


        const customUri = await this.onAuth(account, { context, landingUri, state:stateObj });
        return customUri || landingUri;
    }

    account(credentials) {
        return new this.Account(this, credentials);
    }

    async getInitAuthURL(options = {}) {
        try { return await this._resolveInitAuthURL(options); }
        catch (err) { return this._generateFallbackUrl(1, err); }
    }

    async getExitAuthURL({ code, state }, context) {
        try { return await this._resolveExitAuthURL({ code, state }, context); }
        catch (err) { return this._generateFallbackUrl(2, err); }
    }

}
