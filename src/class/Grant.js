import { RedirectError } from "../errors";
import { extendURL, isValidURL, objFromBase64, objToBase64, validateFn, validateURL } from "../tools";
import { Account } from "./Account";

export class Grant {

    static name="";
    static uidKey="";
    static Account = Account;

    constructor(client, opt={}) {
        const { name, uidKey } = this.constructor;

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
