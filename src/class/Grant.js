import { RedirectError } from "../errors";
import { extendURL, isValidURL, objFromBase64, objToBase64, validateFn, validateObj, validateStr, validateURL, wrapFnWith } from "../tools";
import { Account } from "./Account";


export class Grant {

    static name="";
    static accIdKey="";
    static reqClientId = true;
    static reqClientSecret = true;
    static Account = Account;

    constructor(client, opt={}) {
        const { name, accIdKey, reqClientId, reqClientSecret } = this.constructor;

        this.client = client;
        this.name = name;
        this.key = validateStr(false, opt.key, "options.key") || name;
        this.accIdKey = validateStr(false, opt.accIdKey, "options.accIdKey") || accIdKey;

        this.isOffline = !!opt.isOffline;
        this.clientId = validateStr(reqClientId, opt.clientId, "options.clientId");
        this.clientSecret = validateStr(reqClientSecret, opt.clientSecret, "options.clientSecret");

        this.redirectUri = validateURL(true, opt.redirectUri, "options.redirectUri");
        this.fallbackUri = validateURL(true, opt.fallbackUri, "options.fallbackUri");
        this.landingUri = validateURL(false, opt.landingUri, "options.landingUri");

        this.onAuth = wrapFnWith(validateFn(true, opt.onAuth, "options.onAuth"), client);
        this.onRenew = wrapFnWith(validateFn(true, opt.onRenew, "options.onRenew"), client);
        this.getCredentials = wrapFnWith(validateFn(false, opt.getCredentials, "options.getCredentials") || ((_, c)=>c), client);
        this.optExtra = validateObj(false, opt.extra, "options.extra") || {};
    }

    createAccount(credentials) {
        const { client, constructor:{ Account } } = this;
        return new Account(client, credentials);
    }

    generateAuthUrl(state, extra={}) {

    }

    serializeState(stateObject, landingUri) {

        if ((landingUri || !this.landingUri) && !isValidURL(landingUri)) {
            throw new RedirectError(1, "Bad request. Missing valid 'landingUri'");
        }

        return objToBase64([ landingUri || this.landingUri, stateObject ]);
    }

    async getInitAuthURL(options={}) {
        const { landingUri, state:stateObj, extra } = options;
        const state = this.serializeState(stateObj, landingUri);
        return this.generateAuthUrl(state, extra || {});
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
