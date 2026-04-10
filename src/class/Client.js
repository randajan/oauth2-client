import { virtual } from "@randajan/props";
import { vault } from "../consts";
import { validateStr, validateFn, blacklistObj, validateObj, validateArr } from "../tools";
import { Grant } from "./Grant";

const LOCAL_BLACKLIST = [ "client", "onAuth", "onRenew", "onMagic", "onError" ];

export class Client {

    static is(any) { return any instanceof Client; }

    constructor(grantProviders=[], optionsFactory=(grantKey, grantName)=>({})) {
        const _p = {};

        _p.factory = validateFn(false, optionsFactory, "optionsFactory");
        _p.providers = new Map();
        _p.grants = new Map();

        grantProviders = validateArr(true, grantProviders, "grantProviders");

        for (const provider of grantProviders) {
            if (!Grant.isClass(provider)) {
                throw new Error("grantProviders must contain Grant subclasses");
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
        const key = validateStr(false, local.key, "options.key") || name;
        if (_p.grants.has(key)) { throw new Error(`OAuth grant key '${key}' is already in use`); }

        const computed = validateObj(true, _p.factory(key, name), "optionsFactory result");
        
        const grant = new Grant({ ...computed, ...local, client:this, key });
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
        throw new Error(`Unknown OAuth grant '${grantKey}'`);
    }

    account(grantKey, credentials={}) {
        return this.get(grantKey, true).account(credentials);
    }

    setupRoutes(callback) {
        this.grants.forEach(callback);
    }
}
