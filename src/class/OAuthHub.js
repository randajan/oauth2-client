import { vault } from "../consts";
import { validateStr, validateFn, whitelistObj, blacklistObj } from "../tools";
import { Client } from "./Client";

const LOCAL_BLACKLIST = [ "onAuth", "onRenew", "getCredentials", "onMagic" ];
const GLOBAL_WHITELIST = [ "providers", "landingUri", "fallbackUri", ...LOCAL_BLACKLIST ];

export class OAuthHub {

    constructor(options={}) {
        const _p = {};

        const opt = {...whitelistObj(GLOBAL_WHITELIST, true, options, "options")};
        const providers = opt.providers;
        delete opt.providers;

        opt.onAuth = validateFn(true, opt.onAuth, "options.onAuth");
        opt.onRenew = validateFn(true, opt.onRenew, "options.onRenew");
        opt.getCredentials = validateFn(false, opt.getCredentials, "options.getCredentials");
        
        _p.providers = new Map();
        _p.clients = new Map();
        _p.options = opt;

        if (!Array.isArray(providers) || !providers.length) {
            throw new Error("options.providers must be a non-empty array");
        }

        for (const provider of providers) {
            if (!Client.isClass(provider)) {
                throw new Error("options.providers must contain Client subclasses");
            }
            const grantName = validateStr(true, provider.Grant?.name, "Client.Grant.name");
            if (_p.providers.has(grantName)) {
                throw new Error(`OAuth provider '${grantName}' is already registered`);
            }
            _p.providers.set(grantName, provider);
        }

        vault.set(this, _p);
    }

    add(grantName, options={}) {
        const _p = vault.get(this);

        const name = validateStr(true, grantName, "grantName");
        
        const Client = _p.providers.get(name);
        if (!Client) { throw new Error(`Unknown OAuth client '${name}'`); }

        const local = blacklistObj(LOCAL_BLACKLIST, false, options, "options") || {};
        const client = new Client({ ..._p.options, ...local });

        if (_p.clients.has(client.key)) {
            throw new Error(`OAuth client key '${client.key}' is already in use`);
        }

        _p.clients.set(client.key, client);
        return client;
    }

    has(key) {
        const _p = vault.get(this);
        return _p.clients.has(validateStr(true, key, "key"));
    }

    get(key, throwError=false) {
        const _p = vault.get(this);
        key = validateStr(throwError, key, "key");
        if (!key) { return; }
        const client = _p.clients.get(key);
        if (client) { return client; }
        if (!throwError) { return; }
        throw new Error(`Unknown OAuth client '${key}'`);
    }

}

export const createOAuthHub = (options={}) => new OAuthHub(options);
