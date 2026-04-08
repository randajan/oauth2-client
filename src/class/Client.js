import { virtual } from "@randajan/props";
import { vault } from "../consts";
import { RedirectError } from "../errors";
import { validateStr, validateFn, whitelistObj, blacklistObj } from "../tools";
import { Grant } from "./Grant";

const LOCAL_BLACKLIST = [ "onAuth", "onRenew", "onMagic" ];
const GLOBAL_WHITELIST = [ "providers", "landingUri", "fallbackUri", ...LOCAL_BLACKLIST ];

export class Client {

    static is(any) { return any instanceof Client; }

    constructor(options={}) {
        const _p = {};

        const opt = {...whitelistObj(GLOBAL_WHITELIST, true, options, "options")};
        const providers = opt.providers;
        delete opt.providers;

        opt.onAuth = validateFn(true, opt.onAuth, "options.onAuth");
        opt.onRenew = validateFn(true, opt.onRenew, "options.onRenew");

        _p.providers = new Map();
        _p.grants = new Map();
        _p.options = opt;

        if (!Array.isArray(providers) || !providers.length) {
            throw new Error("options.providers must be a non-empty array");
        }

        for (const provider of providers) {
            if (!Grant.isClass(provider)) {
                throw new Error("options.providers must contain Grant subclasses");
            }
            const grantName = validateStr(true, provider.name, "Grant.name");
            if (_p.providers.has(grantName)) {
                throw new Error(`OAuth provider '${grantName}' is already registered`);
            }
            _p.providers.set(grantName, provider);
        }

        virtual(this, "grants", _=>new Map(_p.grants));

        vault.set(this, _p);
    }

    add(grantName, options={}) {
        const _p = vault.get(this);

        const name = validateStr(true, grantName, "grantName");
        
        const Grant = _p.providers.get(name);
        if (!Grant) { throw new Error(`Unknown OAuth grant '${name}'`); }

        const local = blacklistObj(LOCAL_BLACKLIST, false, options, "options") || {};
        const grant = new Grant({ ..._p.options, ...local, client:this });

        if (_p.grants.has(grant.key)) {
            throw new Error(`OAuth grant key '${grant.key}' is already in use`);
        }

        _p.grants.set(grant.key, grant);
        return grant;
    }

    has(grantKey) {
        const _p = vault.get(this);
        return _p.grants.has(validateStr(true, grantKey, "key"));
    }

    get(grantKey, throwError=false) {
        const _p = vault.get(this);
        grantKey = validateStr(throwError, grantKey, "key");
        if (!grantKey) { return; }
        const grant = _p.grants.get(grantKey);
        if (grant) { return grant; }
        if (!throwError) { return; }
        throw new RedirectError(1, `Unknown OAuth grant '${grantKey}'`);
    }

    account(grantKey, credentials={}) {
        return this.get(grantKey, true).account(credentials);
    }

    async getInitAuthURL(grantKey, options = {}) {
        return this.get(grantKey, true)._resolveInitAuthURL(options);
    }

    async getExitAuthURL(grantKey, { code, state }, context) {
        return this.get(grantKey, true)._resolveExitAuthURL({ code, state }, context);
    }

}
