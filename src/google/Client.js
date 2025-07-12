import { google } from "googleapis";
import { vault } from "../consts";
import { _defaultScopes, effaceScopes } from "./scopes";
import { GoogleAccount } from "./Account";
import { extendURL, isValidURL, objFromBase64, objToBase64, validateFn, validateURL } from "../tools";
import { RedirectError } from "../errors";


//add to options:
// access_type - offline?
// scopes - ["openid", "userinfo.profile", "userinfo.email"] are static default
// clientId
// clientSecret
// redirectUri - backend code resolve URL
// landingUri - frontend ok redirect URL
// fallbackUri - error handling redirect will be used with query.errorCode && query.errorMessage
// onAuth - register new account, can return customUri redirect
// onRenew - tokens auto refresh, should store at db, no return expects
// extra - will be passed to google.auth.OAuth2(...)

export class GoogleOAuth2 {

    constructor(options = {}) {
        const {
            isOffline, scopes, clientId, clientSecret,
            redirectUri, landingUri, fallbackUri,
            onAuth, onRenew, getCredentials, extra
        } = options;

        const _p = { };

        _p.isOffline = !!isOffline;
        _p.defaultScopes = effaceScopes(scopes, true, _defaultScopes);
        _p.landingUri = validateURL(false, landingUri, "options.landingUri");
        _p.fallbackUri = validateURL(true, fallbackUri, "options.fallbackUri");

        _p.onAuth = validateFn(true, onAuth, "options.onAuth");
        _p.onRenew = validateFn(true, onRenew, "options.onRenew");
        _p.getCredentials = validateFn(false, getCredentials, "options.getCredentials");

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

    account(credentials, ...args) {
        const { getCredentials } = vault.get(this);
        const c = getCredentials ? getCredentials(credentials, ...args) : credentials;
        return (c instanceof Promise) ? c.then(cr=>new GoogleAccount(this, cr)) : new GoogleAccount(this, c);
    }

    _getInitAuthURL(options={}) {
        const _p = vault.get(this);
        const { landingUri, state, scopes, extra } = options;

        if ((landingUri || !_p.landingUri) && !isValidURL(landingUri)) {
            throw new RedirectError(1, "Bad request. Missing valid 'landingUri'");
        }

        return _p.auth.generateAuthUrl({
            ...(extra || {}),
            access_type: _p.isOffline ? "offline" : "online",
            scope: effaceScopes(scopes, true, _p.defaultScopes),
            state: objToBase64([ landingUri || _p.landingUri, state ])
        });

    }

    getInitAuthURL(options={}) {
        try { return this._getInitAuthURL(options); }
        catch(err) { return this._fallbackRedirect(1, err);}
    }

    async _getExitAuthURL({code, state}, context) {
        const _p = vault.get(this);

        if (!code) { throw new RedirectError(201, "Bad request. Missing 'code'"); }

        const [ landingUri, passedState ] = objFromBase64(state);
        if (!isValidURL(landingUri)) { throw new RedirectError(202, "Bad request. Missing valid 'state'"); }

        const { tokens } = await _p.auth.getToken(code);
        const account = new GoogleAccount(this, tokens);
        
        const customUri = await _p.onAuth(account, { context, state:passedState });
        return customUri || landingUri;
    }

    getExitAuthURL({code, state}, context) {
        try { return this._getExitAuthURL({ code, state }, context); }
        catch(err) { return this._fallbackRedirect(2, err);}
    }

}