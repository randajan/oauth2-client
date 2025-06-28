import { google } from "googleapis";
import { vault } from "../consts";
import { effaceScopes } from "./scopes";
import { OAuthAccount } from "./Account";
import { extendURL, fromBase64, isValidURL, toBase64, validateFn, validateURL } from "../tools";
import { RedirectError } from "../errors";


const _defaultScopes = ["openid", "userinfo.profile", "userinfo.email"];


//add to options:
// access_type - offline?
// scopes - ["openid", "userinfo.profile", "userinfo.email"] are static default
// clientId
// clientSecret
// redirectUri - backend code resolve URL
// landingUri - frontend ok redirect URL
// fallbackUri - error handling redirect will be used with query.errorCode && query.errorMessage
// onAuth - register new account, can return missing scopes by account
// onRenew - tokens auto refresh, should store at db, no return expects
// extra - will be passed to google.auth.OAuth2(...)

export class OAuthClient {

    constructor(options = {}) {
        const { isOffline, scopes, clientId, clientSecret, redirectUri, landingUri, fallbackUri, onAuth, onRenew, extra } = options;

        const _p = { };

        _p.isOffline = !!isOffline;
        _p.defaultScopes = effaceScopes(scopes, true, _defaultScopes);
        _p.landingUri = validateURL(false, landingUri, "options.landingUri");
        _p.fallbackUri = validateURL(true, fallbackUri, "options.fallbackUri");

        _p.onAuth = validateFn(true, onAuth, "options.onAuth");
        _p.onRenew = validateFn(true, onRenew, "options.onRenew");

        const commonOptions = {
            ...(extra || {}),
            clientId,
            clientSecret,
            redirectUri:validateURL(true, redirectUri, "options.redirectUri")
        }

        _p.createAuth = _=>new google.auth.OAuth2(commonOptions);
        _p.auth = _p.createAuth();

        this._fallbackRedirect = (majorCode, err)=>{
            const c = RedirectError.is(err) ? err.code : 0;
            return extendURL(_p.fallbackUri, {errorCode:majorCode*100+c, errorMessage:err.message});
        }

        vault.set(this, _p);
    }

    account(credentials) {
        return new OAuthAccount(this, credentials);
    }

    _getInitAuthURL(landingUri, scopes=[], options={}) {
        const _p = vault.get(this);

        if ((landingUri || !_p.landingUri) && !isValidURL(landingUri)) {
            throw new RedirectError(1, "Bad request. Missing valid 'landingUri'");
        }

        return _p.auth.generateAuthUrl({
            ...options,
            access_type: _p.isOffline ? "offline" : "online",
            scope: effaceScopes(scopes, true, _p.defaultScopes),
            state: toBase64(landingUri || _p.landingUri)
        });

    }

    getInitAuthURL(landingUri, scopes=[], options={}) {
        try { return this._getInitAuthURL(landingUri, scopes, options); }
        catch(err) { return this._fallbackRedirect(1, err);}
    }

    async _getExitAuthURL(code, state) {
        const _p = vault.get(this);

        if (!code) { throw new RedirectError(201, "Bad request. Missing 'code'"); }

        const landingUri = fromBase64(state);
        if (!isValidURL(landingUri)) { throw new RedirectError(202, "Bad request. Missing valid 'state'"); }

        const { tokens } = await _p.auth.getToken(code);
        const account = this.account(tokens);
        const missingScopes = await _p.onAuth(account);
        if (!missingScopes?.length) { return landingUri; }

        return this.getInitAuthURL(landingUri, missingScopes);
    }

    getExitAuthURL(code, state) {
        try { return this._getExitAuthURL(code, state); }
        catch(err) { return this._fallbackRedirect(2, err);}
    }

}