import { solids } from "@randajan/props";
import { RedirectError } from "../errors";
import { extendURL, objFromSignedBase64Url, objToSignedBase64Url, validateFn, validateObj, validateStr, validateURL, wrapValidatorURL } from "../tools";
import { Account } from "./Account";
import { Client } from "./Client";


export class Grant {

    static isClass(Class) { return typeof Class === "function" && (Class === Grant || Class.prototype instanceof Grant); }

    static name="";
    static reqClientId = true;
    static reqClientSecret = true;
    static Account = Account;

    constructor(opt={}) {
        const { name, reqClientId, reqClientSecret, Account } = this.constructor;
        const { client, key } = opt;

        const landingUri = validateURL(false, opt.landingUri, "options.landingUri");
        const landingUriValidator = validateFn(false, opt.landingUriValidator, "options.landingUriValidator");

        if (client != null && !Client.is(client)) {
            throw new Error("options.client must be an instance of Client");
        }
        if (!landingUri && !landingUriValidator) {
            throw new Error("options.landingUriValidator is required when options.landingUri is not set");
        }

        const initUri = validateURL(true, opt.initUri, "options.initUri");
        const exitUri = validateURL(true, opt.exitUri, "options.exitUri");

        solids(this, {
            client,
            Account,
            name,
            key:validateStr(false, key, "options.key") || name,
            isOffline:!!opt.isOffline,
            clientId: validateStr(reqClientId, opt.clientId, "options.clientId"),
            clientSecret: validateStr(reqClientSecret, opt.clientSecret, "options.clientSecret"),
            initUri,
            exitUri,
            initPath:new URL(initUri).pathname,
            exitPath:new URL(exitUri).pathname,
            failureUri: validateURL(true, opt.failureUri, "options.failureUri"),
            landingUri,
            landingUriValidator: wrapValidatorURL(landingUriValidator || (uri=>(uri === landingUri))),
            formatProfile: validateFn(false, opt.formatProfile, "options.formatProfile") || (p=>p),
            onAuth: validateFn(true, opt.onAuth, "options.onAuth"),
            onRenew: validateFn(true, opt.onRenew, "options.onRenew"),
            onError: validateFn(false, opt.onError, "options.onError") || (()=>{}),
            extra: Object.freeze(validateObj(false, opt.extra, "options.extra") || {}),
        });

        if (landingUri && landingUriValidator && !this.landingUriValidator(landingUri, landingUri)) {
            throw new Error("options.landingUri is not allowed by landingUriValidator");
        }

    }



    _handleError(majorCode, err, options={}) {
        const { onError } = this;

        const isKnownError = RedirectError.is(err);
        const errorCode = majorCode * 100 + (isKnownError ? err.code : 0);
        const publicMessage = isKnownError ? err.message : "Unknown error";

        try {

            const handler = onError(err, {
                options,
                errorCode,
                isKnownError,
                publicMessage
            });

            if (handler instanceof Promise) { handler.catch(()=>{}); }
        } catch {}

        return this._generateFallbackUrl(errorCode, publicMessage);
    }

    _generateFallbackUrl(errorCode, errorMessage) {
        return extendURL(this.failureUri, {errorCode, errorMessage});
    }

    _generateAuthUrl(signedState, extra={}) {

    }
    _signState(stateObject, landingUri) {
        landingUri = landingUri || this.landingUri;
        if (!this.landingUriValidator(landingUri, this.landingUri)) {
            throw new RedirectError(1, "Bad request. Invalid 'landingUri'");
        }
        return objToSignedBase64Url([ landingUri, stateObject ], this.clientSecret);
    }

    _readState(state) {
        let payload;

        try {
            payload = objFromSignedBase64Url(state, this.clientSecret);
        } catch (err) {
            throw new RedirectError(3, "Bad request. Untrusted 'state'");
        }

        if (!Array.isArray(payload) || !payload.length) {
            throw new RedirectError(2, "Bad request. Invalid 'state'");
        }

        const [ landingUri, stateObject ] = payload;

        if (!this.landingUriValidator(landingUri, this.landingUri)) {
            throw new RedirectError(1, "Bad request. Invalid 'landingUri'");
        }

        return [ landingUri, stateObject ];
    }

    async _swapCodeForTokens(code) {

    }

    async _resolveInitURL(query = {}, options = {}) {
        const { state, landingUri } = query;
        const { extra } = options;
        const signedState = this._signState(state, landingUri);
        return this._generateAuthUrl(signedState, extra || {});
    }

    async _resolveExitURL(query = {}, options = {}) {
        const { code, state } = query;
        if (!code) { throw new RedirectError(4, "Bad request. Missing 'code'"); }

        const [ landingUri, unsignedState ] = this._readState(state);
        const tokens = await this._swapCodeForTokens(code);
        const account = this.account(tokens);


        const customUri = await this.onAuth(account, { options, landingUri, state:unsignedState });
        return customUri || landingUri;
    }

    account(credentials) {
        return new this.Account(this, credentials);
    }

    async getInitURL(query = {}, options = {}) {
        try { return await this._resolveInitURL(query, options); }
        catch (err) { return this._handleError(1, err, options); }
    }

    async getExitURL(query = {}, options = {}) {
        try { return await this._resolveExitURL(query, options); }
        catch (err) { return this._handleError(2, err, options); }
    }

}
